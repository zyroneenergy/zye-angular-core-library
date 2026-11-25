import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccessService } from '../../access/access.service';

/** Auth pages only: a signed-in user is sent to their role's home page. */
export const GuestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const access = inject(AccessService);
    // A stored session whose role this app refuses: sign it out, stay on the auth page.
    if (!access.canUseApp()) {
      access.rejectSession();
      return true;
    }
    return router.parseUrl(access.homeUrl());
  }

  return true;
};
