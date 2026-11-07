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
  chevronDownOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

export interface CollegeProgramGroup {
  college: string;
  programs: string[];
}

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

  collegeCourses: CollegeProgramGroup[] = [
    {
      college: 'College of Architecture',
      programs: [
        'Bachelor of Science in Architecture',
        'Certificate in Drafting Technology',
        'Certificate in Computer Aided Design and Drafting',
        'Certificate in Building, Utilities and Technology',
      ],
    },
    {
      college: 'College of Education',
      programs: [
        'Bachelor of Elementary Education',
        'Bachelor of Secondary Education Major in English',
        'Bachelor of Secondary Education Major in Filipino',
        'Bachelor of Secondary Education Major in Mathematics',
        'Bachelor of Secondary Education Major in Science',
        'Bachelor of Secondary Education Major in Social Studies',
        'Bachelor of Secondary Education Major in Physics',
        'Bachelor of Science in Industrial Education Major in Industrial Arts',
        'Bachelor of Physical Education',
        'Bachelor of Early Childhood Education',
        'Bachelor of Technology and Livelihood Education Major in Home Economics',
        'Bachelor of Special Needs Education – Generalist',
        'Certificate in Professional Teacher Education',
        'Post Baccalaureate Diploma in Alternative Learning System',
      ],
    },
    {
      college: 'College of Engineering',
      programs: [
        'Bachelor of Science in Civil Engineering',
        'Bachelor of Science in Electrical Engineering',
        'Bachelor of Science in Mechanical Engineering',
      ],
    },
    {
      college: 'College of Criminology',
      programs: [
        'Bachelor of Science in Criminology',
      ],
    },
    {
      college: 'College of Information and Communications Technology',
      programs: [
        'Bachelor of Science in Information Technology with Specialization in Database Systems Technology',
        'Bachelor of Science in Information Technology with Specialization in Network Systems Technology',
        'Bachelor of Science in Information Technology with Specialization in Web Systems Technology',
        'Bachelor of Science in Data Science',
      ],
    },
    {
      college: 'College of Management and Business Technology',
      programs: [
        'Bachelor of Science in Business Administration Major in Business Economics',
        'Bachelor of Science in Business Administration Major in Service Management for Business Process Outsourcing',
        'Bachelor of Science in Business Administration Major in Financial Management',
        'Bachelor of Science in Business Administration Major in Human Resource Management',
        'Bachelor of Science in Business Administration Major in Marketing Management',
        'Bachelor of Science in Entrepreneurship',
        'Bachelor of Science in Hospitality Management',
        'Bachelor of Science in Tourism Management',
      ],
    },
    {
      college: 'College of Public Administration and Disaster Management',
      programs: [
        'Bachelor of Public Administration',
        'Bachelor of Public Administration with Major in Disaster Risk Management',
      ],
    },
  ];

  yearLevels = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' },
    { value: 5, label: '5th Year' },
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
      chevronDownOutline,
    });

    this.registerForm = this.fb.group({
      // Step 1: Academic & Personal
      student_no: ['', [Validators.required, Validators.pattern(/^[0-9a-zA-Z\-_]+$/)]],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      course: ['Bachelor of Science in Information Technology with Specialization in Web Systems Technology', [Validators.required]],
      year_level: [4, [Validators.required, Validators.min(1), Validators.max(5)]],
      section: ['4-A', [Validators.required]],
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

    // Auto-uppercase full_name whenever value changes
    this.registerForm.get('full_name')?.valueChanges.subscribe((val) => {
      if (typeof val === 'string') {
        const upper = val.toUpperCase();
        if (val !== upper) {
          this.registerForm.get('full_name')?.setValue(upper, { emitEvent: false });
        }
      }
    });

    // Auto-fetch coordinator whenever section, course, or year level changes
    this.registerForm.get('section')?.valueChanges.subscribe((sec) => {
      this.fetchAssignedCoordinator(sec);
    });

    this.registerForm.get('course')?.valueChanges.subscribe(() => {
      this.fetchAssignedCoordinator(this.registerForm.get('section')?.value || '4-A');
    });

    this.registerForm.get('year_level')?.valueChanges.subscribe(() => {
      this.fetchAssignedCoordinator(this.registerForm.get('section')?.value || '4-A');
    });

    // Initial coordinator lookup
    this.fetchAssignedCoordinator('4-A');
  }

  onFullNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = (input.value || '').toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
    }
    this.registerForm.get('full_name')?.setValue(upper, { emitModelToViewChange: false });
  }

  onFullNameBlur() {
    const val = this.registerForm.get('full_name')?.value;
    if (val && typeof val === 'string') {
      this.registerForm.get('full_name')?.setValue(val.toUpperCase());
    }
  }

  onSectionInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = (input.value || '').toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
      this.registerForm.get('section')?.setValue(upper, { emitModelToViewChange: false });
    }
  }

  fetchAssignedCoordinator(secInput: string) {
    const trimmed = (secInput || '').trim();
    if (!trimmed) return;

    const year = this.registerForm.get('year_level')?.value || 4;
    const upper = trimmed.toUpperCase();

    // Extract letter/section code (e.g., "4-A" -> "A", "SECTION A" -> "A", "A" -> "A")
    const match = upper.match(/[A-Z0-9]+$/i);
    const secLetter = match ? match[0] : upper;
    const fullSection = upper.includes('-') ? upper : `BSIT ${year}-${secLetter}`;

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
        this.markFieldsTouched(['student_no', 'full_name', 'course', 'year_level', 'section', 'email']);
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
      full_name: 'REINIEL TALPLACIDO',
      course: 'Bachelor of Science in Information Technology with Specialization in Web Systems Technology',
      year_level: 4,
      section: '4-A',
      email: `reiniel.talplacido${randomNum}@neust.edu.ph`,
      company_name: 'Innovatech Systems Hub',
      adviser_name: 'Prof. Alexander Reyes',
      adviser_email: 'admin@neust.edu.ph',
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
