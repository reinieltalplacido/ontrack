# OnTrack — OJT Tracking & Monitoring Mobile App

OnTrack is a cross-platform mobile application built with **Ionic 9**, **Angular 22**, and **Capacitor 8** for On-the-Job Training (OJT) students and academic coordinators. It replaces manual Daily Time Records (DTR) with mobile attendance logging, GPS verification, photographic proof of duty, task tracking, and coordinator-ready reports.

---

## Install Prebuilt Android APK (`ontrack.apk`)

You can download the installable Android APK directly from Google Drive or use the copy included in the repository root ([`ontrack.apk`](./ontrack.apk)):

- **Google Drive APK Folder:** [Download OnTrack APK on Google Drive](https://drive.google.com/drive/folders/1p-AYwqkM48t3zmx6oMXWFor9moR7bsRY)
- **Repository APK File:** [`ontrack.apk`](./ontrack.apk)
- **Package / App ID:** `com.ontrack.app`
- **Minimum Android Version:** Android 7.0 (`minSdkVersion 24`)
- **Target SDK:** Android API `36` (`targetSdkVersion 36`)
- **Default Backend API:** `https://ontrack-api.x10.network/ontrack-api/api`
- **Backend API Repository:** [reinieltalplacido/ontrack-api](https://github.com/reinieltalplacido/ontrack-api)

### Install Directly on an Android Device

1. Download `ontrack.apk` from the [Google Drive APK folder](https://drive.google.com/drive/folders/1p-AYwqkM48t3zmx6oMXWFor9moR7bsRY) (or transfer [`ontrack.apk`](./ontrack.apk) from this repository) to your Android phone.
2. Tap `ontrack.apk` in your phone's file manager and allow **Install unknown apps** for your browser or file manager if prompted.
3. Open **OnTrack** and grant **Camera** and **Location (GPS)** permissions when requested so attendance clock-ins can capture verification photos and workplace coordinates.

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

- **Node.js & npm**
- **Ionic CLI** (`npm install -g @ionic/cli`)
- **Android Studio / Android SDK & JDK** (only required if rebuilding the Android APK locally)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the App Locally

```bash
ionic serve
```

_(You can also run `npm start` if `@ionic/cli` is not installed globally.)_

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

## Developed By

- Princess Lyka S. Santos
- Jorald Allen M. Sevilla
- Reiniel Anjelo T. Talplacido
- Mark Lennard L. Torres

