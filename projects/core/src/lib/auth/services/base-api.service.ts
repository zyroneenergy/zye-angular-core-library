import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { UserService } from './user.service';
import { TimeZoneService } from './time-zone.service';
import { AuthTokenService } from './auth-token.service';
import { CORE_CONFIG } from '../../config/core-config.token';
import {  CoreConfig } from '../../config/core-config';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  

  protected get baseUrl(): string {
  return this.config.apiUrl;
}

  protected get tenantId(): string {
    return this.user.tenantId() ?? '';
  }

  constructor(
    protected http: HttpClient,
    protected tokenService: AuthTokenService,
    protected user: UserService,
    protected timezone: TimeZoneService,
    @Inject(CORE_CONFIG)
  protected config: CoreConfig
  ) {}

  protected getHeaders(contentType = 'application/json'): HttpHeaders {
    const token = this.tokenService.getAccessToken();
    let headers = new HttpHeaders({ 'Content-Type': contentType });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** Centralized param builder — timezone injected ONCE */
  protected buildParams(params: Record<string, any> = {}): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        httpParams = httpParams.set(key, value);
      }
    });

    return httpParams.set('timezone', this.timezone.getTimezone());
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() =>
      new Error(error.error?.message || error.statusText || 'Unknown API Error')
    );
  }

  protected get<T>(url: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }).pipe(catchError(this.handleError));
  }

  protected post<T>(url: string, body: any, params?: Record<string, any>): Observable<T> {
    return this.http.post<T>(url, body, {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }).pipe(catchError(this.handleError));
  }

  protected put<T>(url: string, body: any, params?: Record<string, any>): Observable<T> {
    return this.http.put<T>(url, body, {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }).pipe(catchError(this.handleError));
  }

  protected delete<T>(url: string, params?: Record<string, any>): Observable<T> {
    return this.http.delete<T>(url, {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }).pipe(catchError(this.handleError));
  }
}
