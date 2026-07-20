export interface UserInfo{
  userId: string;
  username: string;
  tenantId: string;
  tenantCode: string;
  roles: string | string[];
}

export interface SessionInfo {

    sessionId: string;

    tenantCode: string;

    rememberMe: boolean;

}