import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';
import { CartService } from '../../core/services/cart/cart.service';
import { ToastrService } from 'ngx-toastr';
import { WishlistData } from '../../shared/interfaces/iwishlist';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  // Dependency injection
  private readonly wishlistService = inject(WishlistService);
  private readonly cartService = inject(CartService);
  private readonly toastrService = inject(ToastrService);

  // State management
  wishlistItems: WishlistData[] = [];
  isLoading = signal(false);
  loadingStates = new Map<string, boolean>();
  addingToCartStates = new Map<string, boolean>();

  // Responsive design
  isMobile = window.innerWidth < 640;
  isSmallScreen = window.innerWidth < 768;

  // Track window resize for responsive behavior
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 640;
    this.isSmallScreen = window.innerWidth < 768;
  }

  ngOnInit(): void {
    this.getWishlistItems();
  }

  getWishlistItems(): void {
    this.isLoading.set(true);
    this.wishlistService.getLoggedUserWishlist().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.wishlistItems = res.data;
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching wishlist:', err);
        this.toastrService.error('Could not load wishlist items', 'Error');
        this.isLoading.set(false);
      }
    });
  }

  removeFromWishlist(productId: string): void {
    // Prevent multiple clicks
    if (this.loadingStates.get(productId)) return;

    this.loadingStates.set(productId, true);
    this.toastrService.info('Removing from wishlist...', 'Please wait');

    this.wishlistService.removeProductFromWishlist(productId).subscribe({
      next: (res) => {
        if (res && res.status === "success") {
          this.toastrService.success('Product removed from wishlist', 'FreshCart');
          // Update wishlist items after removal
          this.wishlistItems = res.data;
        }
        this.loadingStates.set(productId, false);
      },
      error: (err) => {
        console.error('Error removing from wishlist:', err);
        this.toastrService.error('Could not remove from wishlist', 'Error');
        this.loadingStates.set(productId, false);
      }
    });
  }

  addToCart(productId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Prevent multiple clicks
    if (this.addingToCartStates.get(productId)) return;

    this.addingToCartStates.set(productId, true);

    // Show shorter message on mobile
    const message = this.isMobile ? 'Adding...' : 'Adding to cart...';
    this.toastrService.info(message, 'Please wait');

    this.cartService.addProductToCart(productId).subscribe({
      next: (res) => {
        if (res && res.status === "success") {
          this.toastrService.success('Product added to cart', 'FreshCart');

          // Optionally remove from wishlist after adding to cart
          // this.removeFromWishlist(productId);
        }
        this.addingToCartStates.set(productId, false);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        this.toastrService.error('Could not add to cart', 'Error');
        this.addingToCartStates.set(productId, false);
      }
    });
  }

  // Track items by their ID for better rendering performance
  trackById(index: number, item: WishlistData): string {
    return item._id;
  }
}
