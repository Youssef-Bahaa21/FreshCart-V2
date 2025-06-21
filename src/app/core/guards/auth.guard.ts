import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  if (isBrowser) {
    if (authService.isLoggedIn() && !authService.isTokenExpired()) {
      return true;
    } else {
      // Store the URL the user was trying to access
      sessionStorage.setItem('redirectAfterLogin', state.url);
      router.navigate(['/login']);
      return false;
    }
  } else {
    return false;
  }
};
