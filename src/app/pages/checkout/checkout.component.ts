import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../core/services/orders/orders.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AddressesService } from '../../core/services/addresses/addresses.service';
import { IAddress } from '../../shared/interfaces/iaddress';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  cartid: string = "";
  checkOutFrom!: FormGroup;
  isProcessing = signal(false);
  isLoadingAddresses = signal(false);
  userAddresses = signal<IAddress[]>([]);
  selectedAddress = signal<IAddress | null>(null);
  paymentSuccess = signal<boolean>(false);
  authError = signal<boolean>(false);
  isLoading = signal(false);

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly addressesService = inject(AddressesService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  getCartId(): void {
    this.activatedRoute.paramMap.subscribe({
      next: (parm) => {
        this.cartid = parm.get('id')!;
      }
    });
  }

  checkPaymentStatus(): void {
    // Check for success parameter in URL
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['success'] === 'true') {
        this.paymentSuccess.set(true);

        // Try to restore token if it exists in session storage
        this.restoreTokenIfNeeded();

        // Check if user is still authenticated
        if (!this.authService.isLoggedIn() || this.authService.isTokenExpired()) {
          this.handleAuthError();
          return;
        }

        this.clearCartAfterPayment();
      }
    });
  }

  restoreTokenIfNeeded(): void {
    const stripeRedirectToken = sessionStorage.getItem('stripe_redirect_token');
    if (stripeRedirectToken) {
      console.log('Restoring authentication token from session storage');
      this.authService.setToken(stripeRedirectToken);
      sessionStorage.removeItem('stripe_redirect_token');
    }
  }

  handleAuthError(): void {
    this.authError.set(true);
    // Save the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);

    this.toastr.warning('Your session has expired. Please log in again to complete your order.', 'Authentication Required');

    // Redirect to login after a short delay
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  clearCartAfterPayment(): void {
    // Get cart ID from session storage if not available in route
    if (!this.cartid) {
      this.cartid = sessionStorage.getItem('pendingCartId') || '';
    }

    if (!this.cartid) {
      this.toastr.error('Could not identify your order', 'Error');
      return;
    }

    // Clear the cart data
    this.cartService.clearCart().subscribe({
      next: () => {
        this.toastr.success('Payment completed successfully!', 'Thank you for your order');
        // Clear the pending cart ID
        sessionStorage.removeItem('pendingCartId');
        // Navigate to home or orders page after a short delay
        setTimeout(() => {
          this.router.navigate(['/allorders']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error clearing cart:', err);

        // Check if this is an auth error
        if (err.status === 401) {
          this.handleAuthError();
        } else {
          // Still navigate even if clearing cart fails for other reasons
          this.router.navigate(['/allorders']);
        }
      }
    });
  }

  loadUserAddresses(): void {
    // Only attempt to load addresses if user is authenticated
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.isLoadingAddresses.set(true);
    this.addressesService.getUserAddresses().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.userAddresses.set(response.data);
        }
        this.isLoadingAddresses.set(false);
      },
      error: (err) => {
        console.error('Error loading addresses:', err);
        this.isLoadingAddresses.set(false);

        // Handle auth errors
        if (err.status === 401) {
          this.handleAuthError();
        }
      }
    });
  }

  selectAddress(address: IAddress): void {
    this.selectedAddress.set(address);
    this.checkOutFrom.patchValue({
      details: address.details,
      phone: address.phone,
      city: address.city
    });
  }

  initForm(): void {
    this.checkOutFrom = this.formBuilder.group({
      details: [null, [Validators.required]],
      phone: [null, [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      city: [null, [Validators.required]]
    });
  }

  submitForm(): void {
    if (this.checkOutFrom.invalid) {
      this.checkOutFrom.markAllAsTouched();
      return;
    }

    this.isProcessing.set(true);
    this.toastr.info('Processing your order...', 'Please wait');

    this.ordersService.checkOutPayment(this.cartid, this.checkOutFrom.value).subscribe({
      next: (res) => {
        if (res.status === "success") {
          this.toastr.success('Order placed successfully!', 'Success');
          // Open payment URL
          window.location.href = res.session.url;
        }
      },
      error: (err) => {
        console.error('Checkout error:', err);
        this.toastr.error('Failed to process your order', 'Error');
        this.isProcessing.set(false);

        // Handle auth errors
        if (err.status === 401) {
          this.handleAuthError();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.getCartId();

    // Try to restore token if needed
    this.restoreTokenIfNeeded();

    // Check if user is authenticated
    if (this.authService.isLoggedIn() && !this.authService.isTokenExpired()) {
      this.loadUserAddresses();
    }

    this.checkPaymentStatus();
  }
}
