import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonSpinner,
  IonCard,
  IonBadge,
  IonModal,
  IonDatetime,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  schoolOutline,
  businessOutline,
  calendarOutline,
  lockClosedOutline,
  saveOutline,
  logOutOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  menuOutline,
  closeOutline,
  gridOutline,
  timeOutline,
  checkboxOutline,
  copyOutline,
  createOutline,
  keyOutline,
  eyeOutline,
  eyeOffOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { NativeService } from '../../core/services/native.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/attendance.model';
import { formatDate, formatHours, getTodayLocalIso } from '../../core/utils/format.util';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonSpinner,
    IonCard,
    IonBadge,
    IonModal,
    IonDatetime,
  ],
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private nativeService = inject(NativeService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  formatHours = formatHours;
  isLoading = false;
  isSaving = false;
  isEditMode = false;

  get remainingHours(): number {
    if (this.stats && typeof this.stats.remaining_hours === 'number' && this.stats.remaining_hours > 0) {
      return this.stats.remaining_hours;
    }
    const req = this.currentUser?.required_hours || 500;
    const acc = this.stats?.accumulated_hours || 0;
    return Math.max(0, req - acc);
  }

  get completionPercent(): number {
    if (this.stats && typeof this.stats.completion_percent === 'number') {
      return this.stats.completion_percent;
    }
    const req = this.currentUser?.required_hours || 500;
    const acc = this.stats?.accumulated_hours || 0;
    if (req <= 0) return 0;
    return Math.min(100, Math.round((acc / req) * 100));
  }

  /**
   * Current local date in YYYY-MM-DD format
   */
  get todayStr(): string {
    return getTodayLocalIso();
  }

  /**
   * If start_date is today or in the past, OJT has already started -> locked and cannot be edited.
   */
  get isStartDateLocked(): boolean {
    const sDate = this.currentUser?.start_date;
    if (!sDate) return false;
    return sDate <= this.todayStr;
  }

  /**
   * Minimum selectable start date when editing (future dates only, no backdates in the past).
   */
  get minStartDate(): string {
    return this.todayStr;
  }

  get minTargetDate(): string {
    return this.startDate && this.startDate > this.todayStr ? this.startDate : this.todayStr;
  }

  // Form Fields
  fullName = '';
  studentId = '';
  email = '';
  courseSection = '';
  schoolCampus = '';
  companyName = '';
  companyAddress = '';
  trainerName = '';
  adviserName = '';
  adviserEmail = '';
  startDate = '';
  targetDate = '';
  requiredHours = 0;
  newPassword = '';

  // Calendar Modal State
  isCalendarOpen = false;
  activeDateField: 'start_date' | 'target_date' = 'target_date';

  openCalendar(field: 'start_date' | 'target_date') {
    if (field === 'start_date' && this.isStartDateLocked) {
      return;
    }
    this.activeDateField = field;
    this.isCalendarOpen = true;
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  closeCalendar() {
    this.isCalendarOpen = false;
    this.cdr.detectChanges();
  }

  onDateSelected(event: any) {
    const selectedVal = event.detail?.value;
    if (selectedVal) {
      const dateOnly = selectedVal.split('T')[0];
      if (this.activeDateField === 'start_date') {
        this.startDate = dateOnly;
        if (this.targetDate && this.targetDate < this.startDate) {
          this.targetDate = this.startDate;
        }
      } else {
        this.targetDate = dateOnly;
      }
    }
    this.closeCalendar();
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  formatDisplayDate(dateStr?: string | null): string {
    if (!dateStr) return 'Select Date';
    return this.formatDate(dateStr);
  }

  // Side Drawer
  isSideMenuOpen = false;
  activeMenu = 'profile';

  // Feedback banner
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor() {
    addIcons({
      personOutline,
      schoolOutline,
      businessOutline,
      calendarOutline,
      lockClosedOutline,
      saveOutline,
      logOutOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      menuOutline,
      closeOutline,
      gridOutline,
      timeOutline,
      checkboxOutline,
      copyOutline,
      createOutline,
      keyOutline,
      eyeOutline,
      eyeOffOutline,
      informationCircleOutline,
    });
  }

  // Change Password Modal State
  isPasswordModalOpen = false;
  currentPasswordInput = '';
  newPasswordInput = '';
  confirmPasswordInput = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isChangingPassword = false;
  passwordError = '';

  openPasswordModal() {
    this.isPasswordModalOpen = true;
    this.currentPasswordInput = '';
    this.newPasswordInput = '';
    this.confirmPasswordInput = '';
    this.passwordError = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.cdr.detectChanges();
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
    this.passwordError = '';
    this.cdr.detectChanges();
  }

  submitChangePassword() {
    this.passwordError = '';

    if (!this.newPasswordInput.trim()) {
      this.passwordError = 'Please enter a new password.';
      return;
    }

    if (this.newPasswordInput.trim().length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }

    if (this.newPasswordInput !== this.confirmPasswordInput) {
      this.passwordError = 'New password and confirm password do not match.';
      return;
    }

    if (!this.currentUser?.id) {
      this.passwordError = 'Student session not found. Please sign in again.';
      return;
    }

    this.isChangingPassword = true;
    this.cdr.detectChanges();
    this.authService
      .changePassword({
        user_id: this.currentUser.id,
        role: 'student',
        current_password: this.currentPasswordInput,
        new_password: this.newPasswordInput.trim(),
        confirm_password: this.confirmPasswordInput.trim(),
      })
      .subscribe({
        next: (res) => {
          this.isChangingPassword = false;
          if (res.success) {
            this.closePasswordModal();
            this.toastService.showSuccess('Password updated successfully!');
            this.showFeedback('Your password has been changed successfully.', 'success');
          } else {
            this.passwordError = res.message || 'Unable to update password.';
            this.toastService.showError(this.passwordError);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isChangingPassword = false;
          this.passwordError = err?.error?.message || 'Server error while updating password.';
          this.toastService.showError(this.passwordError);
          this.cdr.detectChanges();
        },
      });
  }

  ionViewWillEnter() {
    this.activeMenu = 'profile';
    this.isSideMenuOpen = false;
    this.currentUser = this.authService.currentUserValue || this.currentUser;
    this.populateForm();
    this.loadStats();
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.populateForm();
    this.loadStats();
  }

  populateForm() {
    if (!this.currentUser) return;
    this.fullName = this.currentUser.full_name || '';
    this.studentId = this.currentUser.student_id || '';
    this.email = this.currentUser.email || '';
    this.courseSection = this.currentUser.course_section || '';
    this.schoolCampus = this.currentUser.school_campus || '';
    this.companyName = this.currentUser.company_name || '';
    this.companyAddress = this.currentUser.company_address || '';
    this.trainerName = this.currentUser.trainer_name || '';
    this.adviserName = this.currentUser.adviser_name || '';
    this.adviserEmail = this.currentUser.adviser_email || '';
    this.startDate = this.currentUser.start_date || '';
    this.targetDate = this.currentUser.target_date || '';
    this.requiredHours = Number(this.currentUser.required_hours) || 0;
    this.newPassword = '';
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.populateForm();
    }
    this.cdr.detectChanges();
  }

  cancelEdit() {
    this.populateForm();
    this.isEditMode = false;
    this.cdr.detectChanges();
  }

  loadStats() {
    if (!this.currentUser) return;
    this.attendanceService.getDashboardStats(this.currentUser.id).subscribe({
      next: (stats) => {
        if (stats) this.stats = stats;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  saveProfile() {
    if (!this.currentUser) return;
    if (!this.fullName.trim()) {
      this.showFeedback('Full name cannot be empty.', 'error');
      return;
    }

    // Start Date Constraints
    if (this.isStartDateLocked && this.startDate !== this.currentUser.start_date) {
      this.showFeedback('OJT has already started. The start date is locked and cannot be changed.', 'error');
      this.startDate = this.currentUser.start_date || this.startDate;
      return;
    }

    if (!this.isStartDateLocked && this.startDate && this.startDate < this.todayStr) {
      this.showFeedback('Start date cannot be set in the past. Only today or future dates are allowed.', 'error');
      return;
    }

    if (this.targetDate && this.startDate && this.targetDate < this.startDate) {
      this.showFeedback('Target end date cannot be earlier than the start date.', 'error');
      return;
    }

    if (
      this.targetDate &&
      this.targetDate !== this.currentUser.target_date &&
      this.targetDate < this.minTargetDate
    ) {
      this.showFeedback('Target end date cannot be in the past or earlier than the start date.', 'error');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const payload: any = {
      user_id: this.currentUser.id,
      full_name: this.fullName.trim(),
      student_id: this.studentId.trim(),
      email: this.email.trim(),
      course_section: this.courseSection.trim(),
      school_campus: this.schoolCampus.trim(),
      company_name: this.companyName.trim(),
      company_address: this.companyAddress.trim(),
      trainer_name: this.trainerName.trim(),
      adviser_name: this.adviserName.trim(),
      adviser_email: this.adviserEmail.trim(),
      start_date: this.startDate,
      target_date: this.targetDate,
      required_hours: Number(this.requiredHours) || 0,
    };

    if (this.newPassword.trim()) {
      payload.new_password = this.newPassword.trim();
    }

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.user) {
          this.currentUser = res.user;
          this.populateForm();
          this.isEditMode = false;
          this.showFeedback('Profile updated successfully!', 'success');
          this.loadStats();
        } else {
          this.showFeedback(res.message || 'Could not update profile.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSaving = false;
        this.showFeedback('Unable to connect to server.', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  // Side Drawer navigation
  openSideMenu() {
    this.isSideMenuOpen = true;
    this.cdr.detectChanges();
  }

  closeSideMenu() {
    this.isSideMenuOpen = false;
    this.cdr.detectChanges();
  }

  selectMenuItem(item: string) {
    this.closeSideMenu();

    if (item === 'dashboard') {
      this.router.navigate(['/home']);
    } else if (item === 'tasks') {
      this.router.navigate(['/tasks']);
    } else if (item === 'timelogs') {
      this.router.navigate(['/timelogs']);
    } else if (item === 'reports') {
      this.router.navigate(['/reports']);
    } else if (item === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  logout() {
    this.closeSideMenu();
    this.authService.logout();
    this.toastService.showInfo('Signed out of student account.');
    this.router.navigate(['/login']);
  }

  formatDate(dateStr?: string | null): string {
    return formatDate(dateStr, 'Not set', '2-digit');
  }

  showFeedback(msg: string, type: 'success' | 'error') {
    this.feedbackMessage = msg;
    this.feedbackType = type;
    this.toastService.show(msg, type);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.feedbackMessage = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}
