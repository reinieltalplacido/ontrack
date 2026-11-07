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
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { NativeService } from '../../core/services/native.service';
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/attendance.model';

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
  isLoading = false;
  isSaving = false;

  // Form Fields
  fullName = '';
  courseSection = '';
  schoolCampus = '';
  companyName = '';
  adviserName = '';
  requiredHours = 500;
  targetDate = '';
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
    });
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
        company_name: 'Project SOLO',
        adviser_name: 'Prof. Gel Cunanan',
        required_hours: 500,
        target_date: '2026-12-15',
      };
    }

    this.populateForm();
    this.loadStats();
  }

  populateForm() {
    if (!this.currentUser) return;
    this.fullName = this.currentUser.full_name || '';
    this.courseSection = this.currentUser.course_section || 'BSIT 4-A';
    this.schoolCampus = this.currentUser.school_campus || 'NEUST - Sumacab Campus';
    this.companyName = this.currentUser.company_name || 'Project SOLO';
    this.adviserName = this.currentUser.adviser_name || 'Prof. Gel Cunanan';
    this.requiredHours = this.currentUser.required_hours || 500;
    this.targetDate = this.currentUser.target_date || '2026-12-15';
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
      course_section: this.courseSection.trim(),
      school_campus: this.schoolCampus.trim(),
      company_name: this.companyName.trim(),
      adviser_name: this.adviserName.trim(),
      required_hours: Number(this.requiredHours) || 500,
      target_date: this.targetDate,
    };

    if (this.newPassword.trim()) {
      payload.new_password = this.newPassword.trim();
    }

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.user) {
          this.currentUser = res.user;
          this.newPassword = '';
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback('Profile updated successfully!', 'success');
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
    this.activeMenu = item;
    this.closeSideMenu();

    if (item === 'dashboard') {
      this.router.navigate(['/home']);
    } else if (item === 'tasks') {
      this.router.navigate(['/tasks']);
    } else if (item === 'timelogs') {
      this.router.navigate(['/timelogs']);
    } else if (item === 'reports') {
      this.router.navigate(['/reports']);
    }
  }

  logout() {
    this.closeSideMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'N/A';
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

