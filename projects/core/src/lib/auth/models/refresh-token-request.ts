
export interface RefreshTokenRequest {
  refreshToken: string;
  tenantCode: string;
  sessionId: string;
  isActive: boolean;
}