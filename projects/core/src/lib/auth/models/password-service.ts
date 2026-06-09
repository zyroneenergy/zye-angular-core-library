export interface ForgotPassword{
  username: string;
}

export interface ChangePassword{
  username: string;
  oldPassword: string;
  newPassword: string;
}