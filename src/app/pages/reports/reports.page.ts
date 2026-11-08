import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonModal,
  IonCard,
  IonSpinner,
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
  arrowBackOutline,
  shieldCheckmarkOutline,
  sendOutline,
  checkmarkDoneOutline,
  cloudUploadOutline,
  attachOutline,
  documentAttachOutline,
  trashOutline,
  imageOutline,
  paperPlaneOutline,
  openOutline,
  cloudDoneOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { TaskService } from '../../core/services/task.service';
import { ReportService, SubmittedReportItem } from '../../core/services/report.service';
import { NativeService } from '../../core/services/native.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../models/user.model';
import { AttendanceLog, DashboardStats } from '../../models/attendance.model';
import { TaskItem } from '../../models/task.model';
import { formatHours, formatTime, formatShiftTime } from '../../core/utils/format.util';
import { environment } from '../../../environments/environment';

export interface GeneratedReport {
  id: string;
  dbId?: number;
  title: string;
  type: string;
  date: string;
  status: 'Ready' | 'Submitted' | 'Reviewed' | 'Approved';
  totalHours?: number;
  totalDays?: number;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  details?: any;
}

export interface ReportWeekOption {
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  logsCount: number;
  totalHours: number;
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
    IonCard,
    IonSpinner,
  ],
})
export class ReportsPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private taskService = inject(TaskService);
  private reportService = inject(ReportService);
  private nativeService = inject(NativeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  logs: AttendanceLog[] = [];
  tasks: TaskItem[] = [];
  formatHours = formatHours;

  // My Reports list & filter
  reports: GeneratedReport[] = [];
  filteredReports: GeneratedReport[] = [];
  typeFilter = 'all';
  sortOrder = 'newest';
  searchQuery = '';

  // Separated Reports State (Submitted vs Generated)
  reportTableMode: 'all' | 'submitted' | 'generated' = 'all';
  submittedReports: GeneratedReport[] = [];
  filteredSubmittedReports: GeneratedReport[] = [];
  generatedReports: GeneratedReport[] = [];
  filteredGeneratedReports: GeneratedReport[] = [];

  // Weekly Reporting
  availableWeeks: ReportWeekOption[] = [];
  selectedWeekKey: string = 'current';
  selectedWeekOption: ReportWeekOption | null = null;

  // Active Report Document State
  activeReportTitle = '';
  activeReportCoverage = '';
  activeReportLogs: AttendanceLog[] = [];
  activeReportTotalHours = 0;
  activeReportTotalDays = 0;
  activeReportFileUrl?: string;
  activeReportFileName?: string;
  activeReportNotes?: string;

  // Report Preview Modal
  showPreviewModal = false;
  activeReportType: 'Time Log' | 'Summary' = 'Time Log';
  activeReportStatus: 'Ready' | 'Submitted' | 'Reviewed' | 'Approved' = 'Ready';
  activeReportId?: number;
  isGenerating = false;
  isSubmittingToAdviser = false;

  // Submit Report Modal State (Unlimited Submissions: Generated Report or Uploaded File)
  showSubmitModal = false;
  submitSource: 'generated' | 'file' = 'generated';
  submitSelectedReportType = 'Time Log';
  submitReportTitle = 'Daily Time Record (DTR)';
  submitReportPeriod = 'Complete Training Period';
  submitReportNotes = '';
  submitFileName = '';
  submitFileData = '';
  submitFileSize = '';
  isSubmittingReport = false;

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
      arrowBackOutline,
      shieldCheckmarkOutline,
      sendOutline,
      checkmarkDoneOutline,
      cloudUploadOutline,
      attachOutline,
      documentAttachOutline,
      trashOutline,
      imageOutline,
      paperPlaneOutline,
      openOutline,
      cloudDoneOutline,
    });
  }

  setTableMode(mode: 'all' | 'submitted' | 'generated') {
    this.reportTableMode = mode;
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  // Realtime Sync Handlers
  private reportPollTimer: any = null;
  private storageEventListener = (event: StorageEvent) => {
    if (event.key === 'ontrack_report_updated') {
      this.loadStudentReports();
    }
  };
  private visibilityListener = () => {
    if (document.visibilityState === 'visible') {
      this.loadStudentReports();
    }
  };

  startRealtimeSync() {
    this.stopRealtimeSync();

    // Instant cross-tab sync via storage events
    window.addEventListener('storage', this.storageEventListener);

    // Instant sync when switching back into the app/browser tab
    document.addEventListener('visibilitychange', this.visibilityListener);

    // 4-second polling for live cross-device / APK updates without restarting
    this.reportPollTimer = setInterval(() => {
      this.loadStudentReports();
    }, 4000);
  }

  stopRealtimeSync() {
    if (this.reportPollTimer) {
      clearInterval(this.reportPollTimer);
      this.reportPollTimer = null;
    }
    window.removeEventListener('storage', this.storageEventListener);
    document.removeEventListener('visibilitychange', this.visibilityListener);
  }

  ionViewWillEnter() {
    this.activeMenu = 'reports';
    this.isSideMenuOpen = false;
    this.currentUser = this.authService.currentUserValue || this.currentUser;
    this.loadData();
    this.startRealtimeSync();
    this.cdr.detectChanges();
  }

  ionViewWillLeave() {
    this.stopRealtimeSync();
  }

  ngOnDestroy() {
    this.stopRealtimeSync();
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
      next: (s) => {
        this.stats = s;
        this.cdr.detectChanges();
      },
    });

    // Load logs
    this.attendanceService.getAttendanceHistory(uid).subscribe({
      next: (res) => {
        if (res && res.logs) {
          this.logs = this.consolidateLogsByDate(res.logs);
          this.buildAvailableWeeks();
          this.loadGeneratedReports();
        }
        this.cdr.detectChanges();
      },
    });

    // Load tasks
    this.taskService.getTasks(uid).subscribe({
      next: (t) => {
        this.tasks = t;
        this.cdr.detectChanges();
      },
    });

    // Load submitted reports
    this.loadStudentReports();
  }

  loadGeneratedReports() {
    if (!this.currentUser?.id) return;
    try {
      const stored = localStorage.getItem('ontrack_generated_reports_' + this.currentUser.id);
      if (stored) {
        this.generatedReports = JSON.parse(stored);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        this.generatedReports = [
          {
            id: 'gen_dtr_cumulative',
            title: `Cumulative DTR Time Log (${todayStr})`,
            type: 'Time Log',
            date: todayStr,
            status: 'Ready',
            totalHours: this.stats?.accumulated_hours ? parseFloat(String(this.stats.accumulated_hours)) : 0,
            totalDays: this.logs.length,
            details: {
              coverage: 'All Weeks Cumulative',
              logs: this.logs,
            },
          },
          {
            id: 'gen_summary_cumulative',
            title: `Cumulative OJT Progress Summary (${todayStr})`,
            type: 'Summary',
            date: todayStr,
            status: 'Ready',
            totalHours: this.stats?.accumulated_hours ? parseFloat(String(this.stats.accumulated_hours)) : 0,
            totalDays: this.logs.length,
            details: {
              coverage: 'All Weeks Cumulative',
              logs: this.logs,
              tasks: this.tasks,
            },
          },
        ];
        this.saveGeneratedReports();
      }
    } catch (e) {
      this.generatedReports = [];
    }
    this.reports = [...this.submittedReports, ...this.generatedReports];
    this.applyFilters();
  }

  saveGeneratedReports() {
    if (!this.currentUser?.id) return;
    try {
      localStorage.setItem('ontrack_generated_reports_' + this.currentUser.id, JSON.stringify(this.generatedReports));
    } catch (e) {}
  }

  deleteGeneratedReport(rep: GeneratedReport, event?: Event) {
    if (event) event.stopPropagation();
    this.generatedReports = this.generatedReports.filter((r) => r.id !== rep.id);
    this.saveGeneratedReports();
    this.applyFilters();
    this.toastService.showInfo('Generated report draft removed.');
    this.nativeService.triggerHapticFeedback('light');
  }

  loadStudentReports() {
    if (!this.currentUser) return;
    this.reportService.getStudentReports(this.currentUser.id).subscribe({
      next: (res) => {
        if (res && res.success && res.reports) {
          const dbReports: GeneratedReport[] = res.reports.map((r) => {
            let st: 'Ready' | 'Submitted' | 'Reviewed' | 'Approved' = 'Submitted';
            if (r.status === 'approved') st = 'Approved';
            else if (r.status === 'reviewed') st = 'Reviewed';
            else if (r.status === 'submitted') st = 'Submitted';

            return {
              id: 'rep_db_' + r.id,
              dbId: r.id,
              title: r.report_title,
              type: r.report_type,
              date: r.report_date,
              status: st,
              fileUrl: r.file_url || undefined,
              fileName: r.file_name || undefined,
              notes: r.notes || undefined,
              details: r,
            };
          });

          this.submittedReports = dbReports;
          this.reports = [...this.submittedReports, ...this.generatedReports];

          // If the preview modal is currently open, dynamically sync activeReportStatus in real-time!
          // Strictly match by dbId or exact title so a newly generated report NEVER gets auto-marked as submitted!
          if (this.showPreviewModal) {
            const activeMatch = this.reports.find(
              (r) =>
                (this.activeReportId && r.dbId === this.activeReportId) ||
                (this.activeReportTitle && r.title === this.activeReportTitle)
            );
            if (activeMatch) {
              if (activeMatch.status !== this.activeReportStatus) {
                const prev = this.activeReportStatus;
                this.activeReportStatus = activeMatch.status;
                this.activeReportId = activeMatch.dbId;
                if (activeMatch.status === 'Approved' && prev !== 'Approved') {
                  this.toastService.showSuccess('Great news! Your report has been approved by your adviser!');
                  this.nativeService.triggerHapticFeedback('success');
                }
              }
            } else if (!this.activeReportId) {
              // Not submitted yet — preserve Ready status
              this.activeReportStatus = 'Ready';
            }
          }

          this.applyFilters();
        }
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

  buildAvailableWeeks() {
    const mondayMap = new Map<string, AttendanceLog[]>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Also ensure current week exists even before shift records are logged
    const now = new Date();
    const curDay = now.getDay();
    const curDiff = curDay === 0 ? -6 : 1 - curDay;
    const curMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + curDiff);
    const curMonStr = `${curMonday.getFullYear()}-${String(curMonday.getMonth() + 1).padStart(2, '0')}-${String(curMonday.getDate()).padStart(2, '0')}`;
    mondayMap.set(curMonStr, []);

    // Group logs by their week's Monday
    for (const log of this.logs) {
      if (!log.log_date) continue;
      const parts = log.log_date.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      const day = dateObj.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(y, m, d + diff);

      const mStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      if (!mondayMap.has(mStr)) {
        mondayMap.set(mStr, []);
      }
      mondayMap.get(mStr)!.push(log);
    }

    // Sort weeks in ascending order to assign Week 1, Week 2, Week 3...
    const sortedMonStrs = Array.from(mondayMap.keys()).sort((a, b) => a.localeCompare(b));
    const weeks: ReportWeekOption[] = sortedMonStrs.map((mStr, idx) => {
      const parts = mStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const monday = new Date(y, m, d);
      const sunday = new Date(y, m, d + 6);

      const eMonStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
      const sMonth = months[monday.getMonth()] || 'Jan';
      const eMonth = months[sunday.getMonth()] || 'Jan';
      const year = String(monday.getFullYear());

      const rangeText = sMonth === eMonth
        ? `${sMonth} ${monday.getDate()} - ${sunday.getDate()}, ${year}`
        : `${sMonth} ${monday.getDate()} - ${eMonth} ${sunday.getDate()}, ${year}`;

      const logsInWeek = mondayMap.get(mStr) || [];
      const totalHours = Math.round(logsInWeek.reduce((sum, l) => sum + (Number(l.total_hours) || 0), 0) * 100) / 100;

      return {
        weekNumber: idx + 1,
        label: `Week ${idx + 1} (${rangeText})`,
        startDate: mStr,
        endDate: eMonStr,
        isCurrent: mStr === curMonStr,
        logsCount: logsInWeek.length,
        totalHours,
      };
    });

    // Present newest week first in dropdown
    this.availableWeeks = [...weeks].reverse();
    if (this.availableWeeks.length > 0) {
      this.selectedWeekKey = this.availableWeeks[0].startDate;
      this.selectedWeekOption = this.availableWeeks[0];
    }
  }

  onWeekSelected() {
    if (this.selectedWeekKey === 'all') {
      this.selectedWeekOption = null;
    } else {
      this.selectedWeekOption = this.availableWeeks.find((w) => w.startDate === this.selectedWeekKey) || null;
    }
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  get selectedWeekLabel(): string {
    if (!this.selectedWeekOption) return 'All Weeks (Cumulative)';
    return this.selectedWeekOption.label;
  }

  generateReport(type: 'Time Log' | 'Summary') {
    this.isGenerating = true;
    this.activeReportType = type;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.isGenerating = false;
      this.showPreviewModal = false; // Do not popup modal on generate - keep on page
      this.nativeService.triggerHapticFeedback('success');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      let weekLogs: AttendanceLog[] = [];
      let totalHrs = 0;
      let totalDays = 0;
      let title = '';

      if (this.selectedWeekOption) {
        const opt = this.selectedWeekOption;
        weekLogs = this.logs.filter(
          (l) => l.log_date >= opt.startDate && l.log_date <= opt.endDate
        );
        totalHrs = opt.totalHours;
        totalDays = weekLogs.length;
        this.activeReportCoverage = opt.label;
        title = type === 'Time Log'
          ? `Week ${opt.weekNumber} DTR Time Log (${opt.startDate} to ${opt.endDate} • ${timeStr})`
          : `Week ${opt.weekNumber} OJT Progress Summary (${opt.startDate} to ${opt.endDate} • ${timeStr})`;
      } else {
        weekLogs = [...this.logs];
        totalHrs = this.stats?.accumulated_hours ? parseFloat(String(this.stats.accumulated_hours)) : 0;
        totalDays = weekLogs.length;
        this.activeReportCoverage = 'All Weeks Cumulative';
        title = type === 'Time Log'
          ? `Cumulative DTR Time Log (${dateStr} • ${timeStr})`
          : `Cumulative OJT Progress Summary (${dateStr} • ${timeStr})`;
      }

      this.activeReportTitle = title;
      this.activeReportLogs = weekLogs;
      this.activeReportTotalHours = totalHrs;
      this.activeReportTotalDays = totalDays;
      this.activeReportStatus = 'Ready';
      this.activeReportId = undefined;

      const newGenItem: GeneratedReport = {
        id: 'gen_' + Date.now(),
        title: title,
        type: type,
        date: dateStr,
        status: 'Ready',
        totalHours: totalHrs,
        totalDays: totalDays,
        details: {
          coverage: this.activeReportCoverage,
          totalHours: totalHrs,
          totalDays: totalDays,
          logs: weekLogs,
        },
      };

      // Always prepend new generated report to the list
      this.generatedReports.unshift(newGenItem);
      this.saveGeneratedReports();
      this.applyFilters();

      this.toastService.showSuccess(`Generated ${type}! Added to Generated Reports.`);
      this.showFeedback(`${title} generated and added below!`, 'success');
      if (this.reportTableMode === 'submitted') {
        this.reportTableMode = 'all';
      }
      setTimeout(() => {
        const genCard = document.querySelector('.generated-reports-card');
        if (genCard) {
          genCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      this.cdr.detectChanges();
    }, 350);
  }

  openReport(rep: GeneratedReport) {
    this.activeReportType = (rep.type as any) || 'Time Log';
    this.activeReportTitle = rep.title;
    this.activeReportStatus = rep.status;
    this.activeReportId = rep.dbId;
    this.activeReportFileUrl = rep.fileUrl || rep.details?.file_url;
    this.activeReportFileName = rep.fileName || rep.details?.file_name;
    this.activeReportNotes = rep.notes || rep.details?.notes;

    if (rep.details?.report_data) {
      let data = rep.details.report_data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch {}
      }
      if (data && data.logs) {
        this.activeReportLogs = data.logs;
      } else {
        this.activeReportLogs = [...this.logs];
      }
      this.activeReportTotalHours = rep.details.total_hours || (data?.total_hours || 0);
      this.activeReportTotalDays = rep.details.total_days || this.activeReportLogs.length;
      this.activeReportCoverage = data?.coverage || rep.title;
    } else {
      this.activeReportLogs = [...this.logs];
      this.activeReportTotalHours = this.stats?.accumulated_hours ? parseFloat(String(this.stats.accumulated_hours)) : 0;
      this.activeReportTotalDays = this.activeReportLogs.length;
    }

    this.showPreviewModal = true;
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  submitReportToAdviser() {
    if (!this.currentUser || this.isSubmittingToAdviser) return;
    this.isSubmittingToAdviser = true;
    this.nativeService.triggerHapticFeedback('medium');

    const cleanLogs = (this.activeReportLogs || []).map((l) => ({
      id: l.id,
      log_date: l.log_date,
      time_in: l.time_in,
      time_out: l.time_out,
      total_hours: Number(l.total_hours) || 0,
      activity_notes: l.activity_notes || '',
      status: l.status || 'completed',
    }));

    const cleanTasks = (this.tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      deadline: t.deadline || '',
      priority: t.priority || 'medium',
      status: t.status || 'pending',
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const payload = {
      report_id: this.activeReportId,
      user_id: this.currentUser.id,
      report_title: this.activeReportTitle,
      report_type: this.activeReportType,
      report_date: dateStr,
      total_hours: this.activeReportTotalHours,
      total_days: this.activeReportTotalDays,
      report_data: {
        student: {
          id: this.currentUser.id,
          student_no: (this.currentUser as any).student_no || this.currentUser.student_id,
          full_name: this.currentUser.full_name,
          course_section: this.currentUser.course_section,
          company_name: this.currentUser.company_name,
          adviser_name: this.currentUser.adviser_name,
          required_hours: this.currentUser.required_hours,
        },
        stats: this.stats,
        logs: cleanLogs,
        tasks: cleanTasks,
        coverage: this.activeReportCoverage,
        submitted_at: new Date().toISOString(),
      },
    };

    this.reportService.submitReport(payload).subscribe({
      next: (res) => {
        this.isSubmittingToAdviser = false;
        if (res && res.success) {
          this.activeReportStatus = 'Submitted';
          if (res.report?.id) {
            this.activeReportId = res.report.id;
          }
          this.nativeService.triggerHapticFeedback('success');
          const adviserName = this.currentUser?.adviser_name || 'your academic coordinator';
          this.showFeedback(`Report "${this.activeReportTitle}" submitted to ${adviserName} successfully!`, 'success');
          try {
            localStorage.setItem('ontrack_report_updated', Date.now().toString());
          } catch (e) {}
          this.loadStudentReports();
        } else {
          this.nativeService.triggerHapticFeedback('warning');
          this.showFeedback(res?.message || 'Failed to submit report. Please try again.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmittingToAdviser = false;
        this.nativeService.triggerHapticFeedback('warning');
        this.showFeedback('Connection error submitting report. Please try again.', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  closePreviewModal() {
    this.showPreviewModal = false;
    this.cdr.detectChanges();
  }

  openSubmitModal() {
    this.submitSource = 'generated';
    this.submitSelectedReportType = 'Time Log';
    this.submitReportTitle = 'Daily Time Record (DTR)';
    this.submitReportPeriod = this.selectedWeekKey === 'all' || !this.selectedWeekOption 
      ? 'Complete Training Period' 
      : this.selectedWeekOption.label;
    this.submitReportNotes = '';
    this.submitFileName = '';
    this.submitFileData = '';
    this.submitFileSize = '';
    this.showSubmitModal = true;
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  closeSubmitModal() {
    this.showSubmitModal = false;
    this.cdr.detectChanges();
  }

  setSubmitSource(source: 'generated' | 'file') {
    this.submitSource = source;
    if (source === 'file' && (!this.submitReportTitle || this.submitReportTitle.includes('DTR'))) {
      this.submitReportTitle = 'OJT Document / Scanned DTR';
    } else if (source === 'generated' && (!this.submitReportTitle || this.submitReportTitle.includes('Document'))) {
      this.submitReportTitle = this.submitSelectedReportType === 'Summary' ? 'OJT Accomplishment Summary' : 'Daily Time Record (DTR)';
    }
    this.nativeService.triggerHapticFeedback('light');
    this.cdr.detectChanges();
  }

  onGeneratedTypeChange() {
    const genMatch = this.generatedReports.find((r) => r.title === this.submitSelectedReportType);
    if (genMatch) {
      this.submitReportTitle = genMatch.title;
      this.submitReportPeriod = genMatch.details?.coverage || 'Complete Training Period';
    } else if (this.submitSelectedReportType.startsWith('DTR - ')) {
      this.submitReportTitle = this.submitSelectedReportType;
      this.submitReportPeriod = this.submitSelectedReportType.replace('DTR - ', '');
    } else if (this.submitSelectedReportType === 'Summary') {
      this.submitReportTitle = 'OJT Accomplishment Summary';
      this.submitReportPeriod = 'Complete Training Period';
    } else {
      this.submitReportTitle = 'Daily Time Record (DTR)';
      this.submitReportPeriod = 'Complete Training Period';
    }
    this.cdr.detectChanges();
  }

  getSubmitHours(): number {
    const genMatch = this.generatedReports.find((r) => r.title === this.submitSelectedReportType);
    if (genMatch && genMatch.totalHours !== undefined) {
      return genMatch.totalHours;
    }
    if (this.submitSelectedReportType.startsWith('DTR - ')) {
      const matchWeek = this.availableWeeks.find((w) => 'DTR - ' + w.label === this.submitSelectedReportType);
      if (matchWeek) return matchWeek.totalHours;
    }
    return this.stats?.accumulated_hours ? parseFloat(String(this.stats.accumulated_hours)) : 0;
  }

  getSubmitDays(): number {
    const genMatch = this.generatedReports.find((r) => r.title === this.submitSelectedReportType);
    if (genMatch && genMatch.totalDays !== undefined) {
      return genMatch.totalDays;
    }
    if (this.submitSelectedReportType.startsWith('DTR - ')) {
      const matchWeek = this.availableWeeks.find((w) => 'DTR - ' + w.label === this.submitSelectedReportType);
      if (matchWeek) return matchWeek.logsCount;
    }
    return this.logs.length;
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      this.toastService.showError('File size exceeds 15MB limit.');
      return;
    }

    this.submitFileName = file.name;
    const sizeInMb = file.size / (1024 * 1024);
    this.submitFileSize = sizeInMb >= 1 ? `${sizeInMb.toFixed(2)} MB` : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      this.submitFileData = reader.result as string;
      if (!this.submitReportTitle || this.submitReportTitle.includes('DTR') || this.submitReportTitle.includes('Summary')) {
        this.submitReportTitle = file.name.replace(/\.[^/.]+$/, '');
      }
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile() {
    this.submitFileName = '';
    this.submitFileData = '';
    this.submitFileSize = '';
  }

  isImageFile(name?: string): boolean {
    if (!name) return false;
    return /\.(jpe?g|png|webp|gif)$/i.test(name);
  }

  getFileFullUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/${url.replace(/^\/+/, '')}`;
  }

  openAttachedFile(url?: string) {
    if (!url) return;
    window.open(this.getFileFullUrl(url), '_blank');
  }

  submitReportNow() {
    if (!this.currentUser || this.isSubmittingReport) return;
    if (!this.submitReportTitle.trim()) {
      this.toastService.showError('Please enter a report title.');
      return;
    }
    if (this.submitSource === 'file' && !this.submitFileData) {
      this.toastService.showError('Please attach or upload a file for your report.');
      return;
    }

    this.isSubmittingReport = true;
    this.nativeService.triggerHapticFeedback('medium');

    const rawLogs = this.activeReportLogs.length ? this.activeReportLogs : this.logs;
    const cleanLogs = (rawLogs || []).map((l) => ({
      id: l.id,
      log_date: l.log_date,
      time_in: l.time_in,
      time_out: l.time_out,
      total_hours: Number(l.total_hours) || 0,
      activity_notes: l.activity_notes || '',
      status: l.status || 'completed',
    }));

    const cleanTasks = (this.tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      deadline: t.deadline || '',
      priority: t.priority || 'medium',
      status: t.status || 'pending',
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const totalHrs = this.getSubmitHours();
    const totalDays = this.getSubmitDays();

    const reportType = this.submitSource === 'file'
      ? 'Document'
      : (this.submitSelectedReportType.includes('Summary') ? 'Summary' : 'Time Log');

    const payload = {
      user_id: this.currentUser.id,
      report_title: this.submitReportTitle.trim(),
      report_type: reportType,
      report_date: dateStr,
      total_hours: totalHrs,
      total_days: totalDays,
      file_data: this.submitSource === 'file' ? this.submitFileData : undefined,
      file_name: this.submitSource === 'file' ? this.submitFileName : undefined,
      notes: this.submitReportNotes.trim() || undefined,
      report_data: {
        source: this.submitSource,
        coverage: this.submitReportPeriod.trim() || 'Complete Training Period',
        student: {
          id: this.currentUser.id,
          student_no: (this.currentUser as any).student_no || this.currentUser.student_id,
          full_name: this.currentUser.full_name,
          course_section: this.currentUser.course_section,
          company_name: this.currentUser.company_name,
          adviser_name: this.currentUser.adviser_name,
          required_hours: this.currentUser.required_hours,
        },
        stats: this.stats,
        logs: cleanLogs,
        tasks: cleanTasks,
        submitted_at: new Date().toISOString(),
      },
    };

    this.reportService.submitReport(payload).subscribe({
      next: (res) => {
        this.isSubmittingReport = false;
        if (res.success && res.report) {
          this.toastService.showSuccess(res.message || 'Report submitted successfully to coordinator!');
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback('Report submitted to coordinator!', 'success');
          try {
            localStorage.setItem('ontrack_report_updated', Date.now().toString());
          } catch (e) {}
          this.closeSubmitModal();
          this.generatedReports = this.generatedReports.filter(
            (r) => r.title !== this.submitReportTitle.trim()
          );
          this.saveGeneratedReports();
          this.loadStudentReports();
        } else {
          this.toastService.showError(res.message || 'Failed to submit report.');
          this.nativeService.triggerHapticFeedback('warning');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmittingReport = false;
        this.toastService.showError('Connection error. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  printReport() {
    window.print();
  }

  applyFilters() {
    const filterList = (arr: GeneratedReport[]) => {
      let list = [...arr];

      if (this.typeFilter !== 'all') {
        list = list.filter((r) => (r.type || '').toLowerCase() === this.typeFilter.toLowerCase());
      }

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        list = list.filter(
          (r) =>
            (r.title && r.title.toLowerCase().includes(q)) ||
            (r.type && r.type.toLowerCase().includes(q)) ||
            (r.fileName && r.fileName.toLowerCase().includes(q))
        );
      }

      if (this.sortOrder === 'newest') {
        list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
      } else {
        list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id));
      }

      return list;
    };

    this.filteredSubmittedReports = filterList(this.submittedReports);
    this.filteredGeneratedReports = filterList(this.generatedReports);
    this.filteredReports = [...this.filteredSubmittedReports, ...this.filteredGeneratedReports];
    this.cdr.detectChanges();
  }

  goBack() {
    this.router.navigate(['/home']);
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
    } else if (item === 'profile') {
      this.router.navigate(['/profile']);
    } else if (item === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  logout() {
    this.closeSideMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get currentDateFormatted(): string {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get completedTasksCount(): number {
    return this.tasks.filter((t) => t.status === 'completed').length;
  }

  get pendingTasksCount(): number {
    return this.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  }

  get overdueTasksCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter((t) => t.status !== 'completed' && t.deadline && t.deadline < today).length;
  }

  formatShiftTime(timeIn?: string | null, timeOut?: string | null): string {
    return formatShiftTime(timeIn, timeOut);
  }

  formatTime(timeStr?: string | null): string {
    return formatTime(timeStr);
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
    this.toastService.show(msg, type);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.feedbackMessage = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}
