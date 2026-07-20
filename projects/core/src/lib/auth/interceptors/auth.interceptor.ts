import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CORE_CONFIG } from '../../config/core-config.token';
import { CoreConfig } from '../../config/core-config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const config = inject(CORE_CONFIG) as CoreConfig;
  const token = auth.getAccessToken();

  const clonedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  const refreshEndpoint = `${config.apiUrl}/auth/refresh`;
  const isRefreshRequest = req.url === refreshEndpoint || req.url.endsWith('/auth/refresh');

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshRequest) {
        if (!auth.canRefresh()) {
          console.warn('No refreshable session available. Logging out.');
          auth.logout();
          return throwError(() => error);
        }

        console.warn('Access token expired — attempting refresh...');

        return auth.refreshToken().pipe(
          switchMap((newToken) => {
            if (!newToken) {
              console.warn('Refresh failed — logging out');
              auth.logout();
              return throwError(() => error);
            }

            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
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
