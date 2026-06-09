export interface ServerAPIError {
  description?: string | null;
  details?: string | null;
  errorCode: string | null;
  message?: string | null;
  statusCode: number;
}
