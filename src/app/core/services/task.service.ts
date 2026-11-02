import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskItem } from '../../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTasks(userId: number): Observable<TaskItem[]> {
    return this.http
      .get<{ success: boolean; tasks: TaskItem[] }>(`${this.apiUrl}/tasks/list.php?user_id=${userId}`)
      .pipe(map((res) => res.tasks || []));
  }

  createTask(payload: {
    user_id: number;
    title: string;
    description?: string;
    deadline?: string;
    priority?: string;
  }): Observable<{ success: boolean; message: string; task?: TaskItem }> {
    return this.http.post<{ success: boolean; message: string; task?: TaskItem }>(
      `${this.apiUrl}/tasks/create.php`,
      payload
    );
  }

  updateTaskStatus(
    taskId: number,
    status: 'pending' | 'in_progress' | 'completed'
  ): Observable<{ success: boolean; message: string; task?: TaskItem }> {
    return this.http.post<{ success: boolean; message: string; task?: TaskItem }>(
      `${this.apiUrl}/tasks/update.php`,
      { task_id: taskId, status }
    );
  }

  deleteTask(taskId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/tasks/delete.php`,
      { task_id: taskId }
    );
  }
}

