import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth/auth.service';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NavbarComponent } from './layouts/navbar/navbar.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ecomm-app';

  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly router = inject(Router);

  // Flag to determine if user is logged in, used for navbar isLogin input
  isLoggedIn = false;

  ngOnInit() {
    // Check for stored token after Stripe redirect
    if (this.isBrowser) {
      this.checkStripeRedirectToken();
    }

    // Monitor route changes to determine which layout to use
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateLayoutState();
      });

    // Initial layout state check
    this.updateLayoutState();
  }

  private checkStripeRedirectToken(): void {
    const stripeRedirectToken = sessionStorage.getItem('stripe_redirect_token');

    if (stripeRedirectToken) {
      console.log('Restoring authentication from Stripe redirect');

      // Restore the token
      this.authService.setToken(stripeRedirectToken);

      // Clear the stored token
      sessionStorage.removeItem('stripe_redirect_token');
    }
  }

  private updateLayoutState(): void {
    // Check if current route is an auth route
    const currentUrl = this.router.url;
    const authRoutes = ['/login', '/register'];

    // Set isLoggedIn based on whether current route is an auth route
    this.isLoggedIn = !authRoutes.some(route => currentUrl.startsWith(route));
  }
}
