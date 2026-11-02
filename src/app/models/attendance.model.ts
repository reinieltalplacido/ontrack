export interface AttendanceLog {
  id: number;
  user_id: number;
  log_date: string;
  time_in: string;
  time_out?: string | null;
  total_hours?: string | number;
  latitude?: string | number | null;
  longitude?: string | number | null;
  location_name?: string | null;
  photo_url?: string | null;
  activity_notes?: string | null;
  status: 'ongoing' | 'completed';
  created_at?: string;
}

export interface DashboardStats {
  accumulated_hours: number;
  required_hours: number;
  remaining_hours: number;
  completion_percent: number;
  days_remaining: number;
  total_days_logged: number;
  is_clocked_in: boolean;
  pending_tasks: number;
  completed_tasks: number;
  today_log?: AttendanceLog | null;
}

