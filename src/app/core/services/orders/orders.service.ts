import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private baseUrl = 'https://ecommerce.routemisr.com/api/v1';
  private readonly authService = inject(AuthService);

  constructor(private httpClient: HttpClient) { }

  checkOutPayment(id: string, data: object): Observable<any> {
    // Store token in sessionStorage before redirect
    const token = this.authService.getToken();
    if (token) {
      sessionStorage.setItem('stripe_redirect_token', token);
    }

    // Save cart ID for after payment
    sessionStorage.setItem('pendingCartId', id);

    // Add success and cancel URL parameters with token preservation
    const origin = window.location.origin;
    const successUrl = `${origin}/checkout/${id}?success=true`;
    const cancelUrl = `${origin}/checkout/${id}?canceled=true`;

    return this.httpClient.post(
      `${this.baseUrl}/orders/checkout-session/${id}?url=${successUrl}`,
      {
        shippingAddress: data
      }
    );
  }

  getUserOrders(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/orders/`);
  }
}
