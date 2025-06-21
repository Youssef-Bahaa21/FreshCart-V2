import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Iwishlist } from '../../../shared/interfaces/iwishlist';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private wishlistCountSubject = new BehaviorSubject<number>(0);
    public wishlistCount$ = this.wishlistCountSubject.asObservable();

    constructor(private httpClient: HttpClient) {
        // Initialize wishlist count when service is created
        this.getLoggedUserWishlist().subscribe({
            next: (res) => {
                if (res && res.data) {
                    this.wishlistCountSubject.next(res.data.length);
                }
            }
        });
    }

    addProductToWishlist(productId: string): Observable<any> {
        return this.httpClient.post(`https://ecommerce.routemisr.com/api/v1/wishlist`,
            { productId }
        ).pipe(
            tap((res: any) => {
                // Update wishlist count after adding
                if (res && res.data) {
                    this.wishlistCountSubject.next(res.data.length);
                }
            })
        );
    }

    getLoggedUserWishlist(): Observable<any> {
        return this.httpClient.get<Iwishlist>(`https://ecommerce.routemisr.com/api/v1/wishlist`)
            .pipe(
                tap((res: any) => {
                    // Update wishlist count when retrieving
                    if (res && res.data) {
                        this.wishlistCountSubject.next(res.data.length);
                    }
                })
            );
    }

    removeProductFromWishlist(productId: string): Observable<any> {
        return this.httpClient.delete(`https://ecommerce.routemisr.com/api/v1/wishlist/${productId}`)
            .pipe(
                tap((res: any) => {
                    // Update wishlist count after removal
                    if (res && res.data) {
                        this.wishlistCountSubject.next(res.data.length);
                    }
                })
            );
    }
} 