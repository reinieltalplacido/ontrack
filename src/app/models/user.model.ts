export interface User {
  id: number;
  student_id: string;
  full_name: string;
  email: string;
  course_section?: string;
  school_campus?: string;
  company_name?: string;
  adviser_name?: string;
  adviser_email?: string;
  start_date?: string;
  target_date?: string;
  required_hours: number;
  rendered_hours?: number;
  avatar_url?: string | null;
}

export interface Professor {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: 'admin' | 'coordinator' | 'adviser';
  assigned_section?: string;
  contact_number?: string | null;
  avatar_url?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  professor?: Professor;
  role?: 'student' | 'professor' | 'admin';
  token?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message?: string;
  professor?: Professor;
  token?: string;
  role?: string;
}
