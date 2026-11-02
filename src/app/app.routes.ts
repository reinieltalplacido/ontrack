import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/tasks/tasks.page').then((m) => m.TasksPage),
  },
  {
    path: 'timelogs',
    loadComponent: () => import('./pages/timelogs/timelogs.page').then((m) => m.TimeLogsPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
  },
];
