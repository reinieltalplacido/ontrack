import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
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
  IonSpinner,
  IonCard,
  IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  peopleOutline,
  timeOutline,
  calendarOutline,
  checkboxOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  searchOutline,
  closeOutline,
  refreshOutline,
  logOutOutline,
  locationOutline,
  cameraOutline,
  businessOutline,
  mailOutline,
  schoolOutline,
  personOutline,
  shieldCheckmarkOutline,
  documentTextOutline,
  alertCircleOutline,
  chevronForwardOutline,
  eyeOutline,
  imageOutline,
  menuOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,
  calendarClearOutline,
  checkmarkOutline,
  todayOutline,
  reorderThreeOutline,
  clipboardOutline,
  listOutline,
  closeCircleOutline,
  fingerPrintOutline,
  downloadOutline,
  checkmarkDoneCircleOutline,
  checkmark,
  time,
  checkmarkCircle,
  documentText,
  lockClosedOutline,
  keyOutline,
  eyeOffOutline,
  printOutline,
  analyticsOutline,
  copyOutline,
  documentAttachOutline,
  openOutline,
} from 'ionicons/icons';
import { AdminService, AdminStats, MonitoredStudent, CoordinatorReportItem } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NativeService } from '../../../core/services/native.service';
import { ToastService } from '../../../core/services/toast.service';
import { Professor } from '../../../models/user.model';
import { formatHours, formatTime, formatShiftTime, resolveUploadUrl } from '../../../core/utils/format.util';

export interface AdminAttendanceLog {
  id: number;
  user_id: number;
  student_no: string;
  student_name?: string;
  course_section?: string;
  student_company?: string;
  company_name?: string;
  log_date: string;
  time_in: string;
  time_out?: string | null;
  total_hours: number;
  location_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  activity_notes?: string | null;
  status: 'ongoing' | 'completed';
}


export interface WeeklyDayInfo {
  dateStr: string;
  dayName: string;
  dayNumber: number;
  shortDate: string;
  isToday: boolean;
}

export interface StudentDayLog {
  dateStr: string;
  hasDuty: boolean;
  status: 'ongoing' | 'completed' | 'none';
  totalHours: number;
  timeIn?: string;
  timeOut?: string;
  notes?: string;
  photoUrl?: string;
  locationName?: string;
}


export interface DossierWeekGroup {
  weekKey: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  totalWeeklyHours: number;
  daysPresent: number;
  days: {
    dayName: string;
    dayNumber: number;
    dateStr: string;
    hasDuty: boolean;
    status: 'ongoing' | 'completed' | 'none';
    log?: any;
  }[];
  logs: any[];
  isExpanded: boolean;
  selectedDay?: any;
}

export interface StudentWeeklyAttendance {
  student: MonitoredStudent;
  days: StudentDayLog[];
  weeklyHours: number;
  daysPresent: number;
  isExpanded?: boolean;
  activeSelectedDay?: StudentDayLog | null;
}

export interface AdminTaskItem {
  id: number;
  user_id?: number;
  student_no?: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
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
    IonSpinner,
    IonCard,
    IonBadge,
  ],
})
export class AdminDashboardPage implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private nativeService = inject(NativeService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  formatHours = formatHours;
  formatTime = formatTime;
  formatShiftTime = formatShiftTime;
  private cdr = inject(ChangeDetectorRef);

  currentProfessor: Professor | null = null;
  currentSection = 'BSIT 4-A';
  availableSections = [
    'BSIT 4-A',
    'BSIT 4-B',
    'BSIT 4-C',
    'BSIT 4-D',
    'BSIT 4-E',
    'BSIT 4-F',
    'BSIT 4-G',
    'BSIT 4-H',
    'BSIT 4-I',
    'BSIT 4-J',
    'BSIT 4-K',
  ];
  isSideMenuOpen = false;

  // Active Segment
  selectedSegment: 'overview' | 'students' | 'attendance' | 'tasks' | 'reports' | 'profile' = 'overview';

  // Loading States
  isLoadingStats = true;
  isLoadingStudents = false;
  isLoadingAttendance = false;
  isLoadingReports = false;

  // Reports Tab State
  reports: CoordinatorReportItem[] = [];
  filteredReports: CoordinatorReportItem[] = [];
  reportSearchTerm = '';
  reportTypeFilter: 'all' | 'Time Log' | 'Summary' = 'all';
  reportStatusFilter: 'all' | 'submitted' | 'reviewed' | 'approved' = 'all';
  selectedReport: CoordinatorReportItem | null = null;
  isReportModalOpen = false;
  isUpdatingReportStatus = false;
  reportStats = {
    total: 0,
    time_log: 0,
    summary: 0,
    submitted: 0,
    reviewed: 0,
    approved: 0,
  };

  // Overview Data
  stats: AdminStats = {
    total_students: 0,
    active_on_duty: 0,
    completed_duty_today: 0,
    total_hours_rendered: 0,
    total_required_hours: 0,
    overall_percent: 0,
    total_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    today_date: new Date().toISOString().split('T')[0],
  };
  recentActivities: AdminAttendanceLog[] = [];

  // Students Data
  students: MonitoredStudent[] = [];
  filteredStudents: MonitoredStudent[] = [];
  studentSearchTerm = '';
  studentStatusFilter: 'all' | 'on_duty' | 'off_duty' = 'all';

  // Weekly Attendance View State
  attendanceViewMode: 'weekly' | 'daily' = 'weekly';
  currentWeekOffset = 0;
  weekDays: WeeklyDayInfo[] = [];
  weekDateRangeLabel = '';
  weeklyAttendanceList: StudentWeeklyAttendance[] = [];
  weeklyTotalHours = 0;
  weeklyTotalShifts = 0;

  // Attendance Data
  attendanceLogs: AdminAttendanceLog[] = [];
  filteredAttendanceLogs: AdminAttendanceLog[] = [];
  attendanceSearchTerm = '';
  attendanceStatusFilter: 'all' | 'ongoing' | 'completed' = 'all';
  attendanceDateFilter = '';

  // Tasks Data
  assignedTasks: AdminTaskItem[] = [];

  // Student Dossier Modal
  isStudentModalOpen = false;
  selectedStudent: any = null;
  studentDossierLogs: any[] = [];
  studentDossierTasks: any[] = [];
  studentDossierTab: 'logs' | 'tasks' | 'reports' = 'logs';
  studentDossierViewMode: 'weekly' | 'list' = 'weekly';
  dossierWeekGroups: DossierWeekGroup[] = [];
  isLoadingStudentDossier = false;

  // Task Monitoring & Verification
  allTasks: any[] = [];
  filteredTasksList: any[] = [];
  taskStudentFilter: string = 'all';
  taskStatusFilter: string = 'all';
  isLoadingTasks = false;
  isTaskProofModalOpen = false;
  selectedTaskProof: any = null;
  isVerifyingTask = false;

  // Photo Preview Modal
  isPhotoModalOpen = false;
  previewPhotoUrl: string | null = null;
  previewPhotoTitle = '';
  previewPhotoSubtitle = '';

  // Password Change Modal
  isPasswordModalOpen = false;
  currentPasswordInput = '';
  newPasswordInput = '';
  confirmPasswordInput = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isChangingPassword = false;
  passwordError = '';

  // Realtime Sync Handlers for Reports
  private adminReportsPollTimer: any = null;
  private adminStorageEventListener = (event: StorageEvent) => {
    if (event.key === 'ontrack_report_updated') {
      this.loadReports();
    }
  };
  private adminVisibilityListener = () => {
    if (document.visibilityState === 'visible') {
      this.loadReports();
    }
  };

  startReportsRealtimeSync() {
    this.stopReportsRealtimeSync();
    window.addEventListener('storage', this.adminStorageEventListener);
    document.addEventListener('visibilitychange', this.adminVisibilityListener);

    // Live 4-second poll for cross-device & APK updates
    this.adminReportsPollTimer = setInterval(() => {
      if (this.selectedSegment === 'reports') {
        this.loadReports();
      }
    }, 4000);
  }

  stopReportsRealtimeSync() {
    if (this.adminReportsPollTimer) {
      clearInterval(this.adminReportsPollTimer);
      this.adminReportsPollTimer = null;
    }
    window.removeEventListener('storage', this.adminStorageEventListener);
    document.removeEventListener('visibilitychange', this.adminVisibilityListener);
  }

  constructor() {
    addIcons({menuOutline,shieldCheckmarkOutline,calendarOutline,peopleOutline,timeOutline,checkboxOutline,chevronForwardOutline,locationOutline,cameraOutline,hourglassOutline,searchOutline,closeOutline,chevronBackOutline,todayOutline,documentTextOutline,eyeOutline,reorderThreeOutline,clipboardOutline,schoolOutline,businessOutline,mailOutline,listOutline,checkmarkCircleOutline,checkmark,time,closeCircleOutline,calendarClearOutline,fingerPrintOutline,checkmarkCircle,personOutline,documentText,downloadOutline,checkmarkDoneCircleOutline,gridOutline,refreshOutline,logOutOutline,alertCircleOutline,imageOutline,chevronDownOutline,chevronUpOutline,checkmarkOutline,lockClosedOutline,keyOutline,eyeOffOutline,printOutline,analyticsOutline,copyOutline,documentAttachOutline,openOutline});
  }

  ngOnInit() {
    this.checkAuth();
    this.calculateWeek(0);
    this.loadAllData();
    this.startReportsRealtimeSync();
  }

  ionViewWillEnter() {
    this.checkAuth();
    if (this.currentProfessor) {
      this.loadAllData();
    }
  }

  ngOnDestroy() {
    this.stopReportsRealtimeSync();
  }


  setAttendanceMode(mode: 'weekly' | 'daily') {
    this.attendanceViewMode = mode;
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  calculateWeek(offset = 0) {
    this.currentWeekOffset = offset;
    const now = new Date();
    now.setDate(now.getDate() + (offset * 7));

    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const days: WeeklyDayInfo[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const parts = dateStr.split('-');
      days.push({
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        shortDate: `${parts[1]}/${parts[2]}`,
        isToday: dateStr === todayStr,
      });
    }

    this.weekDays = days;
    const startM = days[0];
    const endS = days[6];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sMonth = months[parseInt(startM.dateStr.split('-')[1], 10) - 1];
    const eMonth = months[parseInt(endS.dateStr.split('-')[1], 10) - 1];
    const year = startM.dateStr.split('-')[0];

    if (sMonth === eMonth) {
      this.weekDateRangeLabel = `${sMonth} ${startM.dayNumber} - ${endS.dayNumber}, ${year}`;
    } else {
      this.weekDateRangeLabel = `${sMonth} ${startM.dayNumber} - ${eMonth} ${endS.dayNumber}, ${year}`;
    }

    this.buildWeeklyAttendance();
  }

  prevWeek() {
    this.nativeService.triggerHapticFeedback('medium');
    this.calculateWeek(this.currentWeekOffset - 1);
  }

  nextWeek() {
    this.nativeService.triggerHapticFeedback('medium');
    this.calculateWeek(this.currentWeekOffset + 1);
  }

  resetToCurrentWeek() {
    this.nativeService.triggerHapticFeedback('medium');
    this.calculateWeek(0);
  }

  buildWeeklyAttendance() {
    if (!this.students || this.students.length === 0 || !this.weekDays || this.weekDays.length === 0) {
      this.weeklyAttendanceList = [];
      this.weeklyTotalHours = 0;
      this.weeklyTotalShifts = 0;
      this.cdr.detectChanges();
      return;
    }

    let grandTotalHours = 0;
    let grandTotalShifts = 0;

    const list: StudentWeeklyAttendance[] = this.students.map((st) => {
      let studentWeeklyHours = 0;
      let daysPresentCount = 0;

      const days: StudentDayLog[] = this.weekDays.map((day) => {
        // Find attendance logs for this student on this day
        const matchedLog = this.attendanceLogs.find(
          (l) =>
            (l.user_id === st.id || l.student_no === st.student_no) &&
            l.log_date === day.dateStr
        );

        if (matchedLog) {
          const hrs = Number(matchedLog.total_hours || 0);
          studentWeeklyHours += hrs;
          daysPresentCount++;
          grandTotalShifts++;
          return {
            dateStr: day.dateStr,
            hasDuty: true,
            status: matchedLog.status,
            totalHours: hrs,
            timeIn: matchedLog.time_in,
            timeOut: matchedLog.time_out || undefined,
            notes: matchedLog.activity_notes || undefined,
            photoUrl: matchedLog.photo_url || undefined,
            locationName: matchedLog.location_name || undefined,
          };
        } else {
          return {
            dateStr: day.dateStr,
            hasDuty: false,
            status: 'none',
            totalHours: 0,
          };
        }
      });

      studentWeeklyHours = Math.round(studentWeeklyHours * 100) / 100;
      grandTotalHours += studentWeeklyHours;

      return {
        student: st,
        days,
        weeklyHours: studentWeeklyHours,
        daysPresent: daysPresentCount,
        isExpanded: false,
        activeSelectedDay: null,
      };
    });

    this.weeklyAttendanceList = list;
    this.weeklyTotalHours = Math.round(grandTotalHours * 100) / 100;
    this.weeklyTotalShifts = grandTotalShifts;
    this.cdr.detectChanges();
  }

  toggleStudentWeekExpand(item: StudentWeeklyAttendance) {
    item.isExpanded = !item.isExpanded;
    this.cdr.detectChanges();
  }

  selectStudentDay(item: StudentWeeklyAttendance, dayLog: StudentDayLog) {
    if (item.activeSelectedDay?.dateStr === dayLog.dateStr) {
      item.activeSelectedDay = null;
    } else {
      item.activeSelectedDay = dayLog;
    }
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  getDayShortName(dateStr: string): string {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[d.getDay()];
  }

  getDayNumber(dateStr: string): string {
    const parts = dateStr.split('-');
    return parts[2];
  }

  isDateToday(dateStr: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  }

  formatInspectionDate(dateStr: string): string {
    const parts = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[parseInt(parts[1], 10) - 1];
    return `${m} ${parts[2]}, ${parts[0]}`;
  }

  checkAuth() {
    const prof = this.adminService.currentProfessorValue || this.adminService.getStoredProfessor();
    if (prof) {
      this.currentProfessor = prof;
      if (prof.assigned_section) {
        this.currentSection = prof.assigned_section;
      }
      return;
    }

    // No coordinator session found — do not fabricate another professor
    this.toastService.showError('Coordinator session expired. Please log in.');
    this.router.navigate(['/login']);
  }

  loadAllData(event?: any) {
    this.loadDashboardStats();
    this.loadStudents();
    this.loadAttendanceLogs();
    this.loadTasks();
    this.loadReports();

    if (event) {
      setTimeout(() => {
        event.target.complete();
        this.toastService.showSuccess('Duty data and intern logs updated.');
      }, 600);
    }
  }

  loadDashboardStats() {
    this.isLoadingStats = true;
    this.adminService.getDashboardStats(this.currentProfessor?.id, this.currentSection).subscribe({
      next: (res) => {
        this.isLoadingStats = false;
        if (res.success && res.stats) {
          this.stats = res.stats;
          this.recentActivities = (res.recent_activities || []).map((item) => ({
            ...item,
            id: Number(item.id),
            user_id: Number(item.user_id),
            total_hours: Number(item.total_hours || 0),
          }));
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadStudents() {
    this.isLoadingStudents = true;
    this.adminService.getStudents({ section: this.currentSection }).subscribe({
      next: (res) => {
        this.isLoadingStudents = false;
        if (res.success && res.students) {
          this.students = res.students;
          this.applyStudentFilters();
          this.buildWeeklyAttendance();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStudents = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadAttendanceLogs() {
    this.isLoadingAttendance = true;
    this.adminService.getAttendanceLogs({ limit: 50 }).subscribe({
      next: (res) => {
        this.isLoadingAttendance = false;
        if (res.success && res.logs) {
          this.attendanceLogs = res.logs;
          this.applyAttendanceFilters();
          this.buildWeeklyAttendance();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingAttendance = false;
        this.cdr.detectChanges();
      },
    });
  }

  openSideMenu() {
    this.isSideMenuOpen = true;
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  closeSideMenu() {
    this.isSideMenuOpen = false;
    this.cdr.detectChanges();
  }

  selectMenuItem(segment: 'overview' | 'students' | 'attendance' | 'tasks' | 'reports' | 'profile') {
    this.selectedSegment = segment;
    this.closeSideMenu();
    this.switchSegment(segment);
  }

  switchSegment(segment: 'overview' | 'students' | 'attendance' | 'tasks' | 'reports' | 'profile') {
    this.selectedSegment = segment;
    this.nativeService.triggerHapticFeedback('medium');
    if (segment === 'students' && this.students.length === 0) {
      this.loadStudents();
    } else if (segment === 'attendance' && this.attendanceLogs.length === 0) {
      this.loadAttendanceLogs();
    } else if (segment === 'tasks' && this.allTasks.length === 0) {
      this.loadTasks();
    } else if (segment === 'reports') {
      this.loadReports();
    }
    this.cdr.detectChanges();
  }

  // Student Filtering
  applyStudentFilters() {
    let list = [...this.students];

    if (this.studentStatusFilter === 'on_duty') {
      list = list.filter((s) => s.is_on_duty);
    } else if (this.studentStatusFilter === 'off_duty') {
      list = list.filter((s) => !s.is_on_duty);
    }

    if (this.studentSearchTerm.trim() !== '') {
      const q = this.studentSearchTerm.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.student_no.toLowerCase().includes(q) ||
          (s.company_name && s.company_name.toLowerCase().includes(q))
      );
    }

    this.filteredStudents = list;
    this.cdr.detectChanges();
  }

  setStudentStatusFilter(filter: 'all' | 'on_duty' | 'off_duty') {
    this.studentStatusFilter = filter;
    this.applyStudentFilters();
  }

  // Attendance Filtering
  applyAttendanceFilters() {
    let list = [...this.attendanceLogs];

    if (this.attendanceStatusFilter !== 'all') {
      list = list.filter((l) => l.status === this.attendanceStatusFilter);
    }

    if (this.attendanceDateFilter) {
      list = list.filter((l) => l.log_date === this.attendanceDateFilter);
    }

    if (this.attendanceSearchTerm.trim() !== '') {
      const q = this.attendanceSearchTerm.toLowerCase().trim();
      list = list.filter(
        (l) =>
          (l.student_name && l.student_name.toLowerCase().includes(q)) ||
          l.student_no.toLowerCase().includes(q) ||
          (l.location_name && l.location_name.toLowerCase().includes(q))
      );
    }

    this.filteredAttendanceLogs = list;
    this.cdr.detectChanges();
  }

  setAttendanceStatusFilter(status: 'all' | 'ongoing' | 'completed') {
    this.attendanceStatusFilter = status;
    this.applyAttendanceFilters();
  }

  clearAttendanceDateFilter() {
    this.attendanceDateFilter = '';
    this.applyAttendanceFilters();
  }

  // Student Dossier Modal

  groupDossierLogsByWeek() {
    if (!this.studentDossierLogs || this.studentDossierLogs.length === 0) {
      this.dossierWeekGroups = [];
      return;
    }

    const groupsMap = new Map<string, any[]>();

    for (const log of this.studentDossierLogs) {
      if (!log || !log.log_date) continue;
      const parts = String(log.log_date).split('-');
      if (parts.length < 3) continue;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      const day = dateObj.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(y, m, d + diff);

      const monYear = monday.getFullYear();
      const monMonth = String(monday.getMonth() + 1).padStart(2, '0');
      const monDate = String(monday.getDate()).padStart(2, '0');
      const mStr = `${monYear}-${monMonth}-${monDate}`;

      if (!groupsMap.has(mStr)) {
        groupsMap.set(mStr, []);
      }
      groupsMap.get(mStr)!.push(log);
    }

    const sortedWeekKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.dossierWeekGroups = sortedWeekKeys.map((mStr, index) => {
      const parts = mStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const monday = new Date(y, m, d);
      const sunday = new Date(y, m, d + 6);

      const sMonth = months[monday.getMonth()] || 'Jan';
      const eMonth = months[sunday.getMonth()] || 'Jan';
      const year = String(monday.getFullYear());

      const weekLabel = sMonth === eMonth
        ? `${sMonth} ${monday.getDate()} - ${sunday.getDate()}, ${year}`
        : `${sMonth} ${monday.getDate()} - ${eMonth} ${sunday.getDate()}, ${year}`;

      const logsInWeek = groupsMap.get(mStr) || [];
      let totalHrs = 0;
      let distinctDaysCount = 0;

      const days = [];
      for (let i = 0; i < 7; i++) {
        const curDate = new Date(y, m, d + i);
        const cYear = curDate.getFullYear();
        const cMonth = String(curDate.getMonth() + 1).padStart(2, '0');
        const cDay = String(curDate.getDate()).padStart(2, '0');
        const curStr = `${cYear}-${cMonth}-${cDay}`;
        const logForDay = logsInWeek.find((l: any) => l.log_date === curStr);

        if (logForDay) {
          totalHrs += Number(logForDay.total_hours || 0);
          distinctDaysCount++;
          days.push({
            dayName: dayNames[i],
            dayNumber: curDate.getDate(),
            dateStr: curStr,
            hasDuty: true,
            status: logForDay.status,
            log: logForDay,
          });
        } else {
          days.push({
            dayName: dayNames[i],
            dayNumber: curDate.getDate(),
            dateStr: curStr,
            hasDuty: false,
            status: 'none' as const,
          });
        }
      }

      return {
        weekKey: mStr,
        weekLabel,
        isCurrentWeek: index === 0,
        totalWeeklyHours: Math.round(totalHrs * 100) / 100,
        daysPresent: distinctDaysCount,
        days,
        logs: logsInWeek,
        isExpanded: true,
      };
    });
  }

  selectDossierDay(week: DossierWeekGroup, d: any) {
    if (week.selectedDay?.dateStr === d.dateStr) {
      week.selectedDay = null;
    } else {
      week.selectedDay = d;
    }
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  clearDossierSelectedDay(week: DossierWeekGroup) {
    week.selectedDay = null;
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  getTasksForDossierDay(dateStr: string): any[] {
    if (!this.studentDossierTasks || this.studentDossierTasks.length === 0) return [];
    const filtered = this.studentDossierTasks.filter((t: any) => {
      if (!t.created_at) return true;
      const taskCreatedDate = t.created_at.split(' ')[0];
      return taskCreatedDate <= dateStr;
    });
    return filtered.length > 0 ? filtered : this.studentDossierTasks;
  }

  formatFriendlyDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getDayOfWeekName(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return '';
    }
  }

  toggleDossierWeek(week: DossierWeekGroup) {
    week.isExpanded = !week.isExpanded;
    this.cdr.detectChanges();
  }

  openStudentDossier(student: MonitoredStudent) {
    if (!student) return;
    this.selectedStudent = student;
    this.isStudentModalOpen = true;
    this.isLoadingStudentDossier = true;
    this.studentDossierLogs = [];
    this.studentDossierTasks = [];
    this.studentDossierTab = 'logs';
    this.studentDossierViewMode = 'weekly';
    this.cdr.detectChanges();

    const sId = Number(student.id);
    this.adminService.getStudentDetail(sId).subscribe({
      next: (res) => {
        this.isLoadingStudentDossier = false;
        if (res && res.success) {
          this.selectedStudent = { ...student, ...res.student };
          this.studentDossierLogs = res.logs || [];
          this.studentDossierTasks = res.tasks || [];
          try {
            this.groupDossierLogsByWeek();
          } catch (err) {
            console.error('Error grouping dossier logs by week:', err);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching student detail:', err);
        this.isLoadingStudentDossier = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeStudentDossier() {
    this.isStudentModalOpen = false;
    this.selectedStudent = null;
    this.cdr.detectChanges();
  }

  getStudentReportsCount(studentId: any): number {
    if (!studentId) return 0;
    const sId = Number(studentId);
    return this.reports.filter((r) => r.user_id === sId).length;
  }

  getReportsForStudent(studentId: any): CoordinatorReportItem[] {
    if (!studentId) return [];
    const sId = Number(studentId);
    return this.reports.filter((r) => r.user_id === sId);
  }

  loadTasks() {
    this.isLoadingTasks = true;
    this.adminService.getAllTasks({ section: this.currentSection }).subscribe({
      next: (res) => {
        this.isLoadingTasks = false;
        if (res.success) {
          this.allTasks = res.tasks || [];
          this.applyTaskFilters();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyTaskFilters() {
    let filtered = [...this.allTasks];
    if (this.taskStudentFilter !== 'all') {
      const sId = parseInt(this.taskStudentFilter, 10);
      filtered = filtered.filter(t => t.user_id === sId);
    }
    if (this.taskStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === this.taskStatusFilter);
    }
    this.filteredTasksList = filtered;
    this.cdr.detectChanges();
  }

  hasTaskProof(task: any): boolean {
    if (!task) return false;
    return !!(task.proof_file || task.proof_url);
  }

  getTaskProofFilename(task: any): string {
    if (!task) return 'Attached Deliverable';
    if (task.proof_file) return task.proof_file;
    if (task.proof_url) {
      const parts = task.proof_url.split('/');
      return parts[parts.length - 1];
    }
    return 'Attached Deliverable';
  }

  openTaskProof(task: any) {
    if (this.selectedStudent) {
      if (!task.student_name) task.student_name = this.selectedStudent.full_name;
      if (!task.student_no) task.student_no = this.selectedStudent.student_no;
      if (!task.course_section) task.course_section = this.selectedStudent.course_section;
      if (!task.company_name) task.company_name = this.selectedStudent.company_name;
    }
    if (!task.proof_file && task.proof_url) {
      task.proof_file = this.getTaskProofFilename(task);
    }
    if (!task.proof_url && task.proof_file) {
      task.proof_url = this.getPhotoUrl(task.proof_file);
    }
    this.selectedTaskProof = task;
    this.isTaskProofModalOpen = true;
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  closeTaskProofModal() {
    this.isTaskProofModalOpen = false;
    this.selectedTaskProof = null;
    this.cdr.detectChanges();
  }

  verifyTask(task: any) {
    if (this.isVerifyingTask) return;
    this.isVerifyingTask = true;
    const profName = this.currentProfessor?.full_name || 'Academic Coordinator';
    this.adminService.verifyTask(task.id, profName).subscribe({
      next: (res) => {
        this.isVerifyingTask = false;
        if (res.success) {
          task.status = 'completed';
          task.verified_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
          task.verified_by = profName;

          if (this.studentDossierTasks && this.studentDossierTasks.length > 0) {
            const dossierTask = this.studentDossierTasks.find((t: any) => Number(t.id) === Number(task.id));
            if (dossierTask) {
              dossierTask.status = 'completed';
              dossierTask.verified_at = task.verified_at;
              dossierTask.verified_by = task.verified_by;
            }
          }

          if (this.allTasks && this.allTasks.length > 0) {
            const generalTask = this.allTasks.find((t: any) => Number(t.id) === Number(task.id));
            if (generalTask) {
              generalTask.status = 'completed';
              generalTask.verified_at = task.verified_at;
              generalTask.verified_by = task.verified_by;
            }
          }

          this.presentToast('Task verified and marked completed.', 'success');
          this.nativeService.triggerHapticFeedback('success');
          this.loadDashboardStats();
        } else {
          this.presentToast(res.message || 'Could not verify task.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isVerifyingTask = false;
        this.presentToast('Error connecting to verification service.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  isProofDocument(file: string): boolean {
    if (!file) return false;
    const ext = file.split('.').pop()?.toLowerCase();
    return ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'xls' || ext === 'xlsx';
  }

  // Photo Preview Modal
  openPhotoPreview(photoUrl: string | null | undefined, title: string, subtitle: string) {
    if (!photoUrl) return;
    this.previewPhotoUrl = this.getPhotoUrl(photoUrl);
    this.previewPhotoTitle = title;
    this.previewPhotoSubtitle = subtitle;
    this.isPhotoModalOpen = true;
    this.cdr.detectChanges();
  }

  closePhotoPreview() {
    this.isPhotoModalOpen = false;
    this.previewPhotoUrl = null;
    this.cdr.detectChanges();
  }

  getPhotoUrl(path: string | null | undefined): string | null {
    return path ? resolveUploadUrl(path, 'uploads/tasks/') : null;
  }

  // Change Password Modal Controls
  openPasswordModal() {
    this.currentPasswordInput = '';
    this.newPasswordInput = '';
    this.confirmPasswordInput = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.passwordError = '';
    this.isPasswordModalOpen = true;
    this.cdr.detectChanges();
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
    this.cdr.detectChanges();
  }

  submitChangePassword() {
    this.passwordError = '';
    if (!this.newPasswordInput || !this.confirmPasswordInput) {
      this.passwordError = 'Please fill in all password fields.';
      return;
    }
    if (this.newPasswordInput.length < 6) {
      this.passwordError = 'New password must be at least 6 characters long.';
      return;
    }
    if (this.newPasswordInput !== this.confirmPasswordInput) {
      this.passwordError = 'New passwords do not match.';
      return;
    }
    if (!this.currentProfessor?.id) {
      this.passwordError = 'User session error. Please log in again.';
      return;
    }

    this.isChangingPassword = true;
    this.authService.changePassword({
      user_id: this.currentProfessor.id,
      role: 'professor',
      current_password: this.currentPasswordInput,
      new_password: this.newPasswordInput,
      confirm_password: this.confirmPasswordInput
    }).subscribe({
      next: (res) => {
        this.isChangingPassword = false;
        if (res.success) {
          this.toastService.showSuccess(res.message || 'Password updated successfully!');
          this.closePasswordModal();
        } else {
          this.passwordError = res.message || 'Failed to change password.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.passwordError = err.error?.message || 'Error communicating with server.';
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // REPORTS METHODS (ACADEMIC COORDINATOR)
  // ==========================================

  loadReports() {
    this.isLoadingReports = true;
    this.adminService
      .getSubmittedReports({
        professor_id: this.currentProfessor?.id,
        section: this.currentSection,
      })
      .subscribe({
        next: (res) => {
          this.isLoadingReports = false;
          if (res && res.success && res.reports) {
            this.reports = res.reports;
            this.computeReportStats(res.stats);
            this.applyReportFilters();
          } else {
            this.reports = [];
            this.filteredReports = [];
            this.computeReportStats();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoadingReports = false;
          this.reports = [];
          this.filteredReports = [];
          this.computeReportStats();
          this.cdr.detectChanges();
        },
      });
  }

  computeReportStats(serverStats?: any) {
    if (serverStats) {
      const total = Number(serverStats.total ?? serverStats.total_reports ?? this.reports.length);
      const time_log = Number(serverStats.time_log ?? serverStats.time_log_count ?? this.reports.filter((r) => r.report_type === 'Time Log').length);
      const summary = Number(serverStats.summary ?? serverStats.summary_count ?? this.reports.filter((r) => r.report_type === 'Summary').length);
      const submitted = Number(serverStats.submitted ?? serverStats.pending_review ?? this.reports.filter((r) => r.status === 'submitted').length);
      const reviewed = Number(serverStats.reviewed ?? this.reports.filter((r) => r.status === 'reviewed').length);
      const approved = Number(serverStats.approved ?? serverStats.approved_count ?? this.reports.filter((r) => r.status === 'approved').length);
      this.reportStats = { total, time_log, summary, submitted, reviewed, approved };
    } else {
      const total = this.reports.length;
      const time_log = this.reports.filter((r) => r.report_type === 'Time Log').length;
      const summary = this.reports.filter((r) => r.report_type === 'Summary').length;
      const submitted = this.reports.filter((r) => r.status === 'submitted').length;
      const reviewed = this.reports.filter((r) => r.status === 'reviewed').length;
      const approved = this.reports.filter((r) => r.status === 'approved').length;
      this.reportStats = { total, time_log, summary, submitted, reviewed, approved };
    }
  }

  clickReportCardFilter(cardType: 'all' | 'Time Log' | 'Summary' | 'submitted') {
    this.nativeService.triggerHapticFeedback('light');
    if (cardType === 'all') {
      this.reportTypeFilter = 'all';
      this.reportStatusFilter = 'all';
      this.reportSearchTerm = '';
    } else if (cardType === 'Time Log') {
      if (this.reportTypeFilter === 'Time Log' && this.reportStatusFilter === 'all') {
        this.reportTypeFilter = 'all';
      } else {
        this.reportTypeFilter = 'Time Log';
        this.reportStatusFilter = 'all';
      }
    } else if (cardType === 'Summary') {
      if (this.reportTypeFilter === 'Summary' && this.reportStatusFilter === 'all') {
        this.reportTypeFilter = 'all';
      } else {
        this.reportTypeFilter = 'Summary';
        this.reportStatusFilter = 'all';
      }
    } else if (cardType === 'submitted') {
      if (this.reportStatusFilter === 'submitted' && this.reportTypeFilter === 'all') {
        this.reportStatusFilter = 'all';
      } else {
        this.reportStatusFilter = 'submitted';
        this.reportTypeFilter = 'all';
      }
    }
    this.applyReportFilters();
  }

  applyReportFilters() {
    let list = [...this.reports];

    if (this.reportTypeFilter !== 'all') {
      list = list.filter((r) => r.report_type === this.reportTypeFilter);
    }

    if (this.reportStatusFilter !== 'all') {
      list = list.filter((r) => r.status === this.reportStatusFilter);
    }

    if (this.reportSearchTerm.trim() !== '') {
      const q = this.reportSearchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.student_name && r.student_name.toLowerCase().includes(q)) ||
          (r.student_no && r.student_no.toLowerCase().includes(q)) ||
          (r.report_title && r.report_title.toLowerCase().includes(q)) ||
          (r.student_company && r.student_company.toLowerCase().includes(q))
      );
    }

    this.filteredReports = list;
    this.cdr.detectChanges();
  }

  setReportTypeFilter(type: 'all' | 'Time Log' | 'Summary') {
    this.reportTypeFilter = type;
    this.nativeService.triggerHapticFeedback('light');
    this.applyReportFilters();
  }

  setReportStatusFilter(status: 'all' | 'submitted' | 'reviewed' | 'approved') {
    this.reportStatusFilter = status;
    this.nativeService.triggerHapticFeedback('light');
    this.applyReportFilters();
  }

  openReportModal(report: CoordinatorReportItem) {
    this.selectedReport = { ...report };
    if (this.selectedReport.report_data && typeof this.selectedReport.report_data === 'string') {
      try {
        this.selectedReport.report_details = JSON.parse(this.selectedReport.report_data);
      } catch (e) {
        console.warn('Error parsing report data JSON', e);
      }
    }
    this.isReportModalOpen = true;
    this.nativeService.triggerHapticFeedback('medium');
    this.cdr.detectChanges();
  }

  closeReportModal() {
    this.isReportModalOpen = false;
    this.selectedReport = null;
    this.cdr.detectChanges();
  }

  updateReportStatus(status: 'reviewed' | 'approved') {
    if (!this.selectedReport?.id) return;

    this.isUpdatingReportStatus = true;
    const reviewerName = this.currentProfessor?.full_name || 'Academic Coordinator';
    const nowIso = new Date().toISOString();

    this.adminService
      .reviewReport(this.selectedReport.id, status, reviewerName)
      .subscribe({
        next: (res) => {
          this.isUpdatingReportStatus = false;
          if (res.success) {
            this.nativeService.triggerHapticFeedback('success');
            const actionLabel = status === 'approved' ? 'approved' : 'marked as reviewed';
            this.toastService.showSuccess(`Report successfully ${actionLabel}!`);

            // 1. Immediately update selectedReport in the modal (0ms UI update)
            if (this.selectedReport) {
              this.selectedReport.status = status;
              this.selectedReport.reviewed_by = reviewerName;
              this.selectedReport.reviewed_at = nowIso;
            }

            // 2. Immediately update the report in background arrays
            const reportInList = this.reports.find((r) => r.id === this.selectedReport?.id);
            if (reportInList) {
              reportInList.status = status;
              reportInList.reviewed_by = reviewerName;
              reportInList.reviewed_at = nowIso;
            }
            this.computeReportStats();
            this.applyReportFilters();

            // 3. Instant cross-tab sync to student portal
            try {
              localStorage.setItem('ontrack_report_updated', Date.now().toString());
            } catch {
              // Ignore storage quota errors
            }

            // 4. Force immediate Change Detection for real-time rendering
            this.cdr.detectChanges();

            // Background reload to sync any additional server fields
            this.loadReports();
          } else {
            this.nativeService.triggerHapticFeedback('warning');
            this.toastService.showError(res.message || 'Could not update report status.');
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.isUpdatingReportStatus = false;
          this.nativeService.triggerHapticFeedback('warning');
          this.toastService.showError('Network error updating report status.');
          this.cdr.detectChanges();
        },
      });
  }

  printReportDocument() {
    window.print();
  }

  openAttachedFile(url?: string) {
    if (!url) return;
    const full = this.getAttachmentFullUrl(url);
    window.open(full, '_blank');
  }

  getAttachmentFullUrl(url?: string): string {
    return resolveUploadUrl(url);
  }

  isImageFile(url?: string): boolean {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.webp') || clean.endsWith('.gif');
  }

  presentToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    this.toastService.show(message, type);
  }

  logout() {
    this.closeSideMenu();
    this.adminService.logout();
    this.authService.logout();
    this.toastService.showInfo('Signed out of Coordinator Portal.');
    this.router.navigate(['/login']);
  }
}
