import {
  AuthenticationResultType,
  ChallengeNameType,
} from "@aws-sdk/client-cognito-identity-provider";

export interface ResetPasswordSuccessResponse extends ResetPasswordResult {}

interface ResetPasswordResult {
  Status?: ChallengeNameType | string;
  Session: string | AuthenticationResultType;
  User: string | AuthenticationResultType;
}
