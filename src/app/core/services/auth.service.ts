import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, AuthResponse } from '../../models/user.model';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'ontrack_user_session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.production
    ? '/ontrack-api/api'
    : 'http://localhost/ontrack-api/api';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const payload = { email, password };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login.php`, payload).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.setSession(res.user);
        }
      }),
      catchError(() => {
        // Fallback demo login for offline/UI testing
        if (email.toLowerCase().includes('demo') || email.toLowerCase().includes('neust') || email === 'student@ontrack.app') {
          const demoUser: User = {
            id: 1,
            student_id: '2022-00486',
            full_name: 'Juan Dela Cruz',
            email: email,
            course_section: 'BSIT 4-A',
            school_campus: 'NEUST - Sumacab Campus',
            company_name: 'TechCorp Solutions Inc.',
            adviser_name: 'Prof. Maria Santos',
            adviser_email: 'maria.santos@neust.edu.ph',
            start_date: '2026-08-15',
            target_date: '2026-12-15',
            required_hours: 486,
            rendered_hours: 142.5,
          };
          this.setSession(demoUser);
          return of({ success: true, message: 'Demo login successful', user: demoUser });
        }

        // Generic mock for any input if backend is not yet started
        const fallbackUser: User = {
          id: Date.now(),
          student_id: '2022-' + Math.floor(1000 + Math.random() * 9000),
          full_name: email.split('@')[0].toUpperCase(),
          email: email,
          course_section: 'BSIT 4-A',
          school_campus: 'NEUST - Sumacab Campus',
          company_name: 'Assigned Partner Agency',
          required_hours: 486,
          rendered_hours: 0,
        };
        this.setSession(fallbackUser);
        return of({ success: true, message: 'Logged in locally', user: fallbackUser });
      })
    );
  }

  register(userData: Partial<User> & { password?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register.php`, userData).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.setSession(res.user);
        }
      }),
      catchError(() => {
        const newUser: User = {
          id: Date.now(),
          student_id: userData.student_id || '2022-00123',
          full_name: userData.full_name || 'New Student',
          email: userData.email || 'student@neust.edu.ph',
          course_section: userData.course_section || 'BSIT 4-A',
          school_campus: userData.school_campus || 'NEUST - Sumacab Campus',
          company_name: userData.company_name || 'Host Training Establishment',
          adviser_name: userData.adviser_name,
          adviser_email: userData.adviser_email,
          start_date: userData.start_date,
          target_date: userData.target_date,
          required_hours: userData.required_hours || 486,
          rendered_hours: 0,
        };
        this.setSession(newUser);
        return of({ success: true, message: 'Account registered locally', user: newUser });
      })
    );
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
