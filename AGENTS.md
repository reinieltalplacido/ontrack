# OnTrack: OJT Tracking and Monitoring Mobile Application

## 1. Project Overview & Context
**OnTrack** is a cross-platform mobile application built using **Ionic, Angular, and Capacitor**, paired with a **XAMPP (PHP + MySQL)** backend. Originally adapted from the web-based OJT monitoring portal, it is designed for college students undergoing On-the-Job Training (OJT) / internships to effortlessly record their daily attendance, verify their workplace location, capture photographic proof of duty, track required rendering hours, and manage supervisor-assigned tasks.

This project fulfills the requirements of the **Mobile Application Technology Final Case Study**:
- **Problem Solved**: Replaces prone-to-fraud manual paper Daily Time Records (DTR) and unorganized task logs with a mobile-first solution featuring automated hour computation, geolocation verification, and image proof.
- **Target Users**: Interns/OJT Students, Industry Supervisors, and Academic OJT Coordinators.

---

## 2. Technology Stack & Architecture

### Frontend (Mobile App)
- **Framework**: Ionic 9.x + Angular 22 (Standalone Components)
- **Runtime/Bridge**: Capacitor 8.x
- **Styling**: SCSS, Ionic Design System (`#547792` primary branding, clean card layouts)
- **Mobile Capabilities (Capacitor Plugins)**:
  - `@capacitor/geolocation` & **Leaflet** (Workplace coordinates verification)
  - `@capacitor/camera` (Attendance selfie / proof-of-work photo upload)
  - `@capacitor/haptics` (Tactile feedback on time in / time out and actions)
  - `@capacitor/status-bar` & `@capacitor/keyboard` (Native UX polish)
- **State & Data Handling**: Angular `HttpClient` with RxJS observables

### Backend & Database (XAMPP)
- **Web Server**: Apache (XAMPP)
- **Backend Language**: PHP 8.x (RESTful JSON API with PDO, prepared statements, and CORS headers)
- **Database**: MySQL (`ontrack_db`)
- **Base API URL**:
  - Browser testing: `http://localhost/ontrack-api/`
  - Android Emulator: `http://10.0.2.2/ontrack-api/`
  - Physical Android Device (LAN): `http://<YOUR_LOCAL_IP>/ontrack-api/`

---

## 3. Database Schema (`ionic_students_api` / `ontrack_db`)

### `professors` (Admin & Academic Supervisors)
| Column | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | Unique professor ID |
| `employee_id` | VARCHAR(50) UNIQUE | Faculty ID (e.g. PROF-2026-001) |
| `full_name` | VARCHAR(150) | Full professor / coordinator name |
| `email` | VARCHAR(100) UNIQUE | Institutional email address |
| `password` | VARCHAR(255) | BCrypt hashed password |
| `department` | VARCHAR(150) | Academic department |
| `role` | ENUM('admin', 'coordinator', 'adviser') | Permission level |
| `assigned_section` | VARCHAR(100) | Handled section (e.g. BSIT 4-A) |
| `contact_number` | VARCHAR(50) NULL | Contact details |
| `created_at` | TIMESTAMP | Registration timestamp |

### `students`
| Column | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | Unique student ID |
| `professor_id` | INT NULL (FK -> professors.id) | Assigned professor / coordinator reference |
| `student_no` | VARCHAR(50) UNIQUE | School student ID (e.g. 2026-0001) |
| `full_name` | VARCHAR(150) | Full student name |
| `email` | VARCHAR(100) | Email address |
| `password` | VARCHAR(255) | Hashed password |
| `course_section` | VARCHAR(100) | Course and section (e.g. BSIT 4-A) |
| `company_name` | VARCHAR(150) | Assigned company / agency name |
| `required_hours` | INT DEFAULT 486 | Target rendering hours (e.g. 486 or 500) |
| `target_date` | DATE | Expected completion date |
| `created_at` | TIMESTAMP | Registration timestamp |

### `attendance_logs`
| Column | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | Unique log ID |
| `user_id` | INT (FK -> users.id) | Student reference |
| `log_date` | DATE | Date of attendance |
| `time_in` | TIME | Clock in time |
| `time_out` | TIME NULL | Clock out time |
| `total_hours` | DECIMAL(5,2) DEFAULT 0 | Computed hours rendered for the day |
| `latitude` | DECIMAL(10,8) NULL | GPS latitude coordinate captured on check-in |
| `longitude` | DECIMAL(11,8) NULL | GPS longitude coordinate captured on check-in |
| `photo_url` | VARCHAR(255) NULL | Relative path to uploaded verification photo |
| `activity_notes` | TEXT NULL | Summary of accomplishments/tasks done |
| `status` | ENUM('ongoing', 'completed') | Current attendance status |

### `tasks`
| Column | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | Unique task ID |
| `user_id` | INT (FK -> users.id) | Student reference |
| `title` | VARCHAR(150) | Task title |
| `description` | TEXT NULL | Task details / instructions |
| `deadline` | DATE NULL | Target completion deadline |
| `status` | ENUM('pending', 'in_progress', 'completed') | Current task status |
| `created_at` | TIMESTAMP | Task creation date |

---

## 4. Backend REST API Endpoints (`/backend/` or `htdocs/ontrack-api/`)

All requests accept and return `application/json` (or `multipart/form-data` for photo uploads).

- **Authentication**:
  - `POST /api/auth/register.php` — Student registration
  - `POST /api/auth/login.php` — Student login (returns student profile & session token/data)
- **Dashboard & Stats**:
  - `GET /api/dashboard/stats.php?user_id={id}` — Computes:
    - Accumulated hours
    - Required hours
    - Progress percentage
    - Days remaining until target date
    - Today's active log status (if already clocked in)
- **Attendance & DTR**:
  - `POST /api/attendance/clock_in.php` — Time-in with GPS coords, photo, and timestamp
  - `POST /api/attendance/clock_out.php` — Time-out with activity notes; auto-computes rendered hours
  - `GET /api/attendance/history.php?user_id={id}` — List of all past attendance entries
- **Task Management**:
  - `GET /api/tasks/list.php?user_id={id}` — Retrieve list of tasks
  - `POST /api/tasks/create.php` — Add a new task
  - `POST /api/tasks/update_status.php` — Mark task as pending / completed

- **Admin & Professor Oversight**:
  - `POST /api/admin/auth/login.php` — Professor login (returns professor profile & token)
  - `POST /api/admin/auth/register.php` — Register new professor / coordinator
  - `GET /api/admin/dashboard/stats.php` — System-wide stats (total interns, active duty, total hours, recent check-ins)
  - `GET /api/admin/students/list.php` — List all monitored students with rendered hours & duty status
  - `GET /api/admin/students/detail.php?id={id}` — Full student DTR history, accomplishments, and tasks
  - `GET /api/admin/attendance/list.php` — Live feed of all attendance logs with GPS coordinates & selfie proof
  - `POST /api/admin/tasks/assign.php` — Assign tasks to individual student or broadcast to section

---

## 5. Mobile Features & Course Outcomes Alignment

1. **Course Outcome 1 (Fundamental Concepts)**:
   - Modular Angular architecture with typed services, route guards, environment configs, and responsive Ionic UI.
2. **Course Outcome 2 (Device Capabilities Integration)**:
   - **Geolocation & Leaflet Map**: Validates and visually displays current duty coordinates.
   - **Camera Plugin**: Allows taking an instant selfie or photo of daily proof.
   - **Haptics**: Tactile feedback upon clocking in/out.
3. **Course Outcome 3 (Data Management & API Integration)**:
   - Angular `HttpClient` performing GET/POST requests with standard error handling, local storage caching for offline resilience, and JSON communication with the XAMPP MySQL backend.
4. **Course Outcome 4 (Usability, Heuristics & Evaluation)**:
   - Clean visual hierarchy, informative empty/loading states, responsive touch controls, and accessible contrast ratios.

---

## 6. Project Directory Structure
```text
ontrack/
├── AGENTS.md                  # This specification and architectural guideline
├── backend/                   # XAMPP PHP REST API & Database Scripts
│   ├── config/
│   │   └── database.php       # PDO connection & CORS headers
│   ├── api/
│   │   ├── auth/              # login.php, register.php
│   │   ├── attendance/        # clock_in.php, clock_out.php, history.php
│   │   ├── dashboard/         # stats.php
│   │   └── tasks/             # list.php, create.php, update.php
│   ├── uploads/               # Uploaded selfie / accomplishment photos
│   └── ontrack_db.sql         # Database schema & sample seed data
├── src/
│   ├── app/
│   │   ├── core/              # Services (api.service.ts, auth.service.ts, native.service.ts)
│   │   ├── models/            # TypeScript interfaces (user.model.ts, log.model.ts, etc.)
│   │   ├── pages/
│   │   │   ├── login/         # Login screen
│   │   │   ├── register/      # Registration screen
│   │   │   ├── dashboard/     # Summary cards, quick clock-in/out, progress ring
│   │   │   ├── attendance/    # DTR history & detailed log entry with Map & Camera
│   │   │   ├── tasks/         # Task management list & modal
│   │   │   └── profile/       # Student info, required hours settings
│   │   └── app.routes.ts      # Navigation routes
│   └── environments/          # Configurable API base URLs
```

---

## 7. Development & Verification Workflow

### Running the XAMPP Backend
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Import `backend/ontrack_db.sql` into phpMyAdmin (`http://localhost/phpmyadmin`).
3. Copy or symlink `backend/` to `C:/xampp/htdocs/ontrack-api`.

### Running the Ionic Application
1. Start dev server: `npm start` (Runs on `http://localhost:4200`)
2. Run on Android device / emulator:
   ```powershell
   npm run build
   npx cap sync android
   npx cap open android
   ```

