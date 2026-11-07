import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  IonSpinner,
  IonCard,
  IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  calendarOutline,
  locationOutline,
  cameraOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  documentTextOutline,
  searchOutline,
  filterOutline,
  menuOutline,
  closeOutline,
  gridOutline,
  checkboxOutline,
  copyOutline,
  personOutline,
  logOutOutline,
  chevronForwardOutline,
  arrowDownOutline,
  arrowBackOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AttendanceService } from '../../core/services/attendance.service';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceLog } from '../../models/attendance.model';
import { User } from '../../models/user.model';
import { formatHours, formatTime } from '../../core/utils/format.util';

@Component({
  selector: 'app-timelogs',
  templateUrl: './timelogs.page.html',
  styleUrls: ['./timelogs.page.scss'],
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
    IonSpinner,
    IonCard,
    IonBadge,
  ],
})
export class TimeLogsPage implements OnInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  logs: AttendanceLog[] = [];
  filteredLogs: AttendanceLog[] = [];
  isLoading = true;

  totalRenderedHours = 0;
  totalLogsCount = 0;
  formatHours = formatHours;

  // Filter
  statusFilter = 'all';
  searchQuery = '';

  // Side Drawer
  isSideMenuOpen = false;
  activeMenu = 'timelogs';

  constructor() {
    addIcons({
      timeOutline,
      calendarOutline,
      locationOutline,
      cameraOutline,
      checkmarkCircleOutline,
      hourglassOutline,
      documentTextOutline,
      searchOutline,
      filterOutline,
      menuOutline,
      closeOutline,
      gridOutline,
      checkboxOutline,
      copyOutline,
      personOutline,
      logOutOutline,
      chevronForwardOutline,
      arrowDownOutline,
      arrowBackOutline,
      shieldCheckmarkOutline,
    });
  }

  ionViewWillEnter() {
    this.activeMenu = 'timelogs';
    this.isSideMenuOpen = false;
    this.currentUser = this.authService.currentUserValue || this.currentUser;
    this.loadCachedLogs();
    this.loadLogs();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.currentUser = {
        id: 1,
        student_id: 'SUM2023-00980',
        full_name: 'Reiniel Talplacido',
        email: 'reiniel@student.neust.edu.ph',
        company_name: 'Project SOLO',
        required_hours: 500,
      };
    }
    this.loadCachedLogs();
  }

  private loadCachedLogs() {
    try {
      const cached = localStorage.getItem('ontrack_cached_timelogs');
      if (cached) {
        const data = JSON.parse(cached);
        if (data && Array.isArray(data.logs) && data.logs.length > 0) {
          this.logs = data.logs;
          this.totalRenderedHours = data.total_hours || 0;
          this.totalLogsCount = this.logs.length;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }
    } catch {
      // Ignore cache parse error
    }
  }

  loadLogs(event?: any) {
    if (!this.currentUser) {
      if (event) event.target.complete();
      return;
    }

    // Only show full loading spinner if no logs exist yet
    if (this.logs.length === 0) {
      this.isLoading = true;
      this.cdr.detectChanges();
    }

    this.attendanceService.getAttendanceHistory(this.currentUser.id).subscribe({
      next: (res) => {
        if (res && res.logs) {
          this.logs = this.consolidateLogsByDate(res.logs);
          this.totalRenderedHours = res.total_hours || 0;
          this.totalLogsCount = this.logs.length;
          this.applyFilters();

          try {
            localStorage.setItem('ontrack_cached_timelogs', JSON.stringify({
              logs: this.logs,
              total_hours: this.totalRenderedHours,
            }));
          } catch {
            // Storage quota safe
          }
        }
        this.isLoading = false;
        if (event) event.target.complete();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        if (event) event.target.complete();
        this.cdr.detectChanges();
      },
    });
  }

  consolidateLogsByDate(logs: AttendanceLog[]): AttendanceLog[] {
    const map = new Map<string, AttendanceLog>();
    for (const log of logs) {
      const d = log.log_date;
      if (!map.has(d)) {
        map.set(d, { ...log, total_hours: Number(log.total_hours) || 0 });
      } else {
        const existing = map.get(d)!;
        existing.total_hours = Math.round(((Number(existing.total_hours) || 0) + (Number(log.total_hours) || 0)) * 100) / 100;
        if (log.time_in && (!existing.time_in || log.time_in < existing.time_in)) {
          existing.time_in = log.time_in;
        }
        if (log.status === 'ongoing' || existing.status === 'ongoing') {
          existing.status = 'ongoing';
          existing.time_out = null as any;
        } else if (log.time_out && (!existing.time_out || log.time_out > existing.time_out)) {
          existing.time_out = log.time_out;
        }
        const notes = log.activity_notes?.trim();
        if (notes && notes !== 'Duty shift completed') {
          if (!existing.activity_notes || existing.activity_notes === 'Duty shift completed') {
            existing.activity_notes = notes;
          } else if (!existing.activity_notes.includes(notes)) {
            existing.activity_notes += ' | ' + notes;
          }
        }
      }
    }
    return Array.from(map.values());
  }

  handleRefresh(event: any) {
    this.loadLogs(event);
  }

  applyFilters() {
    let result = [...this.logs];

    if (this.statusFilter !== 'all') {
      result = result.filter((l) => l.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          (l.activity_notes && l.activity_notes.toLowerCase().includes(q)) ||
          (l.location_name && l.location_name.toLowerCase().includes(q)) ||
          l.log_date.includes(q)
      );
    }

    this.filteredLogs = result;
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
    } else if (item === 'profile') {
      this.router.navigate(['/profile']);
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
    return formatTime(timeStr);
  }
}

