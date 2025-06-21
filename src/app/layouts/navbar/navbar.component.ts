import { Component, inject, Input, HostListener, ElementRef, OnInit, OnDestroy, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CartService } from '../../core/services/cart/cart.service';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() isLogin: boolean = true;

  private readonly authService = inject(AuthService);
  private readonly element = inject(ElementRef);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
  private destroy$ = new Subject<void>();

  isScrolled = false;
  menuOpen = false;
  cartCount: number = 0;
  wishlistCount: number = 0;

  ngOnInit(): void {
    // Subscribe to cart count changes with cleanup
    this.cartService.cartCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.cartCount = count;
      });

    // Subscribe to wishlist count changes with cleanup
    this.wishlistService.wishlistCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.wishlistCount = count;
      });

    // Close menu on route change and scroll to top
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeMenu();
        this.scrollToTop();
      });

    // Check initial scroll position only in browser environment
    if (this.isBrowser) {
      this.checkScrollPosition();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Ensure body scroll is enabled when component is destroyed
    if (this.isBrowser) {
      this.enableBodyScroll();
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;

    if (!this.isBrowser) return;

    if (this.menuOpen) {
      this.disableBodyScroll();
    } else {
      this.enableBodyScroll();
    }
  }

  closeMenu(): void {
    if (this.menuOpen) {
      this.menuOpen = false;

      if (this.isBrowser) {
        this.enableBodyScroll();
      }
    }
  }

  scrollToTop(): void {
    if (this.isBrowser) {
      this.viewportScroller.scrollToPosition([0, 0]);
    }
  }

  closeMenuAndScrollTop(): void {
    if (!this.isBrowser) return;

    if (window.innerWidth < 768) {
      this.closeMenu();
    }
    this.scrollToTop();
  }

  private disableBodyScroll(): void {
    if (!this.isBrowser || !document.body) return;

    // Store current scroll position
    const scrollY = window.scrollY;

    // Apply styles to fix body in place
    this.renderer.setStyle(document.body, 'position', 'fixed');
    this.renderer.setStyle(document.body, 'top', `-${scrollY}px`);
    this.renderer.setStyle(document.body, 'width', '100%');

    // Store the scroll position as a data attribute
    this.renderer.setAttribute(document.body, 'data-scroll-position', scrollY.toString());
  }

  private enableBodyScroll(): void {
    if (!this.isBrowser || !document.body) return;

    // Restore scroll position
    const scrollY = document.body.getAttribute('data-scroll-position');

    // Remove styles
    this.renderer.removeStyle(document.body, 'position');
    this.renderer.removeStyle(document.body, 'top');
    this.renderer.removeStyle(document.body, 'width');

    // Restore scroll position if available
    if (scrollY !== null) {
      window.scrollTo(0, parseInt(scrollY, 10));
    }
  }

  private checkScrollPosition(): void {
    if (!this.isBrowser) return;

    this.isScrolled = window.scrollY > 50;
    this.updateNavbarClass();
  }

  private updateNavbarClass(): void {
    if (!this.isBrowser) return;

    const navElement = this.element.nativeElement.querySelector('nav');
    if (navElement) {
      if (this.isScrolled) {
        navElement.classList.add('scrolled');
      } else {
        navElement.classList.remove('scrolled');
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;

    const scrollY = window.scrollY;
    const wasScrolled = this.isScrolled;
    this.isScrolled = scrollY > 50;

    // Only update DOM if state changed
    if (wasScrolled !== this.isScrolled) {
      this.updateNavbarClass();
    }
  }

  @HostListener('window:resize', [])
  onResize() {
    if (!this.isBrowser) return;

    if (window.innerWidth >= 768 && this.menuOpen) {
      this.closeMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Check if click is outside the mobile menu and menu button
    if (this.menuOpen) {
      const menuElement = this.element.nativeElement.querySelector('.mobile-menu');
      const menuButton = this.element.nativeElement.querySelector('button[aria-controls="navbar-default"]');

      if (menuElement && menuButton) {
        const clickedInsideMenu = menuElement.contains(event.target as Node);
        const clickedOnMenuButton = menuButton.contains(event.target as Node);

        if (!clickedInsideMenu && !clickedOnMenuButton) {
          this.closeMenu();
        }
      }
    }
  }

  // Make authService and other services available to template
  get authServiceForTemplate(): AuthService {
    return this.authService;
  }
}
