import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  msgError: string = "";
  Success: string = "";
  isLoading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[A-Z]\w{7,}$/)
    ]),
  });

  submitFrom(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.msgError = "";
      this.Success = "";

      this.authService.sendLoginFrom(this.loginForm.value).subscribe({
        next: (res) => {
          if (res.message === 'success') {
            this.Success = "Login successful! Redirecting...";
            this.authService.setToken(res.token);

            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');

            setTimeout(() => {
              if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                this.router.navigateByUrl(redirectUrl);
              } else {
                this.router.navigate(['/home']);
              }
            }, 1500);
          }
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.msgError = err.error.message;
          this.isLoading.set(false);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
