# OnTrack — OJT Tracking & Monitoring Mobile App

OnTrack is a cross-platform mobile application built with **Ionic 9**, **Angular 22**, and **Capacitor 8** for On-the-Job Training (OJT) students and academic coordinators. It replaces manual Daily Time Records (DTR) with mobile attendance logging, GPS verification, photographic proof of duty, task tracking, and coordinator-ready reports.

---

## Install Prebuilt Android APK (`ontrack.apk`)

The ready-to-install Android debug APK is included in the repository root as [`ontrack.apk`](./ontrack.apk).

- **Package / App ID:** `com.ontrack.app`
- **Minimum Android Version:** Android 7.0 (`minSdkVersion 24`)
- **Target SDK:** Android API `36` (`targetSdkVersion 36`)
- **Default Backend API:** `https://ontrack-api.x10.network/ontrack-api/api`

### Install Directly on an Android Device

1. Download or transfer [`ontrack.apk`](./ontrack.apk) to your Android phone.
2. Tap `ontrack.apk` in your phone's file manager and allow **Install unknown apps** for your browser or file manager if prompted.
3. Open **OnTrack** and grant **Camera** and **Location (GPS)** permissions when requested so attendance clock-ins can capture verification photos and workplace coordinates.

### Install via ADB (USB Debugging)

```powershell
adb install -r ontrack.apk
```

### Switching Backend Server URL (Optional)

The APK connects to the live hosted API (`https://ontrack-api.x10.network/ontrack-api/api`) by default, so no local server setup is required to use the app.

If you need to point the app to a custom/local API server during development:
1. Open the **Login** screen.
2. Tap the **OnTrack** logo at the top of the screen.
3. Enter your API base URL (e.g., `http://<YOUR_LOCAL_IP>/ontrack-api/api`) and tap **Save**, or choose **Reset Default** to return to the live API.

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

## Tech Stack

- **Frontend:** Ionic (`@ionic/angular ^9.0.0`), Angular (`22.2.3`), RxJS (`~7.8.0`), TypeScript (`~6.0.0`)
- **Native Runtime & Plugins:** Capacitor (`8.6.0`), `@capacitor/android`, `@capacitor/app`, `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/status-bar`
- **Backend Integration:** Configured in [`src/app/core/utils/api-url.util.ts`](./src/app/core/utils/api-url.util.ts) and [`src/environments/`](./src/environments)

### Declared Android Permissions

From [`android/app/src/main/AndroidManifest.xml`](./android/app/src/main/AndroidManifest.xml):
- `android.permission.INTERNET`
- `android.permission.CAMERA`
- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.ACCESS_FINE_LOCATION`

---

## Local Development Setup

### Prerequisites

- **Node.js & npm** (for the Ionic/Angular frontend)
- **Android Studio / Android SDK & JDK** (only required if rebuilding the Android APK locally)

### 1. Install Dependencies

```powershell
npm install
```

### 2. Run the Web Development Server

```powershell
npm start
```

This runs `ng serve` and opens the app locally at `http://localhost:4200`.

### 3. Available npm Scripts

- `npm start` — Start the Angular development server (`ng serve`)
- `npm run build` — Build the production web bundle into `www/` (`ng build`)
- `npm run watch` — Watch-mode development build
- `npm run lint` — Run ESLint (`--max-warnings 0`), E2E TypeScript check, and Prettier check
- `npm run lint:fix` — Auto-fix ESLint and Prettier formatting issues
- `npm test` — Run unit tests (`Vitest` via `npm run test:unit`) and E2E tests (`Playwright` via `npm run test:e2e`)

---

## Rebuilding `ontrack.apk` from Source

1. Build the production web bundle and sync assets into the Android project:
   ```powershell
   npm run build
   npx cap sync android
   ```
2. Compile the Android debug APK using the Gradle wrapper:
   ```powershell
   .\android\gradlew.bat -p android assembleDebug
   ```
3. Copy the newly generated APK to the repository root (if updating `ontrack.apk`):
   ```powershell
   Copy-Item .\android\app\build\outputs\apk\debug\app-debug.apk .\ontrack.apk -Force
   ```
4. To open and run the project inside Android Studio instead:
   ```powershell
   npx cap open android
   ```

