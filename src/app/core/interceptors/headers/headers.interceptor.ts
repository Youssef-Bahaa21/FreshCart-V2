import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

export const headersInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const authService = inject(AuthService);

  // Only access token in browser environment
  if (isBrowser) {
    const token = authService.getToken();

    if (token) {
      // Log token presence for debugging (not the actual token)
      console.log(`Adding auth token to request: ${req.url}`);

      req = req.clone({
        setHeaders: {
          token: token
        }
      });
    } else {
      // Log missing token for debugging
      console.log(`No auth token available for request: ${req.url}`);

      // Check for token in sessionStorage as a last resort
      const sessionToken = sessionStorage.getItem('stripe_redirect_token');
      if (sessionToken) {
        console.log(`Found token in sessionStorage, using it for: ${req.url}`);
        req = req.clone({
          setHeaders: {
            token: sessionToken
          }
        });

        // Restore token to authService
        authService.setToken(sessionToken);
      }
    }
  }

  return next(req);
};


