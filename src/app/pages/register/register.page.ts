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
  IonModal,
  IonDatetime,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  personOutline,
  businessOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  schoolOutline,
  timeOutline,
  sparklesOutline,
  alertCircleOutline,
  calendarOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonToast,
    IonModal,
    IonDatetime,
  ],
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  showToast = false;
  toastMessage = '';
  isCalendarOpen = false;

  courses = [
    { code: 'BSIT', name: 'BS in Information Technology' },
    { code: 'BSCS', name: 'BS in Computer Science' },
    { code: 'BSEMC', name: 'BS in Entertainment & Multimedia' },
    { code: 'ACT', name: 'Associate in Computer Tech' },
  ];

  yearLevels = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year (Graduating / OJT)' },
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      arrowForwardOutline,
      checkmarkCircleOutline,
      personOutline,
      businessOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      schoolOutline,
      timeOutline,
      sparklesOutline,
      alertCircleOutline,
      calendarOutline,
    });

    this.registerForm = this.fb.group({
      // Step 1: Academic & Personal
      student_no: ['', [Validators.required, Validators.pattern(/^[0-9a-zA-Z\-_]+$/)]],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      course: ['BSIT', [Validators.required]],
      year_level: [4, [Validators.required, Validators.min(1), Validators.max(6)]],
      email: ['', [Validators.required, Validators.email]],

      // Step 2: OJT & Company Details
      company_name: ['', [Validators.required]],
      adviser_name: ['Prof. Maria Santos', [Validators.required]],
      adviser_email: ['adviser@neust.edu.ph', [Validators.email]],
      required_hours: [486, [Validators.required, Validators.min(50), Validators.max(1000)]],
      target_date: ['2026-12-15', [Validators.required]],

      // Step 3: Account Security
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
    });
  }

  isStep1Valid(): boolean {
    const s1 = ['student_no', 'full_name', 'course', 'year_level', 'email'];
    return s1.every((field) => this.registerForm.get(field)?.valid);
  }

  isStep2Valid(): boolean {
    const s2 = ['company_name', 'adviser_name', 'required_hours', 'target_date'];
    return s2.every((field) => this.registerForm.get(field)?.valid);
  }

  isStep3Valid(): boolean {
    const pass = this.registerForm.get('password')?.value;
    const confirm = this.registerForm.get('confirm_password')?.value;
    const passValid = this.registerForm.get('password')?.valid;
    return !!(passValid && pass && pass === confirm);
  }

  nextStep() {
    this.errorMessage = '';
    if (this.currentStep === 1) {
      if (!this.isStep1Valid()) {
        this.markFieldsTouched(['student_no', 'full_name', 'course', 'year_level', 'email']);
        this.errorMessage = 'Please complete all academic fields accurately.';
        return;
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (!this.isStep2Valid()) {
        this.markFieldsTouched(['company_name', 'adviser_name', 'required_hours', 'target_date']);
        this.errorMessage = 'Please specify your company and target rendering hours.';
        return;
      }
      this.currentStep = 3;
    }
  }

  prevStep() {
    this.errorMessage = '';
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/login']);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  openCalendar() {
    this.isCalendarOpen = true;
  }

  closeCalendar() {
    this.isCalendarOpen = false;
  }

  onDateSelected(event: any) {
    const selectedVal = event.detail.value;
    if (selectedVal) {
      // Extract YYYY-MM-DD
      const dateOnly = selectedVal.split('T')[0];
      this.registerForm.patchValue({ target_date: dateOnly });
    }
    this.closeCalendar();
  }

  getFormattedDate(dateStr: string): string {
    if (!dateStr) return 'Select date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private markFieldsTouched(fields: string[]) {
    fields.forEach((f) => this.registerForm.get(f)?.markAsTouched());
  }

  fillSampleOjtData() {
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.registerForm.patchValue({
      student_no: `SUM2023-0${randomNum}`,
      full_name: 'Alexandria Reyes',
      course: 'BSIT',
      year_level: 4,
      email: `alexandria.reyes${randomNum}@neust.edu.ph`,
      company_name: 'Innovatech Systems Hub',
      adviser_name: 'Prof. Maria Santos',
      adviser_email: 'maria.santos@neust.edu.ph',
      required_hours: 486,
      target_date: '2026-12-15',
      password: 'Password123!',
      confirm_password: 'Password123!',
    });
    this.toastMessage = 'Sample student & OJT details filled!';
    this.showToast = true;
  }

  onSubmit() {
    if (!this.isStep3Valid()) {
      this.markFieldsTouched(['password', 'confirm_password']);
      if (this.registerForm.get('password')?.value !== this.registerForm.get('confirm_password')?.value) {
        this.errorMessage = 'Passwords do not match.';
      } else {
        this.errorMessage = 'Password must be at least 6 characters.';
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValues = this.registerForm.value;

    this.authService.register(formValues).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.toastMessage = 'Account created successfully!';
          this.showToast = true;
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 800);
        } else {
          this.errorMessage = res.message || 'Registration failed. Please check your information.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to register account. Please check your connection.';
      },
    });
  }
}
