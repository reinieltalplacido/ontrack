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
  alertCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  DEFAULT_API_URL,
  getCustomApiUrl,
  resetCustomApiUrl,
  saveCustomApiUrl,
} from '../../core/utils/api-url.util';
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
  showForgotAlert = false;

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowBackOutline,
      logInOutline,
      alertCircleOutline,
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
    const currentUrl = getCustomApiUrl() || environment.apiUrl;
    const alert = await this.alertCtrl.create({
      header: 'Backend Server URL',
      subHeader: 'Live API is active by default. Only override this for local testing.',
      inputs: [
        {
          name: 'url',
          type: 'url',
          placeholder: DEFAULT_API_URL,
          value: currentUrl,
        },
      ],
      buttons: [
        {
          text: 'Reset Default',
          role: 'cancel',
          handler: () => {
            resetCustomApiUrl();
            this.toastService.showInfo(`Reset to default: ${DEFAULT_API_URL}`);
          },
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.url && data.url.trim()) {
              const u = saveCustomApiUrl(data.url);
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
