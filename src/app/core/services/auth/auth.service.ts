import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments';
import { jwtDecode } from 'jwt-Decode';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();

  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor(private httpClient: HttpClient) {
    // Initialize user data if token exists
    if (this.isBrowser) {
      this.loadUserData();
    }
  }

  private loadUserData(): void {
    try {
      const token = this.getToken();
      if (token) {
        const decodedToken = jwtDecode(token);
        this.userDataSubject.next(decodedToken);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.clearUserData();
    }
  }

  sendRegisterFrom(data: object): Observable<any> {
    return this.httpClient.post(`${enviroment.baseUrl}/api/v1/auth/signup`, data);
  }

  sendLoginFrom(data: object): Observable<any> {
    return this.httpClient.post(`${enviroment.baseUrl}/api/v1/auth/signin`, data);
  }

  getUserData(): any {
    return this.userDataSubject.getValue();
  }

  setToken(token: string): void {
    if (this.isBrowser) {
      // Store in both localStorage (for persistence) and sessionStorage (for Stripe redirect)
      localStorage.setItem('token', token);
      sessionStorage.setItem('stripe_redirect_token', token);

      try {
        const decodedToken = jwtDecode(token);
        this.userDataSubject.next(decodedToken);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      // Try localStorage first, then sessionStorage as fallback
      const localToken = localStorage.getItem('token');
      if (localToken) return localToken;

      // Check for token in sessionStorage (for Stripe redirect)
      const sessionToken = sessionStorage.getItem('stripe_redirect_token');
      if (sessionToken) {
        // Move it to localStorage for persistence
        localStorage.setItem('token', sessionToken);
        return sessionToken;
      }
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isTokenExpired(): boolean {
    try {
      const token = this.getToken();
      if (!token) return true;

      const decodedToken: any = jwtDecode(token);
      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);

      return expirationDate.valueOf() < new Date().valueOf();
    } catch (error) {
      return true;
    }
  }

  refreshUserData(): void {
    this.loadUserData();
  }

  logoutUser(): void {
    this.clearUserData();
    this.router.navigate(['/login']);
  }

  clearUserData(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('stripe_redirect_token');
    }
    this.userDataSubject.next(null);
  }

  setEmailVerify(data: object): Observable<any> {
    return this.httpClient.post(`${enviroment.baseUrl}/api/v1/auth/forgotPasswords`, data);
  }

  setCodeVerify(data: object): Observable<any> {
    return this.httpClient.post(`${enviroment.baseUrl}/api/v1/auth/verifyResetCode`, data);
  }

  setResetPassword(data: object): Observable<any> {
    return this.httpClient.put(`${enviroment.baseUrl}/api/v1/auth/resetPassword`, data);
  }
}
