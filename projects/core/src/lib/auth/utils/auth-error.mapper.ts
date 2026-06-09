import { HttpErrorResponse } from '@angular/common/http';
import { ServerAPIError } from '../models/error/server-api-error';

/**
 * Maps a raw HttpErrorResponse from the auth API into a human-readable message.
 * Pure function — no DI, no class — so it can be unit-tested with zero Angular setup.
 *
 * Usage:
 *   const msg = mapAuthError(err);
 *   this.snackbar.error(msg);
 */
export function mapAuthError(error: HttpErrorResponse): string {
  const serverError = error?.error as ServerAPIError | undefined;
  const code = serverError?.errorCode;

  const ERROR_MESSAGES: Record<string, string> = {
    InvalidCredentials: 'Invalid email or password. Please try again.',
    UserNotConfirmed:   'Your email is not verified. Check your inbox and verify before logging in.',
    AccountLocked:      'Your account is locked. Please contact support.',
    TooManyAttempts:    'Too many failed attempts. Please wait a few minutes and try again.',
    SessionExpired:     'Your session has expired. Please log in again.',
  };

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Fall back to server-provided message, then generic
  return serverError?.message || 'Something went wrong. Please try again.';
}