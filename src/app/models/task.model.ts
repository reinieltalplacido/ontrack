export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: number;
  user_id: number;
  student_no?: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  proof_url?: string | null;
  proof_file?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at?: string;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
}

