import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { LoginCredentials } from "../models/login-credentials";
import { LoginSuccessResponse } from "../models/login-success-response";
import { Observable } from "rxjs";
import { RegistrationDetails } from "../models/registration-details";
import { ForgotPassword } from "../models/password-service";
import { ResendEmail, VerificationEmail } from "../models/email-service";
import { CORE_CONFIG } from '../../config/core-config.token';
import {  CoreConfig } from '../../config/core-config';

/**
 * Service responsible for handling all authentication-related API calls.
 * This service provides methods for user authentication, registration, and account management.
 */
@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  constructor(
    private http: HttpClient,
    @Inject(CORE_CONFIG)
      protected config: CoreConfig
  ) { }
  protected get base(): string {
  return `${this.config.apiUrl}/auth`;
}

  /**
   * Authenticates a user with their credentials
   * @param payload - Contains user login credentials (username/email and password)
   * @returns Observable<LoginSuccessResponse> - Returns access token and refresh token on success
   */
  login(payload: LoginCredentials): Observable<LoginSuccessResponse> {
    return this.http.post<LoginSuccessResponse>(`${this.base}/login`, payload);
  }

  /**
   * Registers a new user in the system
   * @param payload - Contains registration details including username, email, password, and company info
   * @returns Observable containing the registration response
   */
  register(payload: RegistrationDetails): Observable<RegistrationDetails> {
    return this.http.post<RegistrationDetails>(`${this.base}/register`, payload);
  }

  /**
   * Validates if a company namespace is available for registration
   * @param companyName - The company name to check for availability
   * @returns Observable<boolean> indicating if the namespace is available
   */
  checkNamespace(companyName: string): Observable<{ available: boolean }> {
    return this.http.put<{ available: boolean }>(`${this.base}/check-namespace-availability`, { tenantName: companyName });
  }

  /**
   * Verifies user's email with the provided verification code
   * @param username - User's email or username
   * @param emailCode - Verification code sent to user's email
   * @returns Observable containing verification status
   */
  verifyEmail(username: string, emailCode: string): Observable<VerificationEmail> {
    return this.http.post<VerificationEmail>(`${this.base}/verify-email`, { username, emailCode });
  }

  /**
   * Requests a new email verification code
   * @param username - User's email or username
   * @returns Observable containing the resend status
   */
  resendEmail(username: string): Observable<ResendEmail> {
    return this.http.post<ResendEmail>(`${this.base}/resend-email`, { username });
  }

  /**
   * Initiates the forgot password process
   * @param username - User's email or username
   * @returns Observable containing the forgot password response
   */
  forgotPassword(username: string): Observable<ForgotPassword> {
    return this.http.post<ForgotPassword>(`${this.base}/forgot-password`, { username });
  }

  /**
   * Changes user's password
   * @param username - User's email or username
   * @param oldPassword - Current password
   * @param newPassword - New password to set
   * @returns Observable containing the password change status
   */
  changePassword(username: string, oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.base}/change-password`, { username, oldPassword, newPassword });
  }

  /**
   * Changes user's password
   * @param username - User's email or username
   * @param oldPassword - Current password
   * @param newPassword - New password to set
   * @returns Observable containing the password change status
   */
  updatePassword(username: string, emailCode: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.base}/update-password`, { username, emailCode, newPassword });
  }

  /**
 * Refreshes the access token using a valid refresh token
 * @param refreshToken - The refresh token to use for getting a new access token
 * @returns Observable<LoginSuccessResponse> containing new access and refresh tokens
 */
  refreshToken(refreshToken: string): Observable<LoginSuccessResponse> {
    return this.http.post<LoginSuccessResponse>(`${this.base}/refresh`, { refreshToken });
  }

}
