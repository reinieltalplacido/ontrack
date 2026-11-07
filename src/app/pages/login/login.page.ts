import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonAlert,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowBackOutline,
  logInOutline,
  sparklesOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  personOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonToast,
    IonAlert,
  ],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  showToast = false;
  toastMessage = '';
  showForgotAlert = false;

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowBackOutline,
      logInOutline,
      sparklesOutline,
      alertCircleOutline,
      shieldCheckmarkOutline,
      personOutline,
    });

    this.loginForm = this.fb.group({
      email: ['2026-0001', [Validators.required]],
      password: ['Password123!', [Validators.required]],
      rememberMe: [true],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goBack() {
    this.router.navigate(['/landing']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  fillDemoStudent() {
    this.loginForm.patchValue({
      email: '2026-0001',
      password: 'Password123!',
    });
    this.errorMessage = '';
    this.toastMessage = 'Student demo credentials loaded!';
    this.showToast = true;
    this.cdr.detectChanges();
  }

  fillDemoCoordinator() {
    this.loginForm.patchValue({
      email: 'admin@neust.edu.ph',
      password: 'AdminPassword123!',
    });
    this.errorMessage = '';
    this.toastMessage = 'Coordinator demo credentials loaded!';
    this.showToast = true;
    this.cdr.detectChanges();
  }

  fillDemoCredentials() {
    this.fillDemoStudent();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const { email, password } = this.loginForm.value;

    this.authService.login(email.trim(), password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          if (res.role === 'professor' || res.professor) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.errorMessage = res.message || 'Invalid email or password.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to connect to server. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  forgotPassword() {
    this.showForgotAlert = true;
  }
}
