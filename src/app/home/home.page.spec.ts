import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { HomePage } from './home.page';
import { AuthService } from '../core/services/auth.service';
import { AttendanceService } from '../core/services/attendance.service';
import { NativeService } from '../core/services/native.service';
import { ToastService } from '../core/services/toast.service';
import { User } from '../models/user.model';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  const mockUser: User = {
    id: 99,
    student_id: 'SUM2023-00712',
    full_name: 'Test Student',
    email: 'student@neust.edu.ph',
    course_section: 'BSIT 4-E',
    school_campus: 'NEUST - Sumacab Campus',
    company_name: 'Acme Corp',
    adviser_name: 'Prof. Coordinator',
    required_hours: 486,
    target_date: '2099-12-31',
  };

  let authServiceMock: {
    currentUserValue: User | null;
    updateProfile: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  let attendanceServiceMock: {
    getDashboardStats: ReturnType<typeof vi.fn>;
    getAttendanceHistory: ReturnType<typeof vi.fn>;
    clockIn: ReturnType<typeof vi.fn>;
    clockOut: ReturnType<typeof vi.fn>;
  };

  let nativeServiceMock: {
    lastLocationError: string | null;
    hasCachedLocation: boolean;
    lastKnownLocationName: string | null;
    lastKnownCoords: { latitude: number; longitude: number } | null;
    getCurrentPosition: ReturnType<typeof vi.fn>;
    reverseGeocode: ReturnType<typeof vi.fn>;
    triggerHapticFeedback: ReturnType<typeof vi.fn>;
  };

  let toastServiceMock: {
    show: ReturnType<typeof vi.fn>;
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
    showInfo: ReturnType<typeof vi.fn>;
    showWarning: ReturnType<typeof vi.fn>;
  };

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceMock = {
      currentUserValue: { ...mockUser },
      updateProfile: vi.fn().mockReturnValue(of({ success: true, user: mockUser })),
      logout: vi.fn(),
    };

    attendanceServiceMock = {
      getDashboardStats: vi.fn().mockReturnValue(
        of({
          accumulated_hours: 120,
          required_hours: 486,
          remaining_hours: 366,
          completion_percent: 25,
          days_remaining: 45,
          total_days_logged: 15,
          is_clocked_in: false,
          pending_tasks: 2,
          completed_tasks: 1,
          today_log: null,
        })
      ),
      getAttendanceHistory: vi.fn().mockReturnValue(
        of({
          success: true,
          count: 0,
          total_hours: 120,
          logs: [],
        })
      ),
      clockIn: vi.fn().mockReturnValue(of({ success: true, message: 'OK', log: {} })),
      clockOut: vi.fn().mockReturnValue(of({ success: true, message: 'OK', rendered_today: 8, total_accumulated: 128, log: {} })),
    };

    nativeServiceMock = {
      lastLocationError: null,
      hasCachedLocation: false,
      lastKnownLocationName: null,
      lastKnownCoords: null,
      getCurrentPosition: vi.fn().mockResolvedValue({ latitude: 15.49, longitude: 120.97 }),
      reverseGeocode: vi.fn().mockResolvedValue('Cabanatuan City, Nueva Ecija'),
      triggerHapticFeedback: vi.fn().mockResolvedValue(undefined),
    };

    toastServiceMock = {
      show: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showInfo: vi.fn(),
      showWarning: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: AttendanceService, useValue: attendanceServiceMock },
        { provide: NativeService, useValue: nativeServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('should create and load student dashboard stats', () => {
    expect(component).toBeTruthy();
    expect(attendanceServiceMock.getDashboardStats).toHaveBeenCalledWith(mockUser.id);
    expect(component.stats.accumulated_hours).toBe(120);
  });

  it('should redirect to /login when no user session is stored', () => {
    authServiceMock.currentUserValue = null;
    routerMock.navigate.mockClear();

    const guestFixture = TestBed.createComponent(HomePage);
    guestFixture.detectChanges();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    guestFixture.destroy();
  });

  it('should clear coordinates and alert the user when live GPS cannot be acquired', async () => {
    nativeServiceMock.getCurrentPosition.mockResolvedValueOnce(null);
    nativeServiceMock.lastLocationError = 'Location permission denied. Enable GPS access and tap Refresh.';

    component.openClockInModal();

    await vi.waitFor(() => {
      expect(component.isGettingLocation).toBe(false);
    });

    expect(component.showClockInModal).toBe(true);
    expect(component.currentCoords).toBeNull();
    expect(component.locationName).toBe('Acme Corp (GPS Unavailable)');
    expect(component.locationWarning).toBe('Location permission denied. Enable GPS access and tap Refresh.');
    expect(toastServiceMock.showError).toHaveBeenCalledWith(
      'Location permission denied. Enable GPS access and tap Refresh.'
    );
  });

  it('should store live coordinates and reverse-geocoded address when GPS succeeds', async () => {
    nativeServiceMock.getCurrentPosition.mockResolvedValueOnce({ latitude: 15.491234, longitude: 120.971234 });
    nativeServiceMock.reverseGeocode.mockResolvedValueOnce('Sumacab Este, Cabanatuan City');

    component.openClockInModal();

    await vi.waitFor(() => {
      expect(component.isGettingLocation).toBe(false);
    });

    expect(component.currentCoords).toEqual({ latitude: 15.491234, longitude: 120.971234 });
    expect(component.locationName).toBe('Sumacab Este, Cabanatuan City');
    expect(component.locationWarning).toBe('');
    expect(toastServiceMock.showError).not.toHaveBeenCalled();
  });

  it('should reject past target dates when saving goal settings', () => {
    component.editRequiredHours = 500;
    component.editTargetDate = '2020-01-01';

    component.saveGoalSettings();

    expect(component.feedbackType).toBe('error');
    expect(component.feedbackMessage).toBe(
      'Target completion date cannot be in the past or earlier than your start date.'
    );
    expect(toastServiceMock.show).toHaveBeenCalledWith(
      'Target completion date cannot be in the past or earlier than your start date.',
      'error'
    );
  });
});
