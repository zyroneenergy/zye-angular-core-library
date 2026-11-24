import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccessService } from '../../access/access.service';

/** Auth pages only: a signed-in user is sent to their role's home page. */
export const GuestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.parseUrl(inject(AccessService).homeUrl());
  }

  return true;
};
