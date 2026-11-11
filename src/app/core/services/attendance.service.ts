import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AttendanceLog, DashboardStats } from '../../models/attendance.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private get apiUrl(): string {
    return environment.apiUrl;
  }

  getDashboardStats(userId: number): Observable<DashboardStats> {
    return this.http
      .get<{ success: boolean; stats: DashboardStats }>(
        `${this.apiUrl}/dashboard/stats.php?user_id=${userId}`
      )
      .pipe(map((res) => res.stats));
  }

  clockIn(payload: {
    user_id: number;
    latitude?: number | null;
    longitude?: number | null;
    location_name?: string;
    photo_base64?: string | null;
  }): Observable<{ success: boolean; message: string; log: AttendanceLog }> {
    return this.http.post<{ success: boolean; message: string; log: AttendanceLog }>(
      `${this.apiUrl}/attendance/clock_in.php`,
      payload
    );
  }

  clockOut(payload: {
    user_id: number;
    activity_notes: string;
  }): Observable<{
    success: boolean;
    message: string;
    rendered_today: number;
    total_accumulated: number;
    log: AttendanceLog;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      rendered_today: number;
      total_accumulated: number;
      log: AttendanceLog;
    }>(`${this.apiUrl}/attendance/clock_out.php`, payload);
  }

  getAttendanceHistory(userId: number): Observable<{
    success: boolean;
    count: number;
    total_hours: number;
    logs: AttendanceLog[];
  }> {
    return this.http.get<{
      success: boolean;
      count: number;
      total_hours: number;
      logs: AttendanceLog[];
    }>(`${this.apiUrl}/attendance/history.php?user_id=${userId}`);
  }
}
