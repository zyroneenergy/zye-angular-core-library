import { inject } from '@angular/core';
import { Data, Router, UrlTree } from '@angular/router';
import { AccessRequirement } from './access.config';
import { AccessService } from './access.service';

/** Route `data` key read by `accessGuard`. */
export const ACCESS_DATA_KEY = 'access';

function decide(requirement: AccessRequirement | undefined): boolean | UrlTree {
  const access = inject(AccessService);
  const router = inject(Router);

  if (!access.isAuthenticated()) return router.parseUrl(access.loginUrl);
  if (access.can(requirement)) return true;

  // Denied → the user's home page, unless that is the page being refused (no redirect loop).
  const home = router.parseUrl(access.homeUrl());
  const target = router.getCurrentNavigation()?.extractedUrl;
  if (target && router.serializeUrl(target).split('?')[0] === router.serializeUrl(home).split('?')[0]) {
    return false;
  }
  return home;
}

/**
 * Checks `route.data.access` (a feature key, rule, or list). Works as
 * `canActivate`, `canActivateChild` and `canMatch`:
 *
 *   { path: 'sites/:id', data: { access: 'sites.details' }, canActivate: [accessGuard] }
 *
 * Use it on a layout route's `canActivateChild` to cover every child at once.
 */
export const accessGuard = (route: { data?: Data }): boolean | UrlTree =>
  decide(route.data?.[ACCESS_DATA_KEY] as AccessRequirement | undefined);

/** Inline form: `canActivate: [requireAccess({ adminOnly: true })]`. */
export const requireAccess = (requirement: AccessRequirement) => (): boolean | UrlTree => decide(requirement);

/** Sends `/` to the signed-in user's role home, or to login. */
export const homeRedirectGuard = (): UrlTree => {
  const access = inject(AccessService);
  const router = inject(Router);
  return router.parseUrl(access.isAuthenticated() ? access.homeUrl() : access.loginUrl);
};
