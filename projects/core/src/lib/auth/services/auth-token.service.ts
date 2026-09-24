import { Injectable } from '@angular/core';
import { StorageKey } from '../enums/storage-keys.enum';
import { SessionInfo } from '../models/user-info';

/**
 * A service class that manages auth token persistence and associated session metadata.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthTokenService {
  private readonly ACCESS_TOKEN_KEY = StorageKey.ACCESS_TOKEN;
  private readonly REFRESH_TOKEN_KEY = StorageKey.REFRESH_TOKEN;
  private readonly ACCESS_TOKEN_EXPIRES_AT_KEY = StorageKey.TOKEN_EXPIRES_AT;
  private readonly REFRESH_TOKEN_EXPIRES_AT_KEY = StorageKey.REFRESH_TOKEN_EXPIRES_AT;
  private readonly REMEMBER_ME_KEY = StorageKey.REMEMBER_ME;
  private readonly SESSION_ID_KEY = StorageKey.SESSION_ID;
  private readonly TENANT_CODE_KEY = StorageKey.TENANT_CODE;

  constructor() {}

  /**
   * Tokens always live in localStorage now — see the class doc comment for
   * why. Kept as a method (not inlined) so callers don't have to know that.
   */
  getPreferredStorage(): Storage {
    return this.currentStorage;
  }

  getRememberMe(): boolean {
    const rememberMe = this.currentStorage.getItem(this.REMEMBER_ME_KEY);
    return rememberMe === 'true';
  }

  /** Convenience boolean: true if this session was persisted with "Remember me". */
  isRemembered(): boolean {
    return this.getRememberMe();
  }

  setAccessToken(token: string | null, expiresInSeconds?: number, rememberMe = true): void {
    if (!token) {
      this.clearAccessToken();
      return;
    }

    const storage = this.currentStorage;
    storage.setItem(this.ACCESS_TOKEN_KEY, token);

    if (typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds)) {
      storage.setItem(this.ACCESS_TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    } else {
      storage.removeItem(this.ACCESS_TOKEN_EXPIRES_AT_KEY);
    }

    // One-time migration cleanup: earlier versions kept un-remembered
    // sessions in sessionStorage (tab-scoped, so a pasted URL in a new tab
    // landed back on the login page). Clear any leftovers from that so a
    // stale sessionStorage copy can never shadow the real one.
    this.clearAccessTokenFrom(sessionStorage);
  }

  getAccessToken(): string | null {
    return this.currentStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }

  setRefreshToken(token: string | null, expiresInSeconds?: number, rememberMe = true): void {
    if (!token) {
      this.clearRefreshToken();
      return;
    }

    const storage = this.currentStorage;
    storage.setItem(this.REFRESH_TOKEN_KEY, token);

    if (typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds)) {
      storage.setItem(this.REFRESH_TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    } else {
      storage.removeItem(this.REFRESH_TOKEN_EXPIRES_AT_KEY);
    }

    this.clearRefreshTokenFrom(sessionStorage);
  }

  getRefreshToken(): string | null {
    return this.currentStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  getTokenExpiryTime(): number {
    return Number(this.currentStorage.getItem(this.ACCESS_TOKEN_EXPIRES_AT_KEY) ?? 0);
  }

  isAccessTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiryTime();
    return expiresAt === 0 || Date.now() > expiresAt;
  }

  getRefreshTokenExpiryTime(): number {
    return Number(this.currentStorage.getItem(this.REFRESH_TOKEN_EXPIRES_AT_KEY) ?? 0);
  }

  isRefreshTokenExpired(): boolean {
    const expiresAt = this.getRefreshTokenExpiryTime();
    return expiresAt === 0 || Date.now() > expiresAt;
  }

  setSession(session: SessionInfo): void {
    const storage = this.currentStorage;
    storage.setItem(this.SESSION_ID_KEY, session.sessionId);
    storage.setItem(this.TENANT_CODE_KEY, session.tenantCode);
    storage.setItem(this.REMEMBER_ME_KEY, String(session.rememberMe));
    this.clearSessionFrom(sessionStorage);
  }

  /** Independent of setSession() — a login can succeed (and needs its
   *  "remember me" choice recorded) even when the JWT carries no
   *  sessionId/tenantCode to build a SessionInfo from. */
  setRememberMe(rememberMe: boolean): void {
    this.currentStorage.setItem(this.REMEMBER_ME_KEY, String(rememberMe));
    sessionStorage.removeItem(this.REMEMBER_ME_KEY);
  }

  getSessionId(): string | null {
    return this.currentStorage.getItem(this.SESSION_ID_KEY);
  }

  getTenantCode(): string | null {
    return this.currentStorage.getItem(this.TENANT_CODE_KEY);
  }

  getSession(): SessionInfo | null {
    const sessionId = this.getSessionId();
    const tenantCode = this.getTenantCode();

    if (!sessionId || !tenantCode) {
      return null;
    }

    return {
      sessionId,
      tenantCode,
      rememberMe: this.getRememberMe(),
    };
  }

  isSessionAvailable(): boolean {
    return !!(
      this.getAccessToken()
      && this.getRefreshToken()
      && this.getSessionId()
      && this.getTenantCode()
    );
  }

  clear(): void {
    this.clearAccessToken();
    this.clearRefreshToken();
    this.clearSession();
  }

  /**
   * Tokens always live in localStorage, regardless of "Remember me" — a
   * pasted URL in a fresh tab gets its own empty sessionStorage (it's
   * scoped per browsing-context, not per browser), so anything stored
   * there was invisible outside the tab that created it. "Remember me"
   * still means something: it's forwarded to the backend on login and
   * controls how long-lived the issued refresh token is, so an
   * un-remembered session still naturally expires — it just does so via
   * a short token lifetime instead of via tab-scoped storage.
   */
  private get currentStorage(): Storage {
    return localStorage;
  }

  private clearAccessTokenFrom(storage: Storage): void {
    storage.removeItem(this.ACCESS_TOKEN_KEY);
    storage.removeItem(this.ACCESS_TOKEN_EXPIRES_AT_KEY);
  }

  private clearRefreshTokenFrom(storage: Storage): void {
    storage.removeItem(this.REFRESH_TOKEN_KEY);
    storage.removeItem(this.REFRESH_TOKEN_EXPIRES_AT_KEY);
  }

  private clearSessionFrom(storage: Storage): void {
    storage.removeItem(this.SESSION_ID_KEY);
    storage.removeItem(this.TENANT_CODE_KEY);
    storage.removeItem(this.REMEMBER_ME_KEY);
  }

  private clearAccessToken(): void {
    this.clearAccessTokenFrom(localStorage);
    this.clearAccessTokenFrom(sessionStorage);
  }

  private clearRefreshToken(): void {
    this.clearRefreshTokenFrom(localStorage);
    this.clearRefreshTokenFrom(sessionStorage);
  }

  private clearSession(): void {
    this.clearSessionFrom(localStorage);
    this.clearSessionFrom(sessionStorage);
  }
}
