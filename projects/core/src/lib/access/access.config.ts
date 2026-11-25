import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/**
 * One access rule. Evaluated as:
 *  1. `exceptRoles` matches            → denied (wins over everything, admins included)
 *  2. `adminOnly`                      → only admins
 *  3. user is an admin                 → allowed (admins see everything, like the API)
 *  4. no `roles` and no `module` given → allowed for any signed-in user
 *  5. otherwise                        → allowed when ANY of `roles` matches OR `module` access is enough
 */
export interface AccessRule {
  /** Any of these role codes grants access. */
  roles?: readonly string[];
  /** Any of these role codes denies access, even for admins. */
  exceptRoles?: readonly string[];
  /** Module from the token's `moduleAccessMap` that grants access. */
  module?: string;
  /** Minimum level for `module` (default `read`). */
  level?: string;
  /** Only tenant / platform admins. */
  adminOnly?: boolean;
}

/**
 * What a route, menu item or template block requires:
 * a feature key from the policy, an inline rule, or a list of them (all must pass).
 */
export type AccessRequirement = string | AccessRule | readonly (string | AccessRule)[];

export interface AccessPolicy {
  /**
   * Roles allowed to use this app at all. Strict: admins get no bypass here.
   * A signed-in user with none of these roles is signed out at login (and on
   * any later navigation, e.g. a session restored from storage) and sees
   * `appDeniedMessage`. Omit or leave empty to allow every role.
   */
  allowedRoles?: readonly string[];
  /** Shown on the login page when `allowedRoles` refuses a user. */
  appDeniedMessage?: string;
  /** Named features, e.g. `{ 'sites.details': { exceptRoles: [RoleCode.TenantClient] } }`. */
  features?: Record<string, AccessRule>;
  /**
   * Landing page per role code, first match wins (in declaration order),
   * e.g. `{ [RoleCode.TenantClient]: '/sites' }`.
   */
  homeByRole?: Record<string, string>;
  /** Landing page when no `homeByRole` entry matches. Default `/dashboard`. */
  defaultHome?: string;
  /** Where unauthenticated users go. Default `/auth/login`. */
  loginUrl?: string;
}

export const ACCESS_POLICY = new InjectionToken<AccessPolicy>('ACCESS_POLICY');

/** Registers the app's access policy. Call once in `app.config.ts`. */
export function provideAccessControl(policy: AccessPolicy): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ACCESS_POLICY, useValue: policy }]);
}
