import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgetpassword',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgetpassword.component.html',
  styleUrl: './forgetpassword.component.css'
})
export class ForgetpasswordComponent {
  step: number = 1;
  isProcessing = signal(false);
  errorMessage = signal('');

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  verifyEmail: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email])
  });

  verifyCode: FormGroup = new FormGroup({
    resetCode: new FormControl(null, [Validators.required])
  });

  resetPassword: FormGroup = new FormGroup({
    email: new FormControl({ value: null, disabled: true }, [Validators.required, Validators.email]),
    newPassword: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[A-Z]\w{7,}$/)
    ]),
  });

  verifyEmailSubmit(): void {
    if (this.verifyEmail.invalid) return;

    this.isProcessing.set(true);
    const emailValue = this.verifyEmail.get('email')?.value;
    this.resetPassword.get('email')?.setValue(emailValue);

    this.authService.setEmailVerify(this.verifyEmail.value).subscribe({
      next: (res) => {
        if (res.statusMsg === "success") {
          this.step = 2;
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Failed to verify email');
        this.isProcessing.set(false);
      }
    });
  }

  verifyCodeSubmit(): void {
    if (this.verifyCode.invalid) return;

    this.isProcessing.set(true);

    this.authService.setCodeVerify(this.verifyCode.value).subscribe({
      next: (res) => {
        if (res.status === "Success") {
          this.step = 3;
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Invalid verification code');
        this.isProcessing.set(false);
      }
    });
  }

  resetPasswordSubmit(): void {
    if (this.resetPassword.invalid) return;

    this.isProcessing.set(true);

    // Get the raw value including disabled controls
    const formValue = {
      ...this.resetPassword.getRawValue()
    };

    this.authService.setResetPassword(formValue).subscribe({
      next: (res) => {
        localStorage.setItem("token", res.token);
        this.authService.getUserData();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Failed to reset password');
        this.isProcessing.set(false);
      }
    });
  }
}   
