import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, AuthResponse, Professor } from '../../models/user.model';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'ontrack_user_session';
const ADMIN_SESSION_KEY = 'ontrack_admin_session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Login against ontrack-api (validates BCrypt hash in MySQL for students & professors)
   */
  login(identifier: string, password: string): Observable<AuthResponse> {
    const payload = {
      email: identifier,
      password: password,
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login.php`, payload).pipe(
      tap((res) => {
        if (res.success) {
          if (res.role === 'professor' || res.professor) {
            const prof = res.professor || {
              id: res.user?.id,
              employee_id: res.user?.student_id,
              full_name: res.user?.full_name,
              email: res.user?.email,
              department: 'College of Information and Communications Technology',
              role: 'coordinator',
              assigned_section: res.user?.course_section || 'BSIT 4-A',
            };
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(prof));
          }
          if (res.user) {
            this.setSession(res.user);
          }
        }
      }),
      catchError((err) => {
        const errorMsg = err?.error?.message || 'Invalid email or password.';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  /**
   * Register new student into ontrack_db.users table
   */
  register(userData: any): Observable<AuthResponse> {
    const payload = {
      student_id: userData.student_id || userData.student_no,
      full_name: userData.full_name,
      email: userData.email,
      password: userData.password,
      course_section: userData.course || userData.course_section || 'BSIT 4-A',
      school_campus: userData.school_campus || 'NEUST - Sumacab Campus',
      company_name: userData.company_name,
      adviser_name: userData.adviser_name,
      adviser_email: userData.adviser_email || 'adviser@neust.edu.ph',
      start_date: userData.start_date || '2026-08-15',
      target_date: userData.target_date || '2026-12-15',
      required_hours: Number(userData.required_hours) || 486,
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register.php`, payload).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.setSession(res.user);
        }
      }),
      catchError((err) => {
        const errorMsg = err?.error?.message || 'Registration failed. Please check inputs.';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  /**
   * Update student profile in ontrack-api
   */
  updateProfile(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/update_profile.php`, payload).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.setSession(res.user);
        }
      }),
      catchError((err) => {
        const errorMsg = err?.error?.message || 'Could not update profile.';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  updateSessionUser(updatedUser: Partial<User>): void {
    const current = this.currentUserValue;
    if (current) {
      const merged = { ...current, ...updatedUser };
      this.setSession(merged);
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUserSubject.next(null);
  }

  private setSession(user: User): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
