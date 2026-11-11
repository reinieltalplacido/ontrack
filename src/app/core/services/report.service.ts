import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SubmittedReportItem {
  id: number;
  user_id: number;
  student_no: string;
  student_name: string;
  course_section: string;
  school_campus: string;
  professor_id?: number;
  adviser_name?: string;
  adviser_email?: string;
  report_title: string;
  report_type: 'Time Log' | 'Summary' | string;
  report_date: string;
  total_hours: number;
  total_days: number;
  report_data?: any;
  report_details?: any;
  file_url?: string | null;
  file_name?: string | null;
  notes?: string | null;
  status: 'submitted' | 'reviewed' | 'approved';
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private http = inject(HttpClient);
  private get apiUrl(): string {
    return environment.apiUrl;
  }

  /**
   * Submit generated DTR or Summary report to student's academic adviser
   */
  submitReport(payload: {
    report_id?: number;
    user_id: number;
    report_title: string;
    report_type: 'Time Log' | 'Summary' | string;
    report_date: string;
    total_hours: number;
    total_days: number;
    report_data?: any;
    file_data?: string;
    file_name?: string;
    file_url?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; report?: SubmittedReportItem }> {
    return this.http
      .post<{ success: boolean; message: string; report?: SubmittedReportItem }>(
        `${this.apiUrl}/reports/submit.php`,
        payload
      )
      .pipe(
        timeout(12000),
        catchError((err) => {
          const msg = err?.error?.message || (err?.name === 'TimeoutError' ? 'Server timed out. Please check your connection and try again.' : 'Failed to submit report to adviser. Please try again.');
          return of({ success: false, message: msg });
        })
      );
  }

  /**
   * Retrieve all reports submitted by a student
   */
  getStudentReports(userId: number): Observable<{ success: boolean; count: number; reports: SubmittedReportItem[] }> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http
      .get<{ success: boolean; count: number; reports: SubmittedReportItem[] }>(
        `${this.apiUrl}/reports/list.php`,
        { params }
      )
      .pipe(
        catchError(() => of({ success: false, count: 0, reports: [] }))
      );
  }
}
