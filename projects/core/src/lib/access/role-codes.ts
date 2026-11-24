/**
 * Role codes as the API defines them (JWT `role` claim, GET /:tenantId/role `code`).
 * Display text always comes from the API (`displayName`); never show these raw.
 */
export enum RoleCode {
  /** Platform-level; not assignable within a tenant. */
  SuperAdmin = 'superadmin',
  Admin = 'admin',
  SiteManager = 'site_manager',
  SiteAnalyst = 'site_analyst',
  SiteEngineer = 'site_engineer',
  TenantClient = 'tenant_client',
}

/** Roles with tenant-wide admin rights: mirrors the backend GbacGuard. */
export const ADMIN_ROLE_CODES: readonly string[] = [RoleCode.SuperAdmin, RoleCode.Admin];

/** Module access levels from the token's `moduleAccessMap`, lowest first. */
export enum ModuleAccessLevel {
  Read = 'read',
  Admin = 'admin',
}

const LEVEL_PRIORITY: Record<string, number> = {
  [ModuleAccessLevel.Read]: 1,
  [ModuleAccessLevel.Admin]: 2,
};

/** Role codes compare case-insensitively, as the backend does. */
export function normalizeRoleCode(code: string | null | undefined): string {
  return code?.trim().toLowerCase() ?? '';
}

export function isRoleCode(code: string | null | undefined, candidates: readonly string[]): boolean {
  const key = normalizeRoleCode(code);
  return !!key && candidates.some(candidate => normalizeRoleCode(candidate) === key);
}

/** True when `granted` is at least `required` (unknown levels never satisfy). */
export function meetsAccessLevel(granted: string | null | undefined, required: string = ModuleAccessLevel.Read): boolean {
  const have = LEVEL_PRIORITY[normalizeRoleCode(granted)] ?? 0;
  const need = LEVEL_PRIORITY[normalizeRoleCode(required)] ?? Number.POSITIVE_INFINITY;
  return have >= need;
}

/** `site_manager` → `Site manager`. Fallback label only; prefer the API's displayName. */
export function roleCodeLabel(code: string | null | undefined): string {
  const text = normalizeRoleCode(code).replace(/[_-]+/g, ' ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
