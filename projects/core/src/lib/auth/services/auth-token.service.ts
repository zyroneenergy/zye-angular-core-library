import { Injectable } from "@angular/core";
import { StorageKey } from "../enums/storage-keys.enum";

/**
 * A service class that manages the logged-in user's auth tokens
*/
@Injectable({
  providedIn: "root",
})
export class AuthTokenService {
  private readonly ACCESS_TOKEN_KEY = StorageKey.ACCESS_TOKEN;
  private readonly REFRESH_TOKEN_KEY = StorageKey.REFRESH_TOKEN;
  private readonly EXPIRES_AT_KEY = StorageKey.TOKEN_EXPIRES_AT;
  constructor() { }

 /**
   * Returns the storage that currently holds tokens (preference detection).
   * If neither has tokens, returns localStorage by default (can be treated as 'rememberMe' === true).
   */
  getPreferredStorage(): Storage {
    if (localStorage.getItem(this.REFRESH_TOKEN_KEY) || localStorage.getItem(this.ACCESS_TOKEN_KEY)) {
      return localStorage;
    }
    if (sessionStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.ACCESS_TOKEN_KEY)) {
      return sessionStorage;
    }
    // default when nothing present: localStorage (treat as rememberMe=true)
    return localStorage;
  }

  /**
   * Convenience boolean: true if tokens are stored in localStorage (rememberMe).
   */
  isRemembered(): boolean {
    const pref = this.getPreferredStorage();
    return pref === localStorage;
  }

  /**
   * Sets access token & expiry into chosen storage (rememberMe = true -> localStorage,
   * false -> sessionStorage). Passing token === null clears tokens.
   */
  setAccessToken(token: string | null, expiresInSeconds?: number, rememberMe = true): void {
    if (!token) {
      this.clearAccessToken();
      return;
    }

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem(this.ACCESS_TOKEN_KEY, token);

    if (expiresInSeconds && Number.isFinite(expiresInSeconds)) {
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      targetStorage.setItem(this.EXPIRES_AT_KEY, String(expiresAt));
    } else {
      targetStorage.removeItem(this.EXPIRES_AT_KEY);
    }

    // remove duplicates from the other storage
    this.getOtherStorage(targetStorage).removeItem(this.ACCESS_TOKEN_KEY);
    this.getOtherStorage(targetStorage).removeItem(this.EXPIRES_AT_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setRefreshToken(token: string | null, rememberMe = true): void {
    if (!token) {
      this.clearRefreshToken();
      return;
    }

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem(this.REFRESH_TOKEN_KEY, token);

    // remove from other storage to avoid stale tokens
    this.getOtherStorage(targetStorage).removeItem(this.REFRESH_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isAccessTokenExpired(): boolean {
    const expiresAtStr = localStorage.getItem(this.EXPIRES_AT_KEY) ?? sessionStorage.getItem(this.EXPIRES_AT_KEY);
    const expiresAt = Number(expiresAtStr || 0);
    return !expiresAt || Date.now() > expiresAt;
  }

  clear(): void {
    this.clearAccessToken();
    this.clearRefreshToken();
  }

  private clearAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  private clearRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private getOtherStorage(storage: Storage): Storage {
    return storage === localStorage ? sessionStorage : localStorage;
  }
}
