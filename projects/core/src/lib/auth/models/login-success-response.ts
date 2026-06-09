

export interface LoginSuccessResponse extends LoginResponse {}

export interface LoginResponse {
accessToken: string;
refreshToken?: string;
expiresIn?: number; // seconds
tenantId?: string;
}