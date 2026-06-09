import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
// import { RoutePaths } from '../app.routes';

/**
 * Route guard that ensures:
 * - Logged-in users cannot access auth pages (login/register)
 * - Unauthenticated users are redirected to login when accessing private pages
 */
export const LoginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isLoggedIn = authService.isAuthenticated();

  const url = state.url || '';
  const isAuthRoute =
    url === '/' ||
    url.startsWith('/register') ||
    url.startsWith('/forgot-password') ||
    url.startsWith('/verify-otp') ||
    url.startsWith('/update-password') ||
    url.startsWith('/auth') ||
    url.startsWith('/login');

  // If authenticated
  if (isLoggedIn) {
    // Prevent access to auth pages (login/register) for logged-in users
    if (isAuthRoute) {
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  }

  // If not authenticated
  if (isAuthRoute) {
    // Allow public auth routes
    return true;
  }

  // Block access to protected routes and redirect to login
  return router.createUrlTree([`/`]);
};
