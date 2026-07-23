import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, catchError, finalize, filter, fromEvent, of, switchMap, take, throwError, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthApiService } from './auth.api.service';
import { AuthTokenService } from './auth-token.service';
import { UserService } from './user.service';
import { TabActivityService } from './tab-activity.service';
import { SessionService } from './session.service';
import { LoginCredentials } from '../models/login-credentials';
import { LoginSuccessResponse } from '../models/login-success-response';
import { RegistrationDetails } from '../models/registration-details';
import { RefreshTokenRequest } from '../models/refresh-token-request';
import { SessionInfo, UserInfo } from '../models/user-info';
import { CORE_CONFIG } from '../../config/core-config.token';
import { CoreConfig } from '../../config/core-config';
import { StorageKey } from '../enums/storage-keys.enum';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  userId?: string;
  sub?: string;
  username?: string;
  name?: string;
  tenantId?: string;
  tenantCode?: string;
  sessionId?: string;
  roles?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authState$: BehaviorSubject<boolean>;
  private isRefreshing = false;
  private refreshSubject = new Subject<string | null>();
  private readonly tabId = Math.random().toString(36).slice(2);
  private readonly REFRESH_LOCK_KEY = 'auth_refresh_lock';
  private readonly REFRESH_LOCK_TTL_MS = 30_000;

  private sessionTimer?: ReturnType<typeof setTimeout>;
  private silentRefreshTimer?: ReturnType<typeof setTimeout>;
  private activityPollInterval?: ReturnType<typeof setInterval>;

  private readonly ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
  private readonly PRE_EXPIRY_BUFFER_MS = 10 * 1000;
  private readonly ACTIVITY_POLL_MS = 15 * 1000;

  constructor(
    private readonly api: AuthApiService,
    private readonly tokenService: AuthTokenService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly tabActivity: TabActivityService,
    @Inject(CORE_CONFIG) private readonly config: CoreConfig
  ) {
    const initial = !!this.tokenService.getAccessToken() && !this.tokenService.isAccessTokenExpired();
    this.authState$ = new BehaviorSubject<boolean>(initial);

    if (initial) {
      this.updateUserFromToken();
    }

    this.restoreTokenLifecycle();
    this.listenToStorageEvents();
  }

  login(payload: LoginCredentials, rememberMe: boolean): Observable<LoginSuccessResponse> {
    return this.api.login(payload).pipe(
      tap((res) => this.handleLoginResponse(res, rememberMe))
    );
  }

  register(payload: RegistrationDetails): Observable<RegistrationDetails> {
    return this.api.register(payload);
  }

  checkNamespace(companyName: string): Observable<{ available: boolean }> {
    return this.api.checkNamespace(companyName);
  }

  logout(navigateTo = '/auth/login', clearReturnUrl = true): void {
    if (this.config.auth.enableActivitySilentRefresh) {
      this.api.logout().pipe(
        catchError(() => of(null)),
        take(1),
        finalize(() => {
          this.cleanupOnLogout();
          if (clearReturnUrl) {
            sessionStorage.removeItem('returnUrl');
          }
          this.router.navigate([navigateTo]);
        })
      ).subscribe();
    } else {
      this.cleanupOnLogout();
      if (clearReturnUrl) {
        sessionStorage.removeItem('returnUrl');
      }
      this.router.navigate([navigateTo]);
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken() && !this.tokenService.isAccessTokenExpired();
  }

  canRefresh(): boolean {
    return this.tokenService.hasRefreshToken() && !this.tokenService.isRefreshTokenExpired();
  }

  authStateChanges(): Observable<boolean> {
    return this.authState$.asObservable();
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  /** Interceptor-triggered (e.g. on 401) refresh — still supported, now uses the new payload contract. */
  refreshToken(): Observable<string | null> {
    if (!this.canRefresh()) {
      this.logout();
      return of(null);
    }

    // Single enforcement point for the 5-minute, tab-level activity rule.
    // attemptSilentRefresh() already checks this before calling in, but the
    // interceptor calls refreshToken() directly on a 401 — gating here too
    // means neither path can bypass it. Only applies to projects that opted
    // into the activity-based flow; legacy timer-based projects are unaffected.
    if (
      this.config?.auth?.enableActivitySilentRefresh
      && !this.tabActivity.isActiveWithin(this.ACTIVITY_WINDOW_MS)
    ) {
      this.logout();
      return of(null);
    }

    const request = this.buildRefreshRequest();
    if (!request) {
      this.logout();
      return of(null);
    }

    if (this.isRefreshing) {
      return this.refreshSubject.pipe(take(1));
    }

    if (!this.tryAcquireRefreshLock()) {
      return this.waitForExternalRefresh();
    }

    this.isRefreshing = true;

    return this.api.refreshToken(request).pipe(
      switchMap((res) => {
        const rememberMe = this.tokenService.isRemembered();
        this.handleLoginResponse(res, rememberMe);
        this.refreshSubject.next(res.accessToken);
        return of(res.accessToken);
      }),
      catchError((err) => {
        this.refreshSubject.next(null);
        this.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        this.isRefreshing = false;
        this.clearRefreshLock();
      })
    );
  }

  private handleLoginResponse(res: LoginSuccessResponse, rememberMe: boolean): void {
    if (!res) {
      return;
    }

    // sessionId/tenantCode on the JWT are only required to build refresh
    // requests for the activity-based silent-refresh flow. Projects that
    // don't use that flow (or have no refresh token at all) must still be
    // able to log in even if the token doesn't carry those claims.
    const requiresSession = !!this.config?.auth?.enableActivitySilentRefresh;
    const session = this.extractSessionInfo(res.accessToken, rememberMe);

    if (requiresSession && !session) {
      this.logout();
      return;
    }

    this.persistTokens(res, session, rememberMe);
    this.userService.setUser(this.buildUserFromToken(res.accessToken));
    this.authState$.next(true);
    this.scheduleTokenLifecycle(res.expiresIn ?? 3600);
  }

  private persistTokens(res: LoginSuccessResponse, session: SessionInfo | null, rememberMe: boolean): void {
    const expiresIn = res.expiresIn ?? 3600;
    this.tokenService.setAccessToken(res.accessToken, expiresIn, rememberMe);

    if (session) {
      this.tokenService.setSession(session);
    }

    if (res.refreshToken) {
      const refreshExpiresIn = typeof res.refreshExpires === 'number' && Number.isFinite(res.refreshExpires)
        ? res.refreshExpires
        : expiresIn;
      this.tokenService.setRefreshToken(res.refreshToken, refreshExpiresIn, rememberMe);
    } else {
      this.tokenService.setRefreshToken(null, 0);
    }
  }

  private extractSessionInfo(accessToken: string, rememberMe: boolean): SessionInfo | null {
    const payload = this.decodeJwt<JwtPayload>(accessToken);
    if (!payload?.sessionId || !payload?.tenantCode) {
      return null;
    }

    return {
      sessionId: payload.sessionId,
      tenantCode: payload.tenantCode,
      rememberMe,
    };
  }

  private buildRefreshRequest(): RefreshTokenRequest | null {
    const refreshToken = this.tokenService.getRefreshToken();
    const session = this.tokenService.getSession();

    if (!refreshToken || !session) {
      return null;
    }

    return {
      refreshToken,
      tenantCode: session.tenantCode,
      sessionId: session.sessionId,
      isActive: this.tabActivity.isActiveWithin(this.ACTIVITY_WINDOW_MS),
    };
  }

  // ── Lifecycle scheduling ────────────────────────────────

  private restoreTokenLifecycle(): void {
    const expiresAt = this.tokenService.getTokenExpiryTime();
    if (!expiresAt) {
      return;
    }

    const remainingSeconds = Math.max((expiresAt - Date.now()) / 1000, 0);
    this.scheduleTokenLifecycle(remainingSeconds);
  }

  private scheduleTokenLifecycle(expiresInSeconds: number): void {
    this.clearTimers();

    if (this.config?.auth?.enableActivitySilentRefresh) {
      const delay = Math.max(expiresInSeconds * 1000 - this.PRE_EXPIRY_BUFFER_MS, 0);
      this.silentRefreshTimer = setTimeout(() => this.attemptSilentRefresh(), delay);
      return;
    }

    this.startSessionTimer(expiresInSeconds);
  }

  private attemptSilentRefresh(): void {
    if (!this.canRefresh()) {
      this.logout();
      return;
    }

    if (this.tabActivity.isActiveWithin(this.ACTIVITY_WINDOW_MS)) {
      this.refreshToken().subscribe({
        next: () => {},
        error: () => this.logout(),
      });
      return;
    }

    this.activityPollInterval = setInterval(() => {
      if (!this.canRefresh()) {
        this.clearActivityPoll();
        this.logout();
        return;
      }

      if (this.tabActivity.isActiveWithin(this.ACTIVITY_WINDOW_MS)) {
        this.clearActivityPoll();
        this.refreshToken().subscribe({
          next: () => {},
          error: () => this.logout(),
        });
      }
    }, this.ACTIVITY_POLL_MS);
  }

  private waitForExternalRefresh(): Observable<string | null> {
    return fromEvent<StorageEvent>(window, 'storage').pipe(
      filter((event) => event.key === this.REFRESH_LOCK_KEY || event.key === StorageKey.ACCESS_TOKEN),
      take(1),
      switchMap(() => {
        const token = this.tokenService.getAccessToken();
        return token && !this.tokenService.isAccessTokenExpired() ? of(token) : of(null);
      })
    );
  }

  private tryAcquireRefreshLock(): boolean {
    if (!this.tokenService.isRemembered()) {
      return true;
    }

    try {
      const payload = localStorage.getItem(this.REFRESH_LOCK_KEY);
      if (payload) {
        const lock = JSON.parse(payload) as { tabId: string; timestamp: number };
        const isStale = Date.now() - lock.timestamp > this.REFRESH_LOCK_TTL_MS;
        if (!isStale && lock.tabId !== this.tabId) {
          return false;
        }
      }

      localStorage.setItem(this.REFRESH_LOCK_KEY, JSON.stringify({ tabId: this.tabId, timestamp: Date.now() }));
      return true;
    } catch {
      return true;
    }
  }

  private clearRefreshLock(): void {
    if (!this.tokenService.isRemembered()) {
      return;
    }

    try {
      const payload = localStorage.getItem(this.REFRESH_LOCK_KEY);
      if (!payload) {
        return;
      }

      const lock = JSON.parse(payload) as { tabId: string };
      if (lock.tabId === this.tabId) {
        localStorage.removeItem(this.REFRESH_LOCK_KEY);
      }
    } catch {
      // no-op
    }
  }

  private cleanupOnLogout(): void {
    this.clearRefreshLock();
    this.clearTimers();
    this.tokenService.clear();
    this.userService.clearUserData();
    this.authState$.next(false);
  }

  private listenToStorageEvents(): void {
    window.addEventListener('storage', this.onStorageEvent.bind(this));
  }

  private onStorageEvent(event: StorageEvent): void {
    if (!event.key) {
      return;
    }

    const trackedKeys = [
      StorageKey.ACCESS_TOKEN,
      StorageKey.REFRESH_TOKEN,
      StorageKey.SESSION_ID,
      StorageKey.TENANT_CODE,
      StorageKey.REMEMBER_ME,
    ];

    if (trackedKeys.includes(event.key as StorageKey) || event.key === this.REFRESH_LOCK_KEY) {
      this.handleExternalTokenUpdate();
    }
  }

  private handleExternalTokenUpdate(): void {
    const isActive = this.isAuthenticated();

    if (!isActive) {
      this.clearTimers();
      this.userService.clearUserData();
      this.authState$.next(false);
      return;
    }

    this.updateUserFromToken();
    this.authState$.next(true);
    this.restoreTokenLifecycle();
  }

  private updateUserFromToken(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      return;
    }

    const payload = this.decodeJwt<JwtPayload>(token);
    if (!payload) {
      this.logout();
      return;
    }

    this.userService.setUser(this.buildUserFromPayload(payload));
  }

  private buildUserFromToken(token: string): UserInfo {
    const payload = this.decodeJwt<JwtPayload>(token);
    if (!payload) {
      throw new Error('Unable to decode access token payload.');
    }
    return this.buildUserFromPayload(payload);
  }

  private buildUserFromPayload(payload: JwtPayload): UserInfo {
    return {
      userId: payload.userId ?? payload.sub ?? '',
      username: payload.username ?? payload.name ?? '',
      tenantId: payload.tenantId ?? '',
      tenantCode: payload.tenantCode ?? '',
      roles: Array.isArray(payload.roles) ? payload.roles : payload.roles ? [payload.roles] : [],
    };
  }

  private decodeJwt<T>(token: string): T | null {
    try {
      return jwtDecode<T>(token);
    } catch {
      return null;
    }
  }

  /** Legacy 60s-before-expiry UI warning (unchanged, used only when the new flow is off). */
  private startSessionTimer(expiresInSeconds: number): void {
    const warningBeforeExpiry = 60 * 1000;
    const timeout = expiresInSeconds * 1000 - warningBeforeExpiry;
    if (timeout <= 0) return;

    this.sessionTimer = setTimeout(() => {
      console.warn('Session Expiring');
      this.sessionService.markExpired();
    }, timeout);
  }

  private clearTimers(): void {
    if (this.sessionTimer) { clearTimeout(this.sessionTimer); this.sessionTimer = undefined; }
    if (this.silentRefreshTimer) { clearTimeout(this.silentRefreshTimer); this.silentRefreshTimer = undefined; }
    this.clearActivityPoll();
  }

  private clearActivityPoll(): void {
    if (this.activityPollInterval) {
      clearInterval(this.activityPollInterval);
      this.activityPollInterval = undefined;
    }
  }
}