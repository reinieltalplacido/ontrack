import { Component, OnInit, inject } from '@angular/core';
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  schoolOutline,
  businessOutline,
  mailOutline,
  calendarOutline,
  hourglassOutline,
  lockClosedOutline,
  saveOutline,
  logOutOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  cameraOutline,
  arrowBackOutline,
  menuOutline,
  closeOutline,
  gridOutline,
  timeOutline,
  checkboxOutline,
  copyOutline,
  shieldCheckmarkOutline,
  createOutline,
  locationOutline,
  callOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { NativeService } from '../../core/services/native.service';
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/attendance.model';
import { formatHours } from '../../core/utils/format.util';

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
  ],
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private nativeService = inject(NativeService);
  private router = inject(Router);

  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  formatHours = formatHours;
  isLoading = false;
  isSaving = false;
  isEditMode = false;

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
      mailOutline,
      calendarOutline,
      hourglassOutline,
      lockClosedOutline,
      saveOutline,
      logOutOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      cameraOutline,
      arrowBackOutline,
      menuOutline,
      closeOutline,
      gridOutline,
      timeOutline,
      checkboxOutline,
      copyOutline,
      shieldCheckmarkOutline,
      createOutline,
      locationOutline,
      callOutline,
    });
  }

  ionViewWillEnter() {
    this.activeMenu = 'profile';
    this.isSideMenuOpen = false;
    this.currentUser = this.authService.currentUserValue || this.currentUser;
    this.populateForm();
    this.loadStats();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.currentUser = {
        id: 1,
        student_id: 'SUM2023-00980',
        full_name: 'Reiniel Talplacido',
        email: 'reiniel@student.neust.edu.ph',
        course_section: 'BSIT 4-A',
        school_campus: 'NEUST - Sumacab Campus',
        company_name: 'Innovate Tech Solutions Inc.',
        company_address: 'Maharlika Highway, Cabanatuan City',
        trainer_name: 'Engr. Michael Santos',
        adviser_name: 'Prof. Alexander Reyes',
        adviser_email: 'admin@neust.edu.ph',
        start_date: '2026-08-15',
        target_date: '2026-12-15',
        required_hours: 500,
      };
    }

    this.populateForm();
    this.loadStats();
  }

  populateForm() {
    if (!this.currentUser) return;
    this.fullName = this.currentUser.full_name || '';
    this.studentId = this.currentUser.student_id || '';
    this.email = this.currentUser.email || '';
    this.courseSection = this.currentUser.course_section || 'BSIT 4-A';
    this.schoolCampus = this.currentUser.school_campus || 'NEUST - Sumacab Campus';
    this.companyName = this.currentUser.company_name || 'Innovate Tech Solutions Inc.';
    this.companyAddress = this.currentUser.company_address || '';
    this.trainerName = this.currentUser.trainer_name || '';
    this.adviserName = this.currentUser.adviser_name || 'Prof. Alexander Reyes';
    this.adviserEmail = this.currentUser.adviser_email || 'admin@neust.edu.ph';
    this.startDate = this.currentUser.start_date || '2026-08-15';
    this.targetDate = this.currentUser.target_date || '2026-12-15';
    this.requiredHours = Number(this.currentUser.required_hours) || 0;
    this.newPassword = '';
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.populateForm();
    }
  }

  cancelEdit() {
    this.populateForm();
    this.isEditMode = false;
  }

  loadStats() {
    if (!this.currentUser) return;
    this.attendanceService.getDashboardStats(this.currentUser.id).subscribe({
      next: (stats) => {
        if (stats) this.stats = stats;
      },
      error: () => {},
    });
  }

  saveProfile() {
    if (!this.currentUser) return;
    if (!this.fullName.trim()) {
      this.showFeedback('Full name cannot be empty.', 'error');
      return;
    }

    this.isSaving = true;

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
      },
      error: () => {
        this.isSaving = false;
        this.showFeedback('Unable to connect to server.', 'error');
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // Side Drawer navigation
  openSideMenu() {
    this.isSideMenuOpen = true;
  }

  closeSideMenu() {
    this.isSideMenuOpen = false;
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
    this.router.navigate(['/login']);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'Not set';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  showFeedback(msg: string, type: 'success' | 'error') {
    this.feedbackMessage = msg;
    this.feedbackType = type;
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 3500);
  }
}
