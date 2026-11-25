import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { UserService } from '../auth/services/user.service';
import { ACCESS_POLICY, AccessPolicy, AccessRequirement, AccessRule } from './access.config';
import { ADMIN_ROLE_CODES, isRoleCode, meetsAccessLevel, normalizeRoleCode, roleCodeLabel } from './role-codes';

const DEFAULT_HOME = '/dashboard';
const DEFAULT_LOGIN = '/auth/login';
const APP_DENIED_NOTICE_KEY = 'appAccessDenied';

const toArray = <T>(value: T | T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : value != null ? [value] : [];

/** Minimal role shape for `setRoleCatalog` (what GET /:tenantId/role returns). */
export interface RoleRef {
  id: string;
  code: string;
}

/**
 * What the signed-in user may see. Mirrors the backend GbacGuard so screens hide
 * what the API would refuse; the API still enforces it, so this is UI shaping,
 * not a security boundary.
 *
 * Roles come from the access token (`role` claim). Apps whose tokens carry role
 * ids instead can resolve them with `setRoleCatalog()`.
 */
@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly user = inject(UserService);
  private readonly policy: AccessPolicy = inject(ACCESS_POLICY, { optional: true }) ?? {};
  private readonly catalog = signal<ReadonlyMap<string, string>>(new Map());
  private readonly warned = new Set<string>();
  // Created first: it restores the user from the stored token.
  private readonly auth = inject(AuthService);

  readonly isAuthenticated = this.user.isAuthenticated;

  /** Normalised role codes of the current user (token codes + catalog-resolved ids). */
  readonly roles = computed<readonly string[]>(() => {
    const info = this.user.userData();
    if (!info) return [];
    const fromIds = (info.roleIds ?? []).map(id => this.catalog().get(id)).filter((c): c is string => !!c);
    const codes = [...toArray(info.roles), ...fromIds].map(normalizeRoleCode).filter(Boolean);
    return [...new Set(codes)];
  });

  /** Module → access level from the token. Keys are upper-cased. */
  readonly moduleAccess = computed<Readonly<Record<string, string>>>(() => {
    const map = this.user.userData()?.moduleAccess ?? {};
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k.toUpperCase(), v]));
  });

  readonly isAdmin = computed(() => this.roles().some(role => isRoleCode(role, ADMIN_ROLE_CODES)));

  /** The user's first role, for display (e.g. "Tenant client"). */
  readonly primaryRoleLabel = computed(() => roleCodeLabel(this.roles()[0]));

  /** Where this user lands after sign-in, and where denied routes send them. */
  readonly homeUrl = computed(() => {
    const roles = this.roles();
    for (const [code, url] of Object.entries(this.policy.homeByRole ?? {})) {
      if (roles.includes(normalizeRoleCode(code))) return url;
    }
    return this.policy.defaultHome ?? DEFAULT_HOME;
  });

  readonly loginUrl = this.policy.loginUrl ?? DEFAULT_LOGIN;

  /**
   * Whether the signed-in user's role may use this app at all (`allowedRoles`).
   * Strict role match, no admin bypass.
   */
  readonly canUseApp = computed(() => {
    const allowed = this.policy.allowedRoles ?? [];
    return allowed.length === 0 || this.hasRole(...allowed);
  });

  readonly appDeniedMessage = this.policy.appDeniedMessage ?? "This account doesn't have access to this portal.";

  /**
   * Signs out a user whose role isn't allowed in this app and leaves the
   * reason for the login page to show.
   */
  rejectSession(): void {
    try {
      sessionStorage.setItem(APP_DENIED_NOTICE_KEY, this.appDeniedMessage);
    } catch {
      /* storage unavailable: the login page just shows no notice */
    }
    this.auth.logout(this.loginUrl);
  }

  /** Reads (and clears) the notice left by `rejectSession()`. */
  takeAppDeniedNotice(): string | null {
    try {
      const notice = sessionStorage.getItem(APP_DENIED_NOTICE_KEY);
      sessionStorage.removeItem(APP_DENIED_NOTICE_KEY);
      return notice;
    } catch {
      return null;
    }
  }

  hasRole(...codes: string[]): boolean {
    const roles = this.roles();
    return codes.some(code => roles.includes(normalizeRoleCode(code)));
  }

  hasModule(module: string, level?: string): boolean {
    return meetsAccessLevel(this.moduleAccess()[module.toUpperCase()], level);
  }

  /**
   * Whether the current user meets a requirement. Reads signals, so it can be
   * used inside `computed()` / templates and re-evaluates on sign-in/out.
   */
  can(requirement: AccessRequirement | null | undefined): boolean {
    if (requirement == null) return true;
    if (!this.isAuthenticated()) return false;
    const parts = (Array.isArray(requirement) ? requirement : [requirement]) as (string | AccessRule)[];
    return parts.every(part => this.check(typeof part === 'string' ? this.feature(part) : part));
  }

  /** Map role ids to codes, for tokens that carry `roleIds` instead of codes. */
  setRoleCatalog(roles: readonly RoleRef[]): void {
    this.catalog.set(new Map(roles.map(role => [role.id, role.code])));
  }

  private feature(key: string): AccessRule | null {
    const rule = this.policy.features?.[key];
    if (!rule && isDevMode() && !this.warned.has(key)) {
      this.warned.add(key);
      console.warn(`[AccessService] Unknown feature "${key}" — denied. Add it to provideAccessControl({ features }).`);
    }
    return rule ?? null;
  }

  private check(rule: AccessRule | null): boolean {
    if (!rule) return false;
    if (rule.exceptRoles?.length && this.hasRole(...rule.exceptRoles)) return false;
    if (rule.adminOnly) return this.isAdmin();
    if (this.isAdmin()) return true;

    const byRole = !!rule.roles?.length;
    const byModule = !!rule.module;
    if (!byRole && !byModule) return true;
    return (byRole && this.hasRole(...rule.roles!)) || (byModule && this.hasModule(rule.module!, rule.level));
  }
}
