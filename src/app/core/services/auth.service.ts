import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, AuthResponse, Professor } from '../../models/user.model';
import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'ontrack_user_session';
const ADMIN_SESSION_KEY = 'ontrack_admin_session';
const KEEP_SIGNED_IN_KEY = 'ontrack_keep_signed_in';
const SAVED_IDENTIFIER_KEY = 'ontrack_saved_identifier';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private adminService = inject(AdminService);
  private get apiUrl(): string {
    return environment.apiUrl;
  }

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
  login(identifier: string, password: string, rememberMe: boolean = true): Observable<AuthResponse> {
    const payload = {
      email: identifier,
      password: password,
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login.php`, payload).pipe(
      tap((res) => {
        if (res.success) {
          if (rememberMe) {
            localStorage.setItem(KEEP_SIGNED_IN_KEY, 'true');
            localStorage.setItem(SAVED_IDENTIFIER_KEY, identifier);
          } else {
            localStorage.setItem(KEEP_SIGNED_IN_KEY, 'false');
            localStorage.removeItem(SAVED_IDENTIFIER_KEY);
          }

          if (res.role === 'professor' || res.professor) {
            const prof: Professor = res.professor || {
              id: Number(res.user?.id) || 1,
              employee_id: res.user?.student_id || 'FACULTY',
              full_name: res.user?.full_name || 'Academic Coordinator',
              email: res.user?.email || '',
              department: '',
              role: 'coordinator',
              assigned_section: res.user?.course_section || '',
            };
            // Clear student session so coordinator is never stored or treated as a student
            localStorage.removeItem(SESSION_KEY);
            this.currentUserSubject.next(null);

            // Establish coordinator session immediately
            this.adminService.setAdminSession(prof);
          } else if (res.user) {
            // Student login: clear coordinator session
            localStorage.removeItem(ADMIN_SESSION_KEY);
            this.adminService.logout();

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
    const course = userData.course || 'BSIT';
    const yearLevel = userData.year_level || 4;
    const section = userData.section || 'A';
    const courseSection = userData.course_section || `${course} ${yearLevel}-${section}`;

    const payload = {
      student_id: userData.student_id || userData.student_no,
      full_name: userData.full_name,
      email: userData.email,
      password: userData.password,
      course,
      year_level: yearLevel,
      section,
      course_section: courseSection,
      school_campus: userData.school_campus || 'NEUST - Sumacab Campus',
      company_name: userData.company_name,
      company_address: userData.company_address || '',
      trainer_name: userData.trainer_name || '',
      adviser_name: userData.adviser_name,
      adviser_email: userData.adviser_email || '',
      start_date: userData.start_date || '',
      target_date: userData.target_date || '',
      required_hours: userData.required_hours !== undefined && userData.required_hours !== null && userData.required_hours !== '' ? Number(userData.required_hours) : 0,
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
   * Fetch coordinator assigned to a specific section and program
   */
  getCoordinatorForSection(section: string, course?: string, college?: string, yearLevel?: number, campus?: string): Observable<{ success: boolean; found: boolean; coordinator: any; canonical_section?: string; course_code?: string; department?: string; campus?: string }> {
    let url = `${this.apiUrl}/coordinators.php?section=${encodeURIComponent(section)}`;
    if (course) url += `&course=${encodeURIComponent(course)}`;
    if (college) url += `&college=${encodeURIComponent(college)}`;
    if (yearLevel) url += `&year_level=${encodeURIComponent(yearLevel)}`;
    if (campus) url += `&campus=${encodeURIComponent(campus)}`;
    return this.http.get<{ success: boolean; found: boolean; coordinator: any; canonical_section?: string; course_code?: string; department?: string; campus?: string }>(url).pipe(
      catchError(() => of({ success: false, found: false, coordinator: null }))
    );
  }

  /**
   * Fetch all section coordinators
   */
  getCoordinators(): Observable<{ success: boolean; count: number; coordinators: any[] }> {
    return this.http.get<{ success: boolean; count: number; coordinators: any[] }>(
      `${this.apiUrl}/coordinators.php`
    ).pipe(
      catchError(() => of({ success: false, count: 0, coordinators: [] }))
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

  /**
   * Change account password (student or coordinator)
   */
  changePassword(payload: {
    user_id: number;
    role?: string;
    current_password?: string;
    new_password: string;
    confirm_password?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/change_password.php`, payload)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.message || 'Unable to update password. Please check your network connection.';
          return of({ success: false, message: msg });
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
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(KEEP_SIGNED_IN_KEY);
    this.currentUserSubject.next(null);
    this.adminService.logout();
  }

  public isAdminLoggedIn(): boolean {
    return this.adminService.isAdminLoggedIn();
  }

  public isKeepSignedIn(): boolean {
    return localStorage.getItem(KEEP_SIGNED_IN_KEY) !== 'false';
  }

  public shouldAutoLogin(): boolean {
    return (this.isLoggedIn() || this.isAdminLoggedIn()) && this.isKeepSignedIn();
  }

  public getSavedIdentifier(): string {
    return localStorage.getItem(SAVED_IDENTIFIER_KEY) || '';
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
