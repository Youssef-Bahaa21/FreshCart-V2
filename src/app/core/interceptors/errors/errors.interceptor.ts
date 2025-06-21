import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

export const errorsInterceptor: HttpInterceptorFn = (req, next) => {
  const toastrService = inject(ToastrService);
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  return next(req).pipe(
    catchError((err) => {
      // Don't show "You are not logged in" messages
      const isAuthError = err.status === 401 &&
        err.error?.message?.includes("You are not logged in");

      // Only log non-auth errors or when debugging
      if (!isAuthError) {
        console.log("Error intercepted:", err.error?.message);

        // Only show toast for non-auth errors
        toastrService.error(err.error?.message || "An error occurred", "Error");
      } else {
        // For auth errors, handle silently or redirect based on the request
        console.log("Auth error intercepted - handling silently");

        // If this is a critical operation that requires auth, redirect to login
        if (req.url.includes("/orders") ||
          req.url.includes("/cart") ||
          req.url.includes("/addresses") ||
          req.url.includes("/wishlist")) {

          // Only access window in browser environment
          if (isBrowser) {
            // Store the current URL for redirect after login
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
              sessionStorage.setItem('redirectAfterLogin', currentPath);
            }
          }

          // Clear user data and redirect to login
          authService.clearUserData();
          router.navigate(['/login']);
        }
      }

      return throwError(() => err);
    })
  );
};


// RxJs (observable Async ) -- pipe operators (RxJx)
