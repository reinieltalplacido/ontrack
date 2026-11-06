import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowBackOutline,
  shieldCheckmarkOutline,
  schoolOutline,
  sparklesOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.page.html',
  styleUrls: ['./admin-login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
      IonIcon,
    IonSpinner,
  ],
})
export class AdminLoginPage {
  private adminService = inject(AdminService);
  private router = inject(Router);

  identifier = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowBackOutline,
      shieldCheckmarkOutline,
      schoolOutline,
      sparklesOutline,
      alertCircleOutline,
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  fillDemoAdmin() {
    this.identifier = 'admin@neust.edu.ph';
    this.password = 'AdminPassword123!';
    this.errorMessage = '';
  }

  submitLogin() {
    if (!this.identifier.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter your faculty email/ID and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.login(this.identifier.trim(), this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMessage = res.message || 'Invalid professor credentials.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Server error. Please verify backend is running.';
      },
    });
  }

  goToStudentLogin() {
    this.router.navigate(['/login']);
  }
}
