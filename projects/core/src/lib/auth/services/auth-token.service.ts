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
   * If persistence was intentionally configured, prefer the storage that contains the session.
   * Otherwise default to localStorage so rememberMe semantics are preserved.
   */
  getPreferredStorage(): Storage {
    return this.currentStorage;
  }

  getRememberMe(): boolean {
    const rememberMe = this.currentStorage.getItem(this.REMEMBER_ME_KEY);
    if (rememberMe === 'true') return true;
    if (rememberMe === 'false') return false;
    return this.currentStorage === localStorage;
  }

  /** Convenience boolean: true if tokens are persisted in localStorage. */
  isRemembered(): boolean {
    return this.getRememberMe();
  }

  setAccessToken(token: string | null, expiresInSeconds?: number, rememberMe = true): void {
    if (!token) {
      this.clearAccessToken();
      return;
    }

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.ACCESS_TOKEN_KEY, token);

    if (typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds)) {
      storage.setItem(this.ACCESS_TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    } else {
      storage.removeItem(this.ACCESS_TOKEN_EXPIRES_AT_KEY);
    }

    this.clearAccessTokenFrom(this.getOtherStorage(storage));
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

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.REFRESH_TOKEN_KEY, token);

    if (typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds)) {
      storage.setItem(this.REFRESH_TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    } else {
      storage.removeItem(this.REFRESH_TOKEN_EXPIRES_AT_KEY);
    }

    this.clearRefreshTokenFrom(this.getOtherStorage(storage));
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
    const storage = session.rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.SESSION_ID_KEY, session.sessionId);
    storage.setItem(this.TENANT_CODE_KEY, session.tenantCode);
    storage.setItem(this.REMEMBER_ME_KEY, String(session.rememberMe));
    this.clearSessionFrom(this.getOtherStorage(storage));
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

  private get currentStorage(): Storage {
    const rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY);

    if (rememberMe === 'true') {
      return localStorage;
    }

    if (rememberMe === 'false') {
      return sessionStorage;
    }

    return (
      sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
      || sessionStorage.getItem(this.REFRESH_TOKEN_KEY)
    )
      ? sessionStorage
      : localStorage;
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

  private getOtherStorage(storage: Storage): Storage {
    return storage === localStorage ? sessionStorage : localStorage;
  }
}
