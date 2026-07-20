/**
 * Enum for localStorage/sessionStorage keys
 * Centralized to avoid typos and improve maintainability
 */
export enum StorageKey {

  ACCESS_TOKEN = 'access_token',

  REFRESH_TOKEN = 'refresh_token',

  TOKEN_EXPIRES_AT = 'token_expires_at',

  REFRESH_TOKEN_EXPIRES_AT = 'refreshExpires',

  CURRENT_USER = 'current_user',

  REMEMBER_ME = 'remember_me',

  SESSION_ID = 'session_id',

  TENANT_CODE = 'tenant_code'
}

/**
 * Auth error codes for better error handling
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED'
}

/**
 * Auth token status
 */
export enum TokenStatus {
  VALID = 'VALID',
  EXPIRED = 'EXPIRED',
  REFRESH_NEEDED = 'REFRESH_NEEDED',
  INVALID = 'INVALID'
}