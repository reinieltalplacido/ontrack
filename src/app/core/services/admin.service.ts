import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Professor, AdminAuthResponse } from '../../models/user.model';
import { environment } from '../../../environments/environment';

const ADMIN_SESSION_KEY = 'ontrack_admin_session';

export interface AdminStats {
  total_students: number;
  active_on_duty: number;
  completed_duty_today: number;
  total_hours_rendered: number;
  total_required_hours: number;
  overall_percent: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  today_date: string;
}

export interface MonitoredStudent {
  id: number;
  student_no: string;
  full_name: string;
  email: string;
  course: string;
  course_section: string;
  school_campus: string;
  company_name: string;
  required_hours: number;
  accumulated_hours: number;
  remaining_hours: number;
  completion_percent: number;
  target_date: string;
  is_on_duty: boolean;
  current_shift?: {
    id: number;
    time_in: string;
    location_name: string;
  } | null;
  pending_tasks_count: number;
  professor_id?: number;
  adviser_name?: string;
}

export interface CoordinatorReportItem {
  id: number;
  user_id: number;
  student_no: string;
  student_name: string;
  course_section: string;
  school_campus?: string;
  professor_id?: number | null;
  adviser_name?: string;
  adviser_email?: string;
  report_title: string;
  report_type: 'Time Log' | 'Summary';
  report_date: string;
  total_hours: number;
  total_days: number;
  status: 'submitted' | 'reviewed' | 'approved';
  report_data?: string | null;
  report_details?: any;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
  student_company?: string;
  student_email?: string;
  required_hours?: number;
  target_date?: string;
  file_url?: string;
  file_name?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private get apiUrl(): string {
    return environment.apiUrl;
  }

  private currentProfessorSubject = new BehaviorSubject<Professor | null>(this.getStoredProfessor());
  public currentProfessor$ = this.currentProfessorSubject.asObservable();

  public get currentProfessorValue(): Professor | null {
    const stored = this.getStoredProfessor();
    if (stored) {
      if (!this.currentProfessorSubject.value || this.currentProfessorSubject.value.id !== stored.id) {
        this.currentProfessorSubject.next(stored);
      }
      return stored;
    }
    return this.currentProfessorSubject.value;
  }

  public isAdminLoggedIn(): boolean {
    return !!this.getStoredProfessor();
  }

  login(identifier: string, password: string): Observable<AdminAuthResponse> {
    const payload = { identifier, password };
    return this.http.post<AdminAuthResponse>(`${this.apiUrl}/admin/auth/login.php`, payload).pipe(
      tap((res) => {
        if (res.success && res.professor) {
          this.setAdminSession(res.professor);
        }
      }),
      catchError((err) => {
        const errorMsg = err?.error?.message || 'Invalid professor credentials.';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  register(data: Partial<Professor> & { password: string }): Observable<AdminAuthResponse> {
    return this.http.post<AdminAuthResponse>(`${this.apiUrl}/admin/auth/register.php`, data);
  }

  getDashboardStats(professorId?: number, section?: string): Observable<{ success: boolean; stats: AdminStats; recent_activities: any[] }> {
    let params = new HttpParams();
    if (professorId) params = params.set('professor_id', professorId.toString());
    if (section) params = params.set('section', section);

    return this.http.get<{ success: boolean; stats: AdminStats; recent_activities: any[] }>(
      `${this.apiUrl}/admin/dashboard/stats.php`,
      { params }
    );
  }

  getStudents(filters?: {
    professor_id?: number;
    section?: string;
    search?: string;
    limit?: number;
    status?: 'all' | 'on_duty' | 'off_duty';
  }): Observable<{ success: boolean; count: number; students: MonitoredStudent[] }> {
    let params = new HttpParams();
    if (filters?.professor_id) params = params.set('professor_id', filters.professor_id.toString());
    if (filters?.section) params = params.set('section', filters.section);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.status) params = params.set('status', filters.status);

    return this.http.get<{ success: boolean; count: number; students: MonitoredStudent[] }>(
      `${this.apiUrl}/admin/students/list.php`,
      { params }
    );
  }

  getStudentDetail(studentId: number): Observable<{
    success: boolean;
    student: any;
    logs: any[];
    tasks: any[];
  }> {
    return this.http.get<{
      success: boolean;
      student: any;
      logs: any[];
      tasks: any[];
    }>(`${this.apiUrl}/admin/students/detail.php?id=${studentId}`);
  }

  getAttendanceLogs(filters?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    student_id?: number;
    search?: string;
    limit?: number;
  }): Observable<{ success: boolean; count: number; logs: any[] }> {
    let params = new HttpParams();
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.student_id) params = params.set('student_id', filters.student_id.toString());
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<{ success: boolean; count: number; logs: any[] }>(
      `${this.apiUrl}/admin/attendance/list.php`,
      { params }
    );
  }

  assignTask(payload: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    target_type: 'student' | 'section';
    user_id?: number;
    section?: string;
    professor_id?: number;
  }): Observable<{ success: boolean; message: string; task_id?: number; assigned_count?: number }> {
    return this.http.post<{ success: boolean; message: string; task_id?: number; assigned_count?: number }>(
      `${this.apiUrl}/admin/tasks/assign.php`,
      payload
    );
  }

  getAllTasks(filters?: { student_id?: number; status?: string; section?: string }): Observable<{
    success: boolean;
    count: number;
    tasks: any[];
  }> {
    let params = new HttpParams();
    if (filters?.student_id) params = params.set('student_id', filters.student_id.toString());
    if (filters?.status && filters.status !== 'all') params = params.set('status', filters.status);
    if (filters?.section && filters.section !== 'all') params = params.set('section', filters.section);

    return this.http.get<{ success: boolean; count: number; tasks: any[] }>(
      `${this.apiUrl}/admin/tasks/list.php`,
      { params }
    );
  }

  verifyTask(taskId: number, verifiedBy?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/tasks/verify.php`,
      { task_id: taskId, verified_by: verifiedBy }
    );
  }

  getSubmittedReports(filters?: {
    professor_id?: number;
    section?: string;
    status?: string;
    report_type?: string;
    search?: string;
  }): Observable<{ success: boolean; count: number; stats?: any; reports: CoordinatorReportItem[] }> {
    let params = new HttpParams();
    if (filters?.professor_id) params = params.set('professor_id', filters.professor_id.toString());
    if (filters?.section) params = params.set('section', filters.section);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.report_type) params = params.set('report_type', filters.report_type);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http
      .get<{ success: boolean; count: number; stats?: any; reports: CoordinatorReportItem[] }>(
        `${this.apiUrl}/admin/reports/list.php`,
        { params }
      )
      .pipe(catchError(() => of({ success: false, count: 0, reports: [] })));
  }

  reviewReport(
    reportId: number,
    status: 'reviewed' | 'approved' | 'submitted',
    reviewedBy?: string
  ): Observable<{ success: boolean; message: string }> {
    const payload = {
      report_id: reportId,
      status: status,
      reviewed_by: reviewedBy || 'OJT Coordinator',
    };
    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiUrl}/admin/reports/review.php`,
        payload
      )
      .pipe(
        catchError((err) => {
          const msg = err?.error?.message || 'Could not update report status.';
          return of({ success: false, message: msg });
        })
      );
  }

  logout(): void {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    this.currentProfessorSubject.next(null);
  }

  public setAdminSession(prof: Professor): void {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(prof));
    this.currentProfessorSubject.next(prof);
  }

  public getStoredProfessor(): Professor | null {
    try {
      const data = localStorage.getItem(ADMIN_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}

