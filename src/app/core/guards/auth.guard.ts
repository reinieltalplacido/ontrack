import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Automatically bypasses Landing and Login screens if "Keep me signed in" is active
 */
export const autoLoginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.shouldAutoLogin()) {
    if (authService.isAdminLoggedIn()) {
      return router.parseUrl('/admin/dashboard');
    }
    return router.parseUrl('/home');
  }

  return true;
};

/**
 * Protects student pages (Home, Tasks, Timelogs, Profile, Reports)
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};

/**
 * Protects coordinator / professor dashboard
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdminLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};
