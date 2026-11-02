export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at?: string;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
}

