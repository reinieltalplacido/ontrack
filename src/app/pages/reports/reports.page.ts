import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonModal,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  analyticsOutline,
  documentTextOutline,
  searchOutline,
  filterOutline,
  calendarOutline,
  businessOutline,
  personOutline,
  downloadOutline,
  printOutline,
  checkmarkCircleOutline,
  closeOutline,
  menuOutline,
  gridOutline,
  checkboxOutline,
  copyOutline,
  logOutOutline,
  shareOutline,
  eyeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { TaskService } from '../../core/services/task.service';
import { NativeService } from '../../core/services/native.service';
import { User } from '../../models/user.model';
import { AttendanceLog, DashboardStats } from '../../models/attendance.model';
import { TaskItem } from '../../models/task.model';

export interface GeneratedReport {
  id: string;
  title: string;
  type: 'Time Log' | 'Summary';
  date: string;
  status: 'Ready' | 'Submitted';
  details?: any;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonModal,
  ],
})
export class ReportsPage implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private taskService = inject(TaskService);
  private nativeService = inject(NativeService);
  private router = inject(Router);

  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  logs: AttendanceLog[] = [];
  tasks: TaskItem[] = [];

  // My Reports list & filter
  reports: GeneratedReport[] = [];
  filteredReports: GeneratedReport[] = [];
  typeFilter = 'all';
  sortOrder = 'newest';
  searchQuery = '';

  // Report Preview Modal
  showPreviewModal = false;
  activeReportType: 'Time Log' | 'Summary' = 'Time Log';
  isGenerating = false;

  // Side Drawer
  isSideMenuOpen = false;
  activeMenu = 'reports';

  // Feedback Toast
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor() {
    addIcons({
      timeOutline,
      analyticsOutline,
      documentTextOutline,
      searchOutline,
      filterOutline,
      calendarOutline,
      businessOutline,
      personOutline,
      downloadOutline,
      printOutline,
      checkmarkCircleOutline,
      closeOutline,
      menuOutline,
      gridOutline,
      checkboxOutline,
      copyOutline,
      logOutOutline,
      shareOutline,
      eyeOutline,
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
        course_section: 'BSIT',
        company_name: 'Project Solo',
        adviser_name: 'Sir gel',
        start_date: '2027-02-03',
        target_date: '2027-05-19',
        required_hours: 500,
      };
    }

    this.loadData();
  }

  loadData() {
    if (!this.currentUser) return;
    const uid = this.currentUser.id;

    // Load stats
    this.attendanceService.getDashboardStats(uid).subscribe({
      next: (s) => (this.stats = s),
    });

    // Load logs
    this.attendanceService.getAttendanceHistory(uid).subscribe({
      next: (res) => {
        if (res && res.logs) this.logs = res.logs;
      },
    });

    // Load tasks
    this.taskService.getTasks(uid).subscribe({
      next: (t) => (this.tasks = t),
    });
  }

  generateReport(type: 'Time Log' | 'Summary') {
    this.isGenerating = true;
    this.activeReportType = type;

    setTimeout(() => {
      this.isGenerating = false;
      this.showPreviewModal = true;
      this.nativeService.triggerHapticFeedback('success');

      // Add to My Reports history
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const newReport: GeneratedReport = {
        id: 'rep_' + Date.now(),
        title: type === 'Time Log' ? `DTR Time Log (${dateStr})` : `OJT Progress Summary (${dateStr})`,
        type: type,
        date: dateStr,
        status: 'Ready',
      };

      // Avoid duplicates with same title today
      if (!this.reports.some((r) => r.title === newReport.title)) {
        this.reports.unshift(newReport);
        this.applyFilters();
      }

      this.showFeedback(`${type} Report generated successfully!`, 'success');
    }, 400);
  }

  closePreviewModal() {
    this.showPreviewModal = false;
  }

  printReport() {
    window.print();
  }

  applyFilters() {
    let list = [...this.reports];

    if (this.typeFilter !== 'all') {
      list = list.filter((r) => r.type === this.typeFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (this.sortOrder === 'newest') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }

    this.filteredReports = list;
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
    } else if (item === 'profile') {
      this.router.navigate(['/profile']);
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
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
