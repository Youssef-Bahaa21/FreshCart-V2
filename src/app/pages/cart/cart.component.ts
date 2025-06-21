import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CartService } from '../../core/services/cart/cart.service';
import { Icart } from '../../shared/interfaces/icart';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  // Dependency injection
  private readonly cartService = inject(CartService);
  private readonly toastrService = inject(ToastrService);

  // State management
  cartDetails: Icart = {} as Icart;
  isLoading = signal(true);
  isUpdating = new Map<string, boolean>();
  isRemoving = new Map<string, boolean>();
  isClearingCart = signal(false);

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
    this.getCartData();
  }

  getCartData(): void {
    this.isLoading.set(true);
    this.cartService.getLoggedUserCart().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.cartDetails = res.data;
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching cart:', err);
        this.toastrService.error('Could not load your cart', 'Error');
        this.isLoading.set(false);
      }
    });
  }

  updateCount(productId: string, count: number): void {
    // Don't allow counts less than 1
    if (count < 1) return;

    // Prevent multiple clicks
    if (this.isUpdating.get(productId)) return;

    this.isUpdating.set(productId, true);

    this.cartService.updateProductQuantity(productId, count).subscribe({
      next: (res) => {
        if (res && res.status === "success") {
          this.cartDetails = res.data;
          this.toastrService.success('Cart updated', 'FreshCart');
        }
        this.isUpdating.set(productId, false);
      },
      error: (err) => {
        console.error('Error updating quantity:', err);
        this.toastrService.error('Could not update quantity', 'Error');
        this.isUpdating.set(productId, false);
      }
    });
  }

  removeItem(productId: string): void {
    // Prevent multiple clicks
    if (this.isRemoving.get(productId)) return;

    this.isRemoving.set(productId, true);

    this.cartService.removeSpecificItem(productId).subscribe({
      next: (res) => {
        if (res && res.status === "success") {
          this.cartDetails = res.data;
          this.toastrService.success('Item removed', 'FreshCart');
        }
        this.isRemoving.set(productId, false);
      },
      error: (err) => {
        console.error('Error removing item:', err);
        this.toastrService.error('Could not remove item', 'Error');
        this.isRemoving.set(productId, false);
      }
    });
  }

  clearItems(): void {
    Swal.fire({
      title: "Clear your cart?",
      text: "This will remove all items from your cart",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-blue)",
      cancelButtonColor: "#d33",
      confirmButtonText: this.isMobile ? "Clear" : "Yes, clear it",
      background: "#fff",
      iconColor: "var(--secondary-blue)",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button"
      },
      width: this.isMobile ? '90%' : 'auto'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isClearingCart.set(true);

        this.cartService.clearCart().subscribe({
          next: (res) => {
            if (res && res.message === "success") {
              this.cartDetails = {} as Icart;
              this.toastrService.success('Cart cleared successfully', 'FreshCart');
            }
            this.isClearingCart.set(false);
          },
          error: (err) => {
            console.error('Error clearing cart:', err);
            this.toastrService.error('Could not clear cart', 'Error');
            this.isClearingCart.set(false);
          }
        });
      }
    });
  }

  // Helper method to calculate total items in cart
  getTotalItems(): number {
    return this.cartDetails.products?.reduce((total, item) => total + item.count, 0) || 0;
  }
}