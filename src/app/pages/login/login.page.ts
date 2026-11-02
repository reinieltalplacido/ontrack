import { Component, inject } from '@angular/core';
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
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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

  fillDemoCredentials() {
    this.loginForm.patchValue({
      email: 'student@neust.edu.ph',
      password: 'Password123!',
    });
    this.toastMessage = 'Demo student credentials loaded!';
    this.showToast = true;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = res.message || 'Invalid email or password.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to connect to server. Please try again.';
      },
    });
  }

  forgotPassword() {
    this.showForgotAlert = true;
  }
}
