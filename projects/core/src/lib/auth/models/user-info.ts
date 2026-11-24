export interface UserInfo {
  userId: string;
  username: string;
  /** Given name, when the token carries one (`firstName` / `given_name`). Safe to show in the UI. */
  firstName?: string;
  tenantId: string;
  tenantCode: string;
  /** Role codes from the access token (`role` / `roles` claims), e.g. `['admin']`. */
  roles: string | string[];
  /** Role ids, when the token carries them (`roleIds` claim). */
  roleIds?: string[];
  /** Module → access level from the token (`moduleAccessMap` claim), e.g. `{ SITE: 'read' }`. */
  moduleAccess?: Record<string, string>;
}

export interface SessionInfo {
  sessionId: string;
  tenantCode: string;
  rememberMe: boolean;
}
