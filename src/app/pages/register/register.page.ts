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
  IonModal,
  IonDatetime,
  IonBadge,
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
  personCircleOutline,
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
    IonBadge,
  ],
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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

  sections = [
    { code: 'A', label: 'Section A (BSIT 4-A)' },
    { code: 'B', label: 'Section B (BSIT 4-B)' },
    { code: 'C', label: 'Section C (BSIT 4-C)' },
    { code: 'D', label: 'Section D (BSIT 4-D)' },
    { code: 'E', label: 'Section E (BSIT 4-E)' },
    { code: 'F', label: 'Section F (BSIT 4-F)' },
    { code: 'G', label: 'Section G (BSIT 4-G)' },
    { code: 'H', label: 'Section H (BSIT 4-H)' },
    { code: 'I', label: 'Section I (BSIT 4-I)' },
    { code: 'J', label: 'Section J (BSIT 4-J)' },
    { code: 'K', label: 'Section K (BSIT 4-K)' },
  ];

  assignedCoordinator: any = null;
  isLoadingCoordinator = false;

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
      personCircleOutline,
    });

    this.registerForm = this.fb.group({
      // Step 1: Academic & Personal
      student_no: ['', [Validators.required, Validators.pattern(/^[0-9a-zA-Z\-_]+$/)]],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      course: ['BSIT', [Validators.required]],
      year_level: [4, [Validators.required, Validators.min(1), Validators.max(6)]],
      section: ['A', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],

      // Step 2: OJT & Company Details
      company_name: ['', [Validators.required]],
      adviser_name: ['', [Validators.required]],
      adviser_email: ['', [Validators.email]],
      required_hours: [486, [Validators.required, Validators.min(50), Validators.max(1000)]],
      target_date: ['2026-12-15', [Validators.required]],

      // Step 3: Account Security
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
    });

    // Auto-fetch coordinator whenever section, course, or year level changes
    this.registerForm.get('section')?.valueChanges.subscribe((sec) => {
      this.fetchAssignedCoordinator(sec);
    });

    this.registerForm.get('course')?.valueChanges.subscribe(() => {
      this.fetchAssignedCoordinator(this.registerForm.get('section')?.value || 'A');
    });

    // Initial coordinator lookup
    this.fetchAssignedCoordinator('A');
  }

  fetchAssignedCoordinator(secCode: string) {
    const course = this.registerForm.get('course')?.value || 'BSIT';
    const year = this.registerForm.get('year_level')?.value || 4;
    const fullSection = `${course} ${year}-${secCode}`;

    this.isLoadingCoordinator = true;
    this.authService.getCoordinatorForSection(fullSection).subscribe({
      next: (res) => {
        this.isLoadingCoordinator = false;
        if (res.success && res.coordinator) {
          this.assignedCoordinator = res.coordinator;
          this.registerForm.patchValue({
            adviser_name: res.coordinator.full_name,
            adviser_email: res.coordinator.email,
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingCoordinator = false;
        this.cdr.detectChanges();
      },
    });
  }

  isStep1Valid(): boolean {
    const s1 = ['student_no', 'full_name', 'course', 'year_level', 'section', 'email'];
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
      section: 'B',
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
          this.toastMessage = this.errorMessage;
          this.showToast = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to register account. Please check your connection.';
        this.toastMessage = this.errorMessage;
        this.showToast = true;
        this.cdr.detectChanges();
      },
    });
  }
}
