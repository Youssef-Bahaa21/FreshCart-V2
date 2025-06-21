import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  private baseUrl = 'https://ecommerce.routemisr.com/api/v1';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private httpClient: HttpClient) {
    // Only fetch cart data in browser environment
    if (this.isBrowser) {
      this.initializeCartCount();
    }
  }

  private initializeCartCount(): void {
    this.getLoggedUserCart().subscribe({
      next: (res) => {
        if (res && res.data && res.data.products) {
          this.cartCountSubject.next(res.data.products.length);
        }
      },
      error: () => {
        // Handle error silently - user might not be logged in yet
        this.cartCountSubject.next(0);
      }
    });
  }

  addProductToCart(productId: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/cart`,
      { productId }
    ).pipe(
      tap((res: any) => {
        // Update cart count after adding
        if (res && res.data && res.data.products) {
          this.cartCountSubject.next(res.data.products.length);
        }
      }),
      catchError(this.handleError)
    );
  }

  updateProductQuantity(productId: string, count: number): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/cart/${productId}`,
      { count }
    ).pipe(
      tap((res: any) => {
        // Update cart count after updating quantity
        if (res && res.data && res.data.products) {
          this.cartCountSubject.next(res.data.products.length);
        }
      }),
      catchError(this.handleError)
    );
  }

  getLoggedUserCart(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/cart`)
      .pipe(catchError(this.handleError));
  }

  removeSpecificItem(productId: string): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/cart/${productId}`)
      .pipe(
        tap((res: any) => {
          // Update cart count after removing item
          if (res && res.data && res.data.products) {
            this.cartCountSubject.next(res.data.products.length);
          } else {
            this.cartCountSubject.next(0);
          }
        }),
        catchError(this.handleError)
      );
  }

  clearCart(): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/cart`)
      .pipe(
        tap(() => {
          // Reset cart count after clearing
          this.cartCountSubject.next(0);
        }),
        catchError(this.handleError)
      );
  }

  // Generic error handler
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred with the cart operation';

    if (this.isBrowser && error.error instanceof Event) {
      // Client-side error in browser environment
      errorMessage = `Error: ${error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'You need to be logged in to manage your cart';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}