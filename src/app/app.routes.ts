import type { Routes } from '@angular/router';
import { autoLoginGuard, authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    canActivate: [autoLoginGuard],
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    canActivate: [autoLoginGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tasks/tasks.page').then((m) => m.TasksPage),
  },
  {
    path: 'timelogs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/timelogs/timelogs.page').then((m) => m.TimeLogsPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
  },
  {
    path: 'admin/login',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'admin/dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
  },
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
];
