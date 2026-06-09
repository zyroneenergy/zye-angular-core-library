import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const clonedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401s that aren’t from refresh endpoints
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Prevent refresh attempts if there’s no refresh token
        if (!auth.isAuthenticated()) {
          console.warn(' No valid session — logging out');
          auth.logout();
          return throwError(() => error);
        }

        console.warn('Access token expired — attempting refresh...');

        // Try refreshing
        return auth.refreshToken().pipe(
          switchMap((newToken) => {
            if (!newToken) {
              console.warn('Refresh failed — logging out');
              auth.logout();
              return throwError(() => error);
            }

            console.info(' Refresh successful — retrying request');
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            console.error('Refresh flow failed:', refreshError);
            auth.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
