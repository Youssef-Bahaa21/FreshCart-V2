import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  msgError: string = "";
  Success: string = "";
  isLoading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  registerForm: FormGroup = new FormGroup({
    name: new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)]),
    email: new FormControl(null, [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[A-Z]\w{7,}$/)
    ]),
    rePassword: new FormControl(null, [
      Validators.required,
    ]),
    phone: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^01[0125][0-9]{8}$/)
    ]),
  }, { validators: this.confirmPassword });

  submitFrom(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.msgError = "";
      this.Success = "";

      this.authService.sendRegisterFrom(this.registerForm.value).subscribe({
        next: (res) => {
          if (res.message === 'success') {
            this.Success = "Account created successfully! Redirecting to login...";
            setTimeout(() => {
              this.router.navigate(['/login']);
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
      this.registerForm.markAllAsTouched();
    }
  }

  confirmPassword(group: AbstractControl) {
    const password = group.get('password')?.value;
    const rePassword = group.get('rePassword')?.value;
    if (password === rePassword) {
      return null;
    } else {
      return { mismatch: true };
    }
  }
}
