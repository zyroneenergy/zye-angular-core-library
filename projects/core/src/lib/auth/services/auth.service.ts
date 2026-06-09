import { Injectable } from "@angular/core";
import { AuthTokenService } from "./auth-token.service";
import { BehaviorSubject, catchError, filter, Observable, of, Subject, switchMap, take, tap, throwError } from "rxjs";
import { Router } from "@angular/router";
import { AuthApiService } from "./auth.api.service";
import { LoginCredentials } from "../models/login-credentials";
import { LoginSuccessResponse } from "../models/login-success-response";
import { RegistrationDetails } from "../models/registration-details";

/**
 * Core authentication service that manages user authentication state
 * and coordinates between token management and API calls.
 */
@Injectable({
  providedIn: "root",
})
export class AuthService {
  /** Current authentication state (true = authenticated). */
  private authState$: BehaviorSubject<boolean>;

  /** Prevents concurrent refresh requests. */
  private isRefreshing = false;

  /** Emits the access token (or null) to callers waiting for a refresh. */
  private refreshSubject = new Subject<string | null>();

  constructor(
    private readonly api: AuthApiService,
    private readonly tokenService: AuthTokenService,
    private readonly router: Router,
  ) {
    // Initialize auth state now that tokenService is available
    const initial = !!this.tokenService.getAccessToken() && !this.tokenService.isAccessTokenExpired();
    this.authState$ = new BehaviorSubject<boolean>(initial);
  }

  /**
   * Call API to authenticate and persist tokens on success.
   * @param payload Login credentials
   * @param rememberMe whether to persist tokens in localStorage (true) or sessionStorage (false)
   * @returns Observable with login response
   */
  login(payload: LoginCredentials, rememberMe = true): Observable<LoginSuccessResponse> {
    return this.api.login(payload).pipe(
      tap((res) => {
        this.handleLoginResponse(res, rememberMe);
      })
    );
  }


  /** Register a new account. */
  register(payload: RegistrationDetails): Observable<RegistrationDetails> {
    return this.api.register(payload);
  }


  /** Check if a company namespace is available. */
  checkNamespace(companyName: string): Observable<{ available: boolean }> {
    return this.api.checkNamespace(companyName);
  }

  /** Clear tokens and navigate to the provided route*/
  logout(navigateTo = '/auth/login'): void {
    this.tokenService.clear();
    this.authState$.next(false);
    this.router.navigate([navigateTo]);
  }


  /** Synchronous check for a valid (non-expired) access token. */
  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken() && !this.tokenService.isAccessTokenExpired();
  }


  /** Observable for authentication state changes. */
  authStateChanges(): Observable<boolean> {
    return this.authState$.asObservable();
  }


  /** Convenience: returns current access token or null. */
  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }


  /** Persist tokens from login response and set auth state to true. */
  private handleLoginResponse(res: LoginSuccessResponse, rememberMe = true) {
    if (!res) return;
    const expiresIn = res.expiresIn || 3600; // fallback 1 hour
    this.tokenService.setAccessToken(res.accessToken, expiresIn, rememberMe);

    if (res.refreshToken) this.tokenService.setRefreshToken(res.refreshToken, rememberMe);

    this.authState$.next(true);
  }


  /**
   * Refresh the access token. Returns new access token or null on failure.
   * - Uses a queue to avoid concurrent refresh calls.
   */
  refreshToken(): Observable<string | null> {
    const refresh = this.tokenService.getRefreshToken();
    if (!refresh) {
      this.logout();
      return of(null);
    }
    // If another refresh is in progress, wait for it
    if (this.isRefreshing) {
      return this.refreshSubject.pipe(
        filter(token => token !== undefined),
        take(1)
      );
    }
    this.isRefreshing = true;
    // Determine remember choice based on where tokens currently live
    const rememberMe = this.tokenService.isRemembered();
    return this.api.refreshToken(refresh).pipe(
      tap((res) => {
        // Respect the user's original storage choice (rememberMe) when storing refreshed tokens
        this.tokenService.setAccessToken(res.accessToken, res.expiresIn, rememberMe);
        if (res.refreshToken) this.tokenService.setRefreshToken(res.refreshToken, rememberMe);

        this.refreshSubject.next(res.accessToken);
        this.authState$.next(true);
        this.isRefreshing = false;
      }),
      catchError((err) => {
        this.isRefreshing = false;
        this.tokenService.clear();
        this.authState$.next(false);
        this.refreshSubject.next(null);
        this.logout();
        return throwError(() => err);
      }),
      switchMap((res) => of(res.accessToken))
    );
  }
}
