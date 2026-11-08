import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAlert,
  AlertController,
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
  serverOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

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
    IonAlert,
  ],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private alertCtrl = inject(AlertController);

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
      serverOutline,
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false],
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
    this.toastService.showInfo('Student demo credentials loaded!');
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
    this.toastService.showInfo('Coordinator demo credentials loaded!');
    this.cdr.detectChanges();
  }

  fillDemoCredentials() {
    this.fillDemoStudent();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.showError('Please enter your Student ID / Email and password.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login(email.trim(), password, !!rememberMe).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          const isCoord = res.role === 'professor' || !!res.professor;
          const name = res.professor?.full_name || 'Coordinator';
          this.toastService.showSuccess(
            isCoord ? `Welcome back, ${name}!` : 'Signed in successfully!'
          );
          if (isCoord) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.errorMessage = res.message || 'Invalid email or password.';
          this.toastService.showError(this.errorMessage);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to connect to server. Please try again.';
        this.toastService.showError(this.errorMessage);
        this.cdr.detectChanges();
      },
    });
  }

  forgotPassword() {
    this.showForgotAlert = true;
    this.cdr.detectChanges();
  }

  async configureServerUrl() {
    const currentUrl = localStorage.getItem('ontrack_api_url') || environment.apiUrl;
    const alert = await this.alertCtrl.create({
      header: 'Backend Server URL',
      subHeader: 'For APK testing on your mobile phone, set your PC\'s Wi-Fi IP (e.g. http://192.168.1.9/ontrack-api/api)',
      inputs: [
        {
          name: 'url',
          type: 'url',
          placeholder: 'http://192.168.1.9/ontrack-api/api',
          value: currentUrl,
        },
      ],
      buttons: [
        {
          text: 'Reset Default',
          role: 'cancel',
          handler: () => {
            localStorage.removeItem('ontrack_api_url');
            this.toastService.showInfo('Reset to default: http://localhost/ontrack-api/api');
          },
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.url && data.url.trim()) {
              let u = data.url.trim().replace(/\/+$/, '');
              if (!u.includes('/ontrack-api')) {
                u += '/ontrack-api';
              }
              if (!u.endsWith('/api')) {
                u += '/api';
              }
              localStorage.setItem('ontrack_api_url', u);
              this.toastService.showSuccess('Server connected to: ' + u);
              this.errorMessage = '';
              this.cdr.detectChanges();
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
