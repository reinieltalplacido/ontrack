import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonTextarea,
  IonInput,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  locationOutline,
  cameraOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  calendarOutline,
  createOutline,
  chevronForwardOutline,
  logOutOutline,
  refreshOutline,
  alertCircleOutline,
  documentTextOutline,
  personCircleOutline,
  closeOutline,
  businessOutline,
  sparklesOutline,
  menuOutline,
  arrowUpOutline,
  stopwatchOutline,
  gridOutline,
  checkboxOutline,
  personOutline,
  copyOutline,
} from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';
import { AttendanceService } from '../core/services/attendance.service';
import { NativeService } from '../core/services/native.service';
import { User } from '../models/user.model';
import { AttendanceLog, DashboardStats } from '../models/attendance.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonTextarea,
    IonInput,
    IonSpinner,
  ],
})
export class HomePage implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private nativeService = inject(NativeService);
  private router = inject(Router);

  currentUser: User | null = null;
  stats: DashboardStats = {
    accumulated_hours: 0,
    required_hours: 500,
    remaining_hours: 500,
    completion_percent: 0,
    days_remaining: 180,
    total_days_logged: 0,
    is_clocked_in: false,
    pending_tasks: 0,
    completed_tasks: 0,
    today_log: null,
  };
  recentLogs: AttendanceLog[] = [];

  isLoading = true;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  // Clock In modal state
  showClockInModal = false;
  isGettingLocation = false;
  currentCoords: { latitude: number; longitude: number } | null = null;
  locationName = 'Office / Duty Workplace';
  selfiePreview: string | null = null;
  isSubmittingClockIn = false;

  // Clock Out modal state
  showClockOutModal = false;
  activityNotes = '';
  isSubmittingClockOut = false;

  // Edit Goal modal state
  showEditGoalModal = false;
  editRequiredHours = 500;
  editTargetDate = '';

  // Profile menu modal
  showProfileModal = false;

  // Side Drawer Menu state
  isSideMenuOpen = false;
  activeMenu = 'dashboard';

  constructor() {
    addIcons({
      timeOutline,
      locationOutline,
      cameraOutline,
      checkmarkCircleOutline,
      hourglassOutline,
      calendarOutline,
      createOutline,
      chevronForwardOutline,
      logOutOutline,
      refreshOutline,
      alertCircleOutline,
      documentTextOutline,
      personCircleOutline,
      closeOutline,
      businessOutline,
      sparklesOutline,
      menuOutline,
      arrowUpOutline,
      stopwatchOutline,
      gridOutline,
      checkboxOutline,
      personOutline,
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

    this.editRequiredHours = this.currentUser.required_hours || 500;
    this.editTargetDate = this.currentUser.target_date || '2026-12-15';

    this.loadDashboardData();
  }

  loadDashboardData(event?: any) {
    if (!this.currentUser) {
      if (event) event.target.complete();
      return;
    }

    const userId = this.currentUser.id;

    // Load stats
    this.attendanceService.getDashboardStats(userId).subscribe({
      next: (stats) => {
        if (stats) {
          this.stats = stats;
        }
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading = false;
        if (event) event.target.complete();
      },
    });

    // Load recent history logs
    this.attendanceService.getAttendanceHistory(userId).subscribe({
      next: (res) => {
        if (res && res.logs) {
          this.recentLogs = res.logs.slice(0, 5);
        }
      },
      error: () => {},
    });
  }

  handleRefresh(event: any) {
    this.loadDashboardData(event);
  }

  onPrimaryDutyAction() {
    if (this.stats.is_clocked_in) {
      this.openClockOutModal();
    } else {
      this.openClockInModal();
    }
  }

  openClockInModal() {
    this.showClockInModal = true;
    this.selfiePreview = null;

    // Use cached location immediately if available, otherwise show company workplace name
    if (this.nativeService.hasCachedLocation) {
      this.locationName = this.nativeService.lastKnownLocationName!;
      this.currentCoords = this.nativeService.lastKnownCoords;
      this.isGettingLocation = false;
    } else {
      this.locationName = this.currentUser?.company_name || 'Assigned Duty Workplace';
      this.isGettingLocation = true;
    }

    // Resolve accurate GPS in background without freezing UI
    this.nativeService.getCurrentPosition().then(async (pos) => {
      this.currentCoords = {
        latitude: pos.latitude,
        longitude: pos.longitude,
      };

      const readablePlace = await this.nativeService.reverseGeocode(pos.latitude, pos.longitude);
      if (readablePlace) {
        this.locationName = readablePlace;
      }
      this.isGettingLocation = false;
    }).catch(() => {
      this.isGettingLocation = false;
    });
  }

  closeClockInModal() {
    this.showClockInModal = false;
  }

  async captureSelfieProof() {
    const photo = await this.nativeService.takeAttendanceSelfie();
    if (photo) {
      this.selfiePreview = photo;
      this.nativeService.triggerHapticFeedback('medium');
    }
  }

  submitClockIn() {
    if (!this.currentUser) return;
    this.isSubmittingClockIn = true;

    const payload = {
      user_id: this.currentUser.id,
      latitude: this.currentCoords?.latitude ?? 16.4124,
      longitude: this.currentCoords?.longitude ?? 120.5933,
      location_name: this.locationName || this.currentUser.company_name || 'Assigned Duty Workplace',
      photo_base64: this.selfiePreview,
    };

    this.attendanceService.clockIn(payload).subscribe({
      next: (res) => {
        this.isSubmittingClockIn = false;
        this.showClockInModal = false;
        if (res.success) {
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback('Successfully Clocked In! Duty is now ongoing.', 'success');
          this.loadDashboardData();
        } else {
          this.showFeedback(res.message || 'Could not record clock in.', 'error');
        }
      },
      error: (err) => {
        this.isSubmittingClockIn = false;
        const msg = err?.error?.message || 'Unable to connect to server. Please try again.';
        this.showFeedback(msg, 'error');
      },
    });
  }

  openClockOutModal() {
    this.activityNotes = '';
    this.showClockOutModal = true;
  }

  closeClockOutModal() {
    this.showClockOutModal = false;
  }

  submitClockOut() {
    if (!this.currentUser) return;
    if (!this.activityNotes.trim()) {
      this.showFeedback('Please write a brief summary of accomplishments before clocking out.', 'error');
      return;
    }

    this.isSubmittingClockOut = true;

    this.attendanceService
      .clockOut({
        user_id: this.currentUser.id,
        activity_notes: this.activityNotes.trim(),
      })
      .subscribe({
        next: async (res) => {
          this.isSubmittingClockOut = false;
          this.showClockOutModal = false;
          if (res.success) {
            await this.nativeService.triggerHapticFeedback('success');
            const hours = res.rendered_today ? ` (${res.rendered_today} hrs rendered)` : '';
            this.showFeedback(`Clocked Out Successfully!${hours}`, 'success');
            this.loadDashboardData();
          } else {
            this.showFeedback(res.message || 'Could not record clock out.', 'error');
          }
        },
        error: () => {
          this.isSubmittingClockOut = false;
          this.showFeedback('Unable to connect to server. Please try again.', 'error');
        },
      });
  }

  openEditGoalModal() {
    this.editRequiredHours = this.stats.required_hours || 500;
    this.editTargetDate = this.currentUser?.target_date || '2026-12-15';
    this.showEditGoalModal = true;
  }

  closeEditGoalModal() {
    this.showEditGoalModal = false;
  }

  saveGoalSettings() {
    if (this.currentUser) {
      this.currentUser.required_hours = Number(this.editRequiredHours) || 500;
      this.currentUser.target_date = this.editTargetDate;
      this.stats.required_hours = this.currentUser.required_hours;
      this.stats.remaining_hours = Math.max(0, this.stats.required_hours - this.stats.accumulated_hours);
      this.stats.completion_percent = Number(
        ((this.stats.accumulated_hours / this.stats.required_hours) * 100).toFixed(1)
      );
    }
    this.showEditGoalModal = false;
    this.showFeedback('Goal targets updated successfully.', 'success');
  }

  openProfileModal() {
    this.openSideMenu();
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  openSideMenu() {
    this.isSideMenuOpen = true;
  }

  closeSideMenu() {
    this.isSideMenuOpen = false;
  }

  selectMenuItem(item: string) {
    this.activeMenu = item;
    this.closeSideMenu();

    if (item === 'profile') {
      this.router.navigate(['/profile']);
    } else if (item === 'tasks') {
      this.router.navigate(['/tasks']);
    } else if (item === 'timelogs') {
      this.router.navigate(['/timelogs']);
    } else if (item === 'reports') {
      this.router.navigate(['/reports']);
    }
  }

  goToTasks() {
    this.router.navigate(['/tasks']);
  }

  goToTimeLogs() {
    this.router.navigate(['/timelogs']);
  }

  logout() {
    this.closeSideMenu();
    this.showProfileModal = false;
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

  formatTime(timeStr?: string | null): string {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  }

  showFeedback(msg: string, type: 'success' | 'error') {
    this.feedbackMessage = msg;
    this.feedbackType = type;
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 4000);
  }
}
