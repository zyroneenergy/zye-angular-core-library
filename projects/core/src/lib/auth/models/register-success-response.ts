export interface RegisterSuccessResponse extends RegisterResult {}

interface RegisterResult {
  companyName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  branch?: string;
  region?: string;
}
