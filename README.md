# OnTrack — OJT Tracking & Monitoring Mobile App

OnTrack is a cross-platform mobile application built with **Ionic 9**, **Angular 22**, and **Capacitor 8** for On-the-Job Training (OJT) students and academic coordinators. It replaces manual Daily Time Records (DTR) with mobile attendance logging, GPS verification, photographic proof of duty, task tracking, and coordinator-ready reports.

---

## API Endpoints
- **Default Backend API:** `https://ontrack-api.x10.network/ontrack-api/api` 
- **Students API Endpoints:** `https://ontrack-api.x10.network/ontrack-api/api/students.php` 
- **Backend API Repository:** [reinieltalplacido/ontrack-api](https://github.com/reinieltalplacido/ontrack-api)


### Switching Backend Server URL (Optional)

The APK connects to the live hosted API (`https://ontrack-api.x10.network/ontrack-api/api`) by default, so no local server setup is required to use the app.

If you need to point the app to a custom/local API server during development:

1. Open the **Login** screen and attempt to sign in (or tap the **OnTrack** logo at the top).
2. If the login fails or cannot reach the server, tap the error banner (**"Tap to configure server IP for mobile APK"**).
3. Enter your custom/local API base URL (e.g., `http://<YOUR_LOCAL_IP>/ontrack-api/api`) and tap **Save**, or choose **Reset Default** to return to the live API.

---

## Application Features & Routes

- **Onboarding & Authentication (`/landing`, `/login`, `/register`)**
  - Role-based sign-in for both students (Student No. or email) and academic coordinators/professors (Employee ID or email).
  - Multi-step student registration with campus/program/section selection and automatic coordinator assignment.
- **Student Dashboard (`/home`)**
  - Displays rendered hours, required hours progress, days remaining toward your target date, and quick clock-in / clock-out controls.
- **Time Logs / DTR (`/timelogs`)**
  - View daily attendance logs with GPS coordinates, uploaded verification photos, and total rendered hours.
- **Tasks (`/tasks`)**
  - Track pending, in-progress, and completed deliverables as well as coordinator-assigned tasks.
- **Reports (`/reports`)**
  - Generate Weekly or Cumulative **Daily Time Record (DTR)** and **Accomplishment Summary** drafts, preview/print reports, or submit reports and uploaded documents to your coordinator.
- **Profile (`/profile`)**
  - Review and update student/OJT placement information, required hours, OJT start/target dates, and account password.
- **Coordinator Dashboard (`/admin/dashboard`)**
  - Monitor student progress, inspect live attendance feeds with GPS & photo proof, assign/verify tasks, and review or approve submitted student reports.

---

## Local Development Setup

### Prerequisites

- **Node.js & npm** (LTS recommended for Ionic/Angular CLI tooling)
- **Ionic CLI** (`npm install -g @ionic/cli`)
- **Android Studio / Android SDK & JDK** (required for running on an emulator/device or rebuilding `ontrack.apk`)
- **XAMPP (Apache + MySQL)** _(Optional — only needed if running your own local copy of the backend API instead of the hosted server)_

### 1. Clone the Project

```bash
git clone https://github.com/reinieltalplacido/ontrack.git
cd ontrack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Backend API

- **Hosted API (Default):** No local PHP or MySQL setup is required — the app points to the live server (`https://ontrack-api.x10.network/ontrack-api/api`) by default.
- **Optional Local XAMPP Backend:**
  1. Clone the backend repository [`reinieltalplacido/ontrack-api`](https://github.com/reinieltalplacido/ontrack-api) into `C:/xampp/htdocs/ontrack-api`.
  2. Start **Apache** and **MySQL** in XAMPP, then import the database SQL schema via **phpMyAdmin** (`http://localhost/phpmyadmin`).
  3. If the app cannot reach the default host or you want to target your LAN XAMPP server (`http://<YOUR_LOCAL_IP>/ontrack-api/api`), attempt login to trigger the failed-request prompt and configure your custom API base URL there (or update `src/environments/environment.ts`).

### 4. Run the App Locally in Browser

```bash
ionic serve
```

_(Runs on `http://localhost:4200`. You can also run `npm start` if `@ionic/cli` is not installed globally.)_

### 5. Run on Android (Emulator or Physical Device)

```bash
ionic build
npx cap sync android
npx cap open android
```

From Android Studio, select an emulator or USB-debugging Android device and click **Run**. Grant **Camera** and **Location (GPS)** permissions when prompted for attendance verification.

### 6. First-Time Account Setup

1. Launch the app and tap **Log In**.
2. Tap **Create Student Account** to complete the 3-step student registration wizard (Academic Details, Company & Coordinator Assignment, and Password) — or sign in using an existing student/coordinator account.

### 7. Automated Tests

```bash
npm run test:unit   # Vitest unit tests (services, utilities, and dashboard GPS/goal logic)
npm run test:e2e    # Playwright Mobile Chrome E2E tests (main student user flow with mocked API/GPS)
```

---

## Rebuilding `ontrack.apk` from Source

1. Build the Ionic app and sync Capacitor assets into Android:
   ```bash
   ionic build
   npx cap sync android
   ```
2. Build the debug APK with Gradle (or open in Android Studio with `npx cap open android`):
   ```powershell
   .\android\gradlew.bat -p android assembleDebug
   ```
3. Copy the generated APK from `android/app/build/outputs/apk/debug/app-debug.apk` to `ontrack.apk` if updating the root file:
   ```powershell
   Copy-Item .\android\app\build\outputs\apk\debug\app-debug.apk .\ontrack.apk -Force
   ```

---

## Evaluation Accounts

- **Student Account:** `reinieltalplacido529@gmail.com` _(password: Reiniel@22)_
- **Academic Coordinator (`BSIT 4-E` — Prof. Angelito Cunanan Jr.):** `angelito.cunanan@neust.edu.ph` or Employee ID `PROF-2026-005` _(password: Password123!)_

---

## Developed By

- Princess Lyka S. Santos
- Jorald Allen M. Sevilla
- Reiniel Anjelo T. Talplacido
- Mark Lennard L. Torres
