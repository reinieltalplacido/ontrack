import { expect, Page, Route, test } from '@playwright/test';

interface GeoMockState {
  mode: 'deny' | 'allow';
  latitude: number;
  longitude: number;
}

declare global {
  interface Window {
    __ontrackGeoMock?: GeoMockState;
  }
}

const TEST_STUDENT = {
  id: 99,
  student_id: 'SUM2023-00712',
  full_name: 'REINIEL ANJELO TALPLACIDO',
  email: 'reiniel@neust.edu.ph',
  course_section: 'BSIT 4-E',
  school_campus: 'NEUST - Sumacab Campus',
  company_name: 'ProjectSolo',
  company_address: 'Cabanatuan City, Nueva Ecija',
  trainer_name: 'Engr. Supervisor',
  adviser_name: 'Prof. Angelito Cunanan Jr.',
  adviser_email: 'angelito.cunanan@neust.edu.ph',
  start_date: '2026-10-01',
  target_date: '2099-12-31',
  required_hours: 500,
};

const TEST_COORDINATOR = {
  id: 5,
  employee_id: 'PROF-2026-005',
  full_name: 'Prof. Angelito Cunanan Jr.',
  email: 'angelito.cunanan@neust.edu.ph',
  department: 'College of Information and Communications Technology',
  campus: 'NEUST - Sumacab Campus',
  role: 'coordinator',
  assigned_section: 'BSIT 4-E',
};

interface MockApiState {
  isClockedIn: boolean;
  failNextTaskUpdate: boolean;
  clockInPayloads: Array<{ latitude: number | null; longitude: number | null; location_name?: string }>;
  tasks: Array<{
    id: number;
    user_id: number;
    title: string;
    description: string;
    deadline: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    proof_url?: string | null;
    proof_file?: string | null;
    created_at: string;
  }>;
  logs: Array<{
    id: number;
    log_date: string;
    time_in: string;
    time_out: string | null;
    total_hours: number;
    latitude: number | null;
    longitude: number | null;
    location_name?: string;
    activity_notes?: string;
    status: 'ongoing' | 'completed';
  }>;
}

async function setupMockBackend(page: Page): Promise<MockApiState> {
  const state: MockApiState = {
    isClockedIn: false,
    failNextTaskUpdate: false,
    clockInPayloads: [],
    tasks: [],
    logs: [],
  };

  await page.route('**/nominatim.openstreetmap.org/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        address: {
          suburb: 'Sumacab Este',
          city: 'Cabanatuan City',
        },
        display_name: 'Sumacab Este, Cabanatuan City, Nueva Ecija',
      }),
    });
  });

  await page.route('**/ontrack-api/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path.endsWith('/coordinators.php')) {
      if (url.searchParams.has('section')) {
        return json({
          success: true,
          found: true,
          canonical_section: 'BSIT 4-A',
          coordinator: {
            id: 5,
            full_name: 'Prof. Angelito Cunanan Jr.',
            email: 'angelito.cunanan@neust.edu.ph',
            assigned_section: 'BSIT 4-A',
            campus: 'NEUST - Sumacab Campus',
          },
        });
      }
      return json({
        success: true,
        count: 1,
        coordinators: [
          {
            id: 5,
            full_name: 'Prof. Angelito Cunanan Jr.',
            email: 'angelito.cunanan@neust.edu.ph',
            assigned_section: 'BSIT 4-A',
          },
        ],
      });
    }

    if (path.endsWith('/auth/login.php')) {
      const creds = request.postDataJSON() as { email?: string };
      if (creds?.email?.toLowerCase() === TEST_COORDINATOR.email) {
        return json({
          success: true,
          role: 'professor',
          token: 'mock-coord-token',
          professor: TEST_COORDINATOR,
        });
      }
      return json({
        success: true,
        role: 'student',
        token: 'mock-session-token',
        user: TEST_STUDENT,
      });
    }

    if (path.endsWith('/admin/dashboard/stats.php')) {
      return json({
        success: true,
        stats: {
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
        },
        recent_activities: [],
      });
    }

    if (path.endsWith('/admin/students/list.php')) {
      return json({ success: true, count: 0, students: [] });
    }

    if (path.endsWith('/admin/attendance/list.php')) {
      return json({ success: true, count: 0, logs: [] });
    }

    if (path.endsWith('/admin/tasks/list.php')) {
      return json({ success: true, count: 0, tasks: [] });
    }

    if (path.endsWith('/admin/reports/list.php')) {
      return json({
        success: true,
        count: 0,
        stats: {
          total: 0,
          time_log: 0,
          summary: 0,
          submitted: 2,
          reviewed: 0,
          approved: 0,
        },
        reports: [],
      });
    }

    if (path.endsWith('/auth/change_password.php')) {
      return json({
        success: true,
        message: 'Password updated successfully.',
      });
    }

    if (path.endsWith('/dashboard/stats.php')) {
      const todayLog = state.logs[0] ?? null;
      return json({
        success: true,
        stats: {
          accumulated_hours: state.logs.reduce((sum, l) => sum + Number(l.total_hours || 0), 0),
          required_hours: TEST_STUDENT.required_hours,
          remaining_hours: TEST_STUDENT.required_hours,
          completion_percent: 0,
          days_remaining: 45,
          total_days_logged: state.logs.length,
          is_clocked_in: state.isClockedIn,
          pending_tasks: state.tasks.filter((t) => t.status === 'pending').length,
          completed_tasks: state.tasks.filter((t) => t.status === 'completed').length,
          today_log: todayLog,
        },
      });
    }

    if (path.endsWith('/attendance/history.php')) {
      return json({
        success: true,
        count: state.logs.length,
        total_hours: state.logs.reduce((sum, l) => sum + Number(l.total_hours || 0), 0),
        logs: state.logs,
      });
    }

    if (path.endsWith('/attendance/clock_in.php')) {
      const payload = request.postDataJSON() as {
        latitude: number | null;
        longitude: number | null;
        location_name?: string;
      };
      state.clockInPayloads.push(payload);
      state.isClockedIn = true;

      const newLog = {
        id: state.logs.length + 1,
        log_date: new Date().toISOString().slice(0, 10),
        time_in: '08:00:00',
        time_out: null,
        total_hours: 0,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        location_name: payload.location_name,
        status: 'ongoing' as const,
      };
      state.logs = [newLog, ...state.logs];

      return json({
        success: true,
        message: 'Time-in recorded successfully.',
        log: newLog,
      });
    }

    if (path.endsWith('/tasks/list.php')) {
      return json({
        success: true,
        tasks: state.tasks,
      });
    }

    if (path.endsWith('/tasks/create.php')) {
      const body = request.postDataJSON() as {
        user_id: number;
        title: string;
        description?: string;
        deadline?: string;
        priority?: 'low' | 'medium' | 'high';
      };
      const newTask = {
        id: state.tasks.length + 101,
        user_id: body.user_id,
        title: body.title,
        description: body.description ?? '',
        deadline: body.deadline ?? '2099-12-31',
        priority: body.priority ?? 'medium',
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };
      state.tasks = [newTask, ...state.tasks];
      return json({
        success: true,
        message: 'Task created successfully.',
        task: newTask,
      });
    }

    if (path.endsWith('/tasks/update.php')) {
      if (state.failNextTaskUpdate) {
        state.failNextTaskUpdate = false;
        return json({ success: false, message: 'Server upload failed.' }, 500);
      }

      const body = request.postDataJSON() as {
        task_id: number;
        status?: 'pending' | 'in_progress' | 'completed';
        proof_image?: string;
        proof_file_name?: string;
        proof_url?: string | null;
        proof_file?: string | null;
      };
      const target = state.tasks.find((t) => t.id === body.task_id);
      if (!target) {
        return json({ success: false, message: 'Task not found.' }, 404);
      }

      if (body.status) target.status = body.status;
      if (body.proof_url !== undefined) target.proof_url = body.proof_url;
      if (body.proof_file !== undefined) target.proof_file = body.proof_file;
      if (body.proof_image) {
        target.proof_url = body.proof_image;
        target.proof_file = body.proof_file_name || 'uploaded_proof.png';
      }

      return json({
        success: true,
        message: 'Task updated successfully.',
        task: { ...target },
      });
    }

    if (path.endsWith('/reports/list.php')) {
      return json({
        success: true,
        count: 0,
        reports: [],
      });
    }

    return json({ success: false, message: `Unmocked endpoint: ${path}` }, 404);
  });

  return state;
}

async function installGeolocationMock(page: Page, initialMode: 'deny' | 'allow' = 'deny') {
  await page.addInitScript((mode: 'deny' | 'allow') => {
    window.__ontrackGeoMock = {
      mode,
      latitude: 15.4895,
      longitude: 120.9742,
    };

    const mockGeolocation = {
      getCurrentPosition(success: PositionCallback, error?: PositionErrorCallback) {
        const cfg = window.__ontrackGeoMock ?? { mode: 'deny', latitude: 15.4895, longitude: 120.9742 };
        if (cfg.mode === 'deny') {
          error?.({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
          return;
        }

        const coords: GeolocationCoordinates = {
          latitude: cfg.latitude,
          longitude: cfg.longitude,
          accuracy: 12,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON() {
            return { latitude: this.latitude, longitude: this.longitude, accuracy: this.accuracy };
          },
        };
        success({
          timestamp: Date.now(),
          coords,
          toJSON() {
            return { timestamp: this.timestamp, coords: coords.toJSON() };
          },
        } as GeolocationPosition);
      },
      watchPosition() {
        return 1;
      },
      clearWatch() {},
    };

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: mockGeolocation,
    });
  }, initialMode);
}

async function signInAsStudent(page: Page) {
  await page.goto('/login');
  const loginPage = page.locator('app-login');
  await loginPage.locator('#email').fill(TEST_STUDENT.email);
  await loginPage.locator('#password').fill('Secret123!');
  await loginPage.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/home$/);
}

async function openDrawerAndNavigate(page: Page, activePageSelector: string, label: string) {
  const activePage = page.locator(activePageSelector);
  await activePage.getByRole('button', { name: 'Open menu' }).click();
  await activePage.locator('.side-drawer .nav-item', { hasText: label }).click();
}

test.describe('OnTrack Student Core User Flow', () => {
  test('navigates Landing -> Login (no Forgot? link) -> Registration wizard', async ({ page }) => {
    await setupMockBackend(page);

    await page.goto('/');
    await expect(page).toHaveURL(/\/landing$/);
    await page.getByRole('button', { name: /Log In/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    const loginPage = page.locator('app-login');
    await expect(loginPage.locator('#email')).toBeVisible();
    await expect(loginPage.locator('#password')).toBeVisible();
    await expect(loginPage.getByText('Forgot?', { exact: false })).toHaveCount(0);

    await loginPage.getByRole('button', { name: /Create Student Account/i }).click();
    await expect(page).toHaveURL(/\/register$/);

    const registerPage = page.locator('app-register');

    // Validation blocks Next Step when Step 1 required inputs are empty
    await registerPage.getByRole('button', { name: /Next Step/i }).click();
    await expect(registerPage.locator('#student_no')).toBeVisible();

    // Fill Step 1 and advance to Step 2 with auto-loaded adviser
    await registerPage.locator('#student_no').fill(TEST_STUDENT.student_id);
    await registerPage.locator('#full_name').fill('reiniel talplacido');
    await registerPage.locator('#email').fill(TEST_STUDENT.email);
    await registerPage.getByRole('button', { name: /Next Step/i }).click();

    await expect(registerPage.locator('#company_name')).toBeVisible();
    await expect(registerPage.locator('#adviser_name')).toHaveValue('Prof. Angelito Cunanan Jr.');
  });

  test('alerts user on GPS denial during Time-In and captures real GPS on Refresh', async ({ page }) => {
    const apiState = await setupMockBackend(page);
    await installGeolocationMock(page, 'deny');

    await signInAsStudent(page);

    // Open Clock-In Modal while GPS is denied
    await page
      .locator('app-home')
      .getByRole('button', { name: /Time In \(GPS\)/i })
      .click();

    const warningBanner = page.locator('.gps-warning-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText(/Location permission denied/i);
    await expect(page.locator('.modal-card-block')).toContainText('ProjectSolo (GPS Unavailable)');

    // Enable live GPS and tap Refresh
    await page.evaluate(() => {
      if (window.__ontrackGeoMock) {
        window.__ontrackGeoMock.mode = 'allow';
      }
    });
    await page.getByRole('button', { name: /^Refresh$/i }).click();

    await expect(warningBanner).toBeHidden();
    await expect(page.locator('.modal-card-block')).toContainText('GPS Verified');
    await expect(page.locator('.modal-card-block')).not.toContainText('15.4895');

    // Submit Clock-In with live coordinates
    await page.getByRole('button', { name: /Confirm Time-In/i }).click();

    await expect.poll(() => apiState.clockInPayloads.length).toBe(1);
    expect(apiState.clockInPayloads[0].latitude).toBe(15.4895);
    expect(apiState.clockInPayloads[0].longitude).toBe(120.9742);
    await expect(page.getByRole('button', { name: /Confirm Time-In/i })).toBeHidden();
  });

  test('creates a task and accesses Time Logs, Reports (clean empty state), and Profile password settings', async ({
    page,
  }) => {
    await setupMockBackend(page);
    await installGeolocationMock(page, 'allow');

    await signInAsStudent(page);

    // Navigate to Tasks via side drawer
    await openDrawerAndNavigate(page, 'app-home', 'Tasks');
    await expect(page).toHaveURL(/\/tasks$/);

    // Create a new task
    const tasksPage = page.locator('app-tasks');
    await tasksPage.getByRole('button', { name: /New Task/i }).click();
    await page.locator('#task-title').fill('Prepare Weekly DTR Narrative');
    await page.locator('#task-desc').fill('Compile screenshots and daily activity summary.');
    await page.locator('#task-deadline').fill('2099-12-15');
    await page.getByRole('button', { name: /Add Task/i }).click();

    await expect(tasksPage.getByText('Prepare Weekly DTR Narrative')).toBeVisible();

    // Navigate to Time Logs
    await openDrawerAndNavigate(page, 'app-tasks', 'Time Logs');
    await expect(page).toHaveURL(/\/timelogs$/);
    await expect(page.locator('app-timelogs').getByRole('heading', { name: 'Time Logs' })).toBeVisible();

    // Navigate to Reports and verify clean empty generated reports state
    await openDrawerAndNavigate(page, 'app-timelogs', 'Reports');
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.locator('app-reports').getByText('No generated reports available.')).toBeVisible();

    // Navigate to Profile and open working Change Password modal
    await openDrawerAndNavigate(page, 'app-reports', 'Profile');
    await expect(page).toHaveURL(/\/profile$/);

    await page.locator('app-profile .change-pwd-btn').click();
    await expect(page.locator('.change-password-modal h3')).toHaveText('Change Password');
    await expect(page.getByPlaceholder('Enter current password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();
  });

  test('renders Coordinator Reports filter chips without right-edge clipping on mobile viewports', async ({ page }) => {
    await setupMockBackend(page);
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/login');
    const loginPage = page.locator('app-login');
    await loginPage.locator('#email').fill(TEST_COORDINATOR.email);
    await loginPage.locator('#password').fill('Secret123!');
    await loginPage.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    const adminPage = page.locator('app-admin-dashboard');
    await adminPage
      .locator('.quick-actions-bar')
      .getByRole('button', { name: /Student Reports/i })
      .click();

    const filterBar = adminPage.locator('.reports-filter-bar');
    const approvedChip = filterBar.locator('.filter-chip.approved');
    await expect(approvedChip).toBeVisible();

    const barBox = await filterBar.boundingBox();
    expect(barBox).not.toBeNull();

    const chips = filterBar.locator('.filter-chip');
    const chipCount = await chips.count();
    expect(chipCount).toBe(7);

    for (let i = 0; i < chipCount; i++) {
      const chipBox = await chips.nth(i).boundingBox();
      expect(chipBox).not.toBeNull();
      expect(chipBox!.x).toBeGreaterThanOrEqual(barBox!.x);
      expect(chipBox!.x + chipBox!.width).toBeLessThanOrEqual(barBox!.x + barBox!.width);
    }

    await approvedChip.click();
    await expect(approvedChip).toHaveClass(/active/);
  });

  test('persists task proof removal via API and shows an error instead of local fallback when proof upload fails', async ({
    page,
  }) => {
    const apiState = await setupMockBackend(page);
    await installGeolocationMock(page, 'allow');

    await signInAsStudent(page);
    await openDrawerAndNavigate(page, 'app-home', 'Tasks');
    await expect(page).toHaveURL(/\/tasks$/);

    const tasksPage = page.locator('app-tasks');
    await tasksPage.getByRole('button', { name: /New Task/i }).click();
    await page.locator('#task-title').fill('Document Daily Deployment');
    await page.locator('#task-deadline').fill('2099-12-15');
    await page.getByRole('button', { name: /Add Task/i }).click();

    await expect(tasksPage.getByText('Document Daily Deployment')).toBeVisible();

    // Open task details and upload a valid PNG deliverable
    await tasksPage.getByRole('button', { name: 'View task details' }).click();
    const detailModal = page.locator('.task-detail-modal');
    await expect(detailModal).toBeVisible();

    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2Z0AAAAASUVORK5CYII=',
      'base64',
    );
    await detailModal.locator('input[type="file"]').setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    });

    await expect(detailModal.getByText('1 Photo Attached')).toBeVisible();
    expect(apiState.tasks[0].proof_url).toBeTruthy();

    // Remove the attached proof and verify it clears in backend state + stays removed after reload
    await detailModal.locator('button[title="Delete proof"]').click();
    await expect(detailModal.getByText('No Deliverable')).toBeVisible();
    expect(apiState.tasks[0].proof_url).toBe('');

    await page.reload();
    await expect(tasksPage.getByText('Document Daily Deployment')).toBeVisible();
    await expect(tasksPage.locator('.card-proof-badge')).toHaveCount(0);

    // Trigger upload failure and confirm it rejects instead of claiming "saved locally"
    apiState.failNextTaskUpdate = true;
    await tasksPage.getByRole('button', { name: 'View task details' }).click();
    await detailModal.locator('input[type="file"]').setInputFiles({
      name: 'failed_proof.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    });

    await expect(page.getByText('Deliverable proof saved locally.')).toHaveCount(0);
    await expect(detailModal.getByText('No Deliverable')).toBeVisible();
    await expect(page.locator('app-toast').getByText('Server upload failed.')).toBeVisible();
  });
});
