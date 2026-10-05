import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles.length === 0 || authService.hasRole(...allowedRoles)) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
