import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  IonDatetime,
  IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  businessOutline,
  shieldCheckmarkOutline,
  eyeOutline,
  eyeOffOutline,
  schoolOutline,
  alertCircleOutline,
  calendarOutline,
  personCircleOutline,
  chevronDownOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { getTodayLocalIso } from '../../core/utils/format.util';

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
  private toastService = inject(ToastService);

  registerForm: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  isCalendarOpen = false;
  activeDateField: 'start_date' | 'target_date' = 'target_date';

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

  campuses = [
    'NEUST - Sumacab Campus',
    'NEUST - General Tinio Campus',
    'NEUST - San Isidro Campus',
    'NEUST - Fort Magsaysay Campus',
    'NEUST - Atate Campus',
    'NEUST - Peñaranda Campus',
    'NEUST - Gabaldon Campus',
    'NEUST - Carranglan Campus',
    'NEUST - Talavera Campus',
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
      businessOutline,
      shieldCheckmarkOutline,
      eyeOutline,
      eyeOffOutline,
      schoolOutline,
      alertCircleOutline,
      calendarOutline,
      personCircleOutline,
      chevronDownOutline,
    });

    const todayIso = getTodayLocalIso();

    this.registerForm = this.fb.group({
      // Step 1: Academic & Personal
      student_no: ['', [Validators.required, Validators.pattern(/^[0-9a-zA-Z\-_]+$/)]],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      school_campus: ['NEUST - Sumacab Campus', [Validators.required]],
      course: ['Bachelor of Science in Information Technology with Specialization in Web Systems Technology', [Validators.required]],
      year_level: [4, [Validators.required, Validators.min(1), Validators.max(5)]],
      section: ['4-A', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],

      // Step 2: OJT & Company Details
      company_name: ['', [Validators.required]],
      company_address: ['', [Validators.required]],
      trainer_name: ['', [Validators.required]],
      adviser_name: ['', [Validators.required]],
      adviser_email: ['', [Validators.email]],
      start_date: [todayIso, [Validators.required]],
      required_hours: [0, [Validators.required, Validators.min(0)]],
      target_date: ['', [Validators.required]],

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

    // Auto-fetch coordinator whenever campus, section, course, or year level changes
    this.registerForm.get('school_campus')?.valueChanges.subscribe(() => {
      this.fetchAssignedCoordinator(this.registerForm.get('section')?.value || '4-A');
    });

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

  getCollegeForCourse(courseName: string): string {
    for (const group of this.collegeCourses) {
      if (group.programs.includes(courseName)) {
        return group.college;
      }
    }
    return '';
  }

  getCourseCode(courseName: string): string {
    const c = (courseName || '').toUpperCase();
    if (c.includes('CIVIL ENGINEERING')) return 'BSCE';
    if (c.includes('ELECTRICAL ENGINEERING')) return 'BSEE';
    if (c.includes('MECHANICAL ENGINEERING')) return 'BSME';
    if (c.includes('ENGINEERING')) return 'BSCE';
    if (c.includes('ARCHITECTURE') || c.includes('DRAFTING') || c.includes('CADD') || c.includes('BUILDING')) return 'BSARCH';
    if (c.includes('ELEMENTARY EDUCATION') || c.includes('BEED')) return 'BEED';
    if (c.includes('SECONDARY EDUCATION') || c.includes('BSED')) return 'BSED';
    if (c.includes('EDUCATION') || c.includes('TEACHER') || c.includes('PHYSICAL EDUCATION')) return 'BSED';
    if (c.includes('CRIMINOLOGY')) return 'BSCRIM';
    if (c.includes('BUSINESS ADMINISTRATION') || c.includes('BSBA') || c.includes('ENTREPRENEURSHIP')) return 'BSBA';
    if (c.includes('HOSPITALITY')) return 'BSHM';
    if (c.includes('TOURISM')) return 'BSTM';
    if (c.includes('PUBLIC ADMINISTRATION')) return 'BPA';
    if (c.includes('DATA SCIENCE')) return 'BSDS';
    return 'BSIT';
  }

  getCanonicalSection(): string {
    const course = this.registerForm.get('course')?.value || '';
    const code = this.getCourseCode(course);
    const year = this.registerForm.get('year_level')?.value || 4;
    const sec = (this.registerForm.get('section')?.value || '4-A').trim().toUpperCase();

    // If user already typed "BSCE 4-A" or "BSIT 4-A", keep it
    if (sec.startsWith('BS') || sec.startsWith('BE') || sec.startsWith('BP')) {
      return sec;
    }

    // Extract section letter / number (e.g. "4-A" -> "A", "A" -> "A")
    const match = sec.match(/[A-Z0-9]+$/);
    const letter = match ? match[0] : 'A';
    return `${code} ${year}-${letter}`;
  }

  fetchAssignedCoordinator(secInput: string) {
    const trimmed = (secInput || '').trim();
    const course = this.registerForm.get('course')?.value || '';
    const college = this.getCollegeForCourse(course);
    const campus = this.registerForm.get('school_campus')?.value || 'NEUST - Sumacab Campus';
    const year = this.registerForm.get('year_level')?.value || 4;

    const canonicalSec = this.getCanonicalSection();

    this.isLoadingCoordinator = true;
    this.authService.getCoordinatorForSection(trimmed || canonicalSec, course, college, year, campus).subscribe({
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
    const s1 = ['student_no', 'full_name', 'school_campus', 'course', 'year_level', 'section', 'email'];
    return s1.every((field) => this.registerForm.get(field)?.valid);
  }

  isStep2Valid(): boolean {
    const s2 = ['company_name', 'company_address', 'trainer_name', 'adviser_name', 'start_date', 'required_hours', 'target_date'];
    const controlsValid = s2.every((field) => this.registerForm.get(field)?.valid);
    return controlsValid && !this.isStartDateInvalid && !this.isTargetDateInvalid;
  }

  get minStartDate(): string {
    return getTodayLocalIso();
  }

  get minTargetDate(): string {
    const start = this.registerForm?.get('start_date')?.value;
    const today = this.minStartDate;
    return start && start > today ? start : today;
  }

  get calendarValue(): string | undefined {
    const val = this.registerForm?.get(this.activeDateField)?.value;
    const min = this.activeDateField === 'start_date' ? this.minStartDate : this.minTargetDate;
    return val && val >= min ? val : undefined;
  }

  get isStartDateInvalid(): boolean {
    const start = this.registerForm?.get('start_date')?.value;
    return !start || start < this.minStartDate;
  }

  get isTargetDateInvalid(): boolean {
    const start = this.registerForm?.get('start_date')?.value;
    const target = this.registerForm?.get('target_date')?.value;
    if (!target || target < this.minStartDate) return true;
    return !!(start && target < start);
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
        this.markFieldsTouched(['student_no', 'full_name', 'school_campus', 'course', 'year_level', 'section', 'email']);
        this.errorMessage = 'Please complete all academic fields accurately.';
        this.cdr.detectChanges();
        return;
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (!this.isStep2Valid()) {
        this.markFieldsTouched(['company_name', 'company_address', 'trainer_name', 'adviser_name', 'start_date', 'required_hours', 'target_date']);
        if (this.isStartDateInvalid || this.isTargetDateInvalid) {
          this.errorMessage = 'Start date cannot be in the past, and target end date must be on or after the start date.';
          this.toastService.showError(this.errorMessage);
        } else {
          this.errorMessage = 'Please specify all company, trainer, and OJT schedule details.';
        }
        this.cdr.detectChanges();
        return;
      }
      this.currentStep = 3;
    }
    this.cdr.detectChanges();
  }

  prevStep() {
    this.errorMessage = '';
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/login']);
    }
    this.cdr.detectChanges();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.cdr.detectChanges();
  }

  openCalendar(field: 'start_date' | 'target_date' = 'target_date') {
    this.activeDateField = field;
    this.isCalendarOpen = true;
    this.cdr.detectChanges();
  }

  closeCalendar() {
    this.isCalendarOpen = false;
    this.cdr.detectChanges();
  }

  onDateSelected(event: any) {
    const selectedVal = event.detail?.value;
    if (selectedVal) {
      // Extract YYYY-MM-DD
      const dateOnly = selectedVal.split('T')[0];
      if (this.activeDateField === 'start_date') {
        if (dateOnly < this.minStartDate) {
          this.toastService.showError('Start date cannot be in the past.');
          this.closeCalendar();
          return;
        }
        this.registerForm.patchValue({ start_date: dateOnly });
        const curTarget = this.registerForm.get('target_date')?.value;
        if (curTarget && curTarget < dateOnly) {
          this.registerForm.patchValue({ target_date: dateOnly });
          this.toastService.showInfo('Target end date adjusted to match the new start date.');
        }
      } else {
        if (dateOnly < this.minTargetDate) {
          this.toastService.showError('Target end date cannot be in the past or earlier than the start date.');
          this.closeCalendar();
          return;
        }
        this.registerForm.patchValue({ target_date: dateOnly });
      }
      this.registerForm.get(this.activeDateField)?.markAsTouched();
    }
    this.closeCalendar();
    this.cdr.detectChanges();
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

  onSubmit() {
    if (!this.isStep3Valid()) {
      this.markFieldsTouched(['password', 'confirm_password']);
      if (this.registerForm.get('password')?.value !== this.registerForm.get('confirm_password')?.value) {
        this.errorMessage = 'Passwords do not match.';
      } else {
        this.errorMessage = 'Password must be at least 6 characters.';
      }
      this.toastService.showError(this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const formValues = {
      ...this.registerForm.value,
      course_section: this.getCanonicalSection(),
    };

    this.authService.register(formValues).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.toastService.showSuccess('Account registered successfully! Welcome to OnTrack.');
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 800);
        } else {
          this.errorMessage = res.message || 'Registration failed. Please check your information.';
          this.toastService.showError(this.errorMessage);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to register account. Please check your connection.';
        this.toastService.showError(this.errorMessage);
        this.cdr.detectChanges();
      },
    });
  }
}
