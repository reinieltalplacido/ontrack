import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonTextarea,
  IonInput,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
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
  radioButtonOnOutline,
  timerOutline,
  calendarClearOutline,
  shieldCheckmarkOutline,
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
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonTextarea,
    IonInput,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private nativeService = inject(NativeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Realtime Clock State
  currentTimeString = '';
  currentDateString = '';
  private clockInterval?: any;

  quickNotes = [
    'Routine daily tasks',
    'System development & testing',
    'Documentation & reporting',
    'Meeting & task alignment',
  ];

  selectQuickNote(note: string) {
    this.activityNotes = note;
  }

  currentUser: User | null = null;
  stats: DashboardStats = {
    accumulated_hours: 0,
    required_hours: 486,
    remaining_hours: 486,
    completion_percent: 0,
    days_remaining: 40,
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

  // Time In modal state
  showClockInModal = false;
  isGettingLocation = false;
  currentCoords: { latitude: number; longitude: number } | null = null;
  locationName = 'Office / Duty Workplace';
  isSubmittingClockIn = false;

  // Time Out modal state
  showClockOutModal = false;
  activityNotes = '';
  isSubmittingClockOut = false;

  // Edit Goal modal state
  showEditGoalModal = false;
  editRequiredHours = 486;
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
      radioButtonOnOutline,
      timerOutline,
      calendarClearOutline,
  shieldCheckmarkOutline,
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.currentUser = {
        id: 1,
        student_id: '2026-0001',
        full_name: 'Juan Dela Cruz',
        email: 'juan@student.neust.edu.ph',
        course_section: 'BSIT 4-A',
        school_campus: 'NEUST - Sumacab Campus',
        company_name: 'Innovate Tech Solutions Inc.',
        adviser_name: 'Engr. Roberto Gomez',
        required_hours: 486,
        target_date: '2026-12-15',
      };
    }

    this.editRequiredHours = this.currentUser.required_hours || 486;
    this.editTargetDate = this.currentUser.target_date || '2026-12-15';

    // Start Live Realtime Clock
    this.updateRealtimeClock();
    this.clockInterval = setInterval(() => {
      this.updateRealtimeClock();
      this.cdr.detectChanges();
    }, 1000);

    this.loadDashboardData();
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateRealtimeClock() {
    const now = new Date();
    this.currentTimeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    this.currentDateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
    this.updateRealtimeClock();

    if (this.nativeService.hasCachedLocation) {
      this.locationName = this.nativeService.lastKnownLocationName!;
      this.currentCoords = this.nativeService.lastKnownCoords;
      this.isGettingLocation = false;
    } else {
      this.locationName = this.currentUser?.company_name || 'Assigned Duty Workplace';
      this.isGettingLocation = true;
    }

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
      this.cdr.detectChanges();
    }).catch(() => {
      this.isGettingLocation = false;
      this.cdr.detectChanges();
    });
  }

  refreshLocation() {
    this.isGettingLocation = true;
    this.cdr.detectChanges();

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
      this.nativeService.triggerHapticFeedback('medium');
      this.cdr.detectChanges();
    }).catch(() => {
      this.isGettingLocation = false;
      this.cdr.detectChanges();
    });
  }

  closeClockInModal() {
    this.showClockInModal = false;
  }

  submitClockIn() {
    if (!this.currentUser) return;
    this.isSubmittingClockIn = true;

    const payload = {
      user_id: this.currentUser.id,
      latitude: this.currentCoords?.latitude ?? 15.4859,
      longitude: this.currentCoords?.longitude ?? 120.9678,
      location_name: this.locationName || this.currentUser.company_name || 'Assigned Duty Workplace',
      photo_base64: null,
    };

    this.attendanceService.clockIn(payload).subscribe({
      next: (res) => {
        this.isSubmittingClockIn = false;
        this.showClockInModal = false;
        if (res.success) {
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback('Time-In Recorded Successfully! Duty session active.', 'success');
          this.loadDashboardData();
        } else {
          this.showFeedback(res.message || 'Could not record time in.', 'error');
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
    const notesToSubmit = this.activityNotes.trim() || 'Duty shift completed';

    this.isSubmittingClockOut = true;
    this.cdr.detectChanges();

    this.attendanceService
      .clockOut({
        user_id: this.currentUser.id,
        activity_notes: notesToSubmit,
      })
      .subscribe({
        next: (res) => {
          this.isSubmittingClockOut = false;
          this.showClockOutModal = false;
          this.cdr.detectChanges();

          if (res.success) {
            this.nativeService.triggerHapticFeedback('success');
            const hours = res.rendered_today ? ` (${res.rendered_today} hrs rendered)` : '';
            this.showFeedback(`Time-Out Recorded Successfully!${hours}`, 'success');
            this.loadDashboardData();
          } else {
            this.showFeedback(res.message || 'Could not record time out.', 'error');
          }
        },
        error: (err) => {
          this.isSubmittingClockOut = false;
          this.cdr.detectChanges();
          const msg = err?.error?.message || 'Unable to connect to server. Please try again.';
          this.showFeedback(msg, 'error');
        },
      });
  }

  openEditGoalModal() {
    this.editRequiredHours = this.stats.required_hours || 486;
    this.editTargetDate = this.currentUser?.target_date || '2026-12-15';
    this.showEditGoalModal = true;
  }

  closeEditGoalModal() {
    this.showEditGoalModal = false;
  }

  saveGoalSettings() {
    if (this.currentUser) {
      this.currentUser.required_hours = Number(this.editRequiredHours) || 486;
      this.currentUser.target_date = this.editTargetDate;
      this.stats.required_hours = this.currentUser.required_hours;
      this.stats.remaining_hours = Math.max(0, this.stats.required_hours - this.stats.accumulated_hours);
      this.stats.completion_percent = Number(
        ((this.stats.accumulated_hours / this.stats.required_hours) * 100).toFixed(1)
      );
    }
    this.showEditGoalModal = false;
    this.showFeedback('Target requirements updated successfully.', 'success');
  }

  openProfileModal() {
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  goToTasks() {
    this.router.navigate(['/tasks']);
  }

  goToTimeLogs() {
    this.router.navigate(['/timelogs']);
  }

  goToReports() {
    this.router.navigate(['/reports']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
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
    if (item === 'profile') this.goToProfile();
    else if (item === 'tasks') this.goToTasks();
    else if (item === 'timelogs') this.goToTimeLogs();
    else if (item === 'reports') this.goToReports();
    else if (item === 'admin') this.router.navigate(['/admin/dashboard']);
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
