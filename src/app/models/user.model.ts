export interface User {
  id: number | string;
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
  avatar_url?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

