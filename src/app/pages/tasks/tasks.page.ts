import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { NativeService } from '../../core/services/native.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskItem, TaskPriority, TaskStatus } from '../../models/task.model';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';
import {
  addOutline,
  searchOutline,
  filterOutline,
  calendarOutline,
  trashOutline,
  checkboxOutline,
  squareOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  closeOutline,
  menuOutline,
  gridOutline,
  personOutline,
  copyOutline,
  logOutOutline,
  refreshOutline,
  checkmarkOutline,
  flagOutline,
  swapVerticalOutline,
  arrowBackOutline,
  cameraOutline,
  imageOutline,
  playOutline,
  eyeOutline,
  attachOutline,
  documentTextOutline,
  checkmarkDoneOutline,
  chevronForwardOutline,
  expandOutline,
  shieldCheckmarkOutline,
  arrowUndoOutline,
  chevronDownOutline,
  chevronUpOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonBadge,
  ],
})
export class TasksPage implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private nativeService = inject(NativeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  currentUser: User | null = null;
  tasks: TaskItem[] = [];
  filteredTasks: TaskItem[] = [];
  isLoading = true;

  // Filter & Search Controls
  searchQuery = '';
  statusFilter = 'all';
  priorityFilter = 'all';
  sortBy = 'deadline';

  // Modal State for New Task
  showNewTaskModal = false;
  isSubmitting = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskDeadline = '';
  newTaskPriority: TaskPriority = 'medium';
  isPriorityDropdownOpen = false;

  // Task Details Modal State
  showTaskDetailModal = false;
  selectedTask: TaskItem | null = null;
  isSavingProof = false;

  // Full Image Modal
  isImageModalOpen = false;
  previewImageUrl = '';

  // Side Drawer state
  isSideMenuOpen = false;
  activeMenu = 'tasks';

  // Feedback banner
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor() {
    addIcons({
      addOutline,
      searchOutline,
      filterOutline,
      calendarOutline,
      trashOutline,
      checkboxOutline,
      squareOutline,
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      closeOutline,
      menuOutline,
      gridOutline,
      personOutline,
      copyOutline,
      logOutOutline,
      refreshOutline,
      checkmarkOutline,
      flagOutline,
      swapVerticalOutline,
      arrowBackOutline,
      cameraOutline,
      imageOutline,
      playOutline,
      eyeOutline,
      attachOutline,
      documentTextOutline,
      checkmarkDoneOutline,
      chevronForwardOutline,
      expandOutline,
      shieldCheckmarkOutline,
      arrowUndoOutline,
      chevronDownOutline,
      chevronUpOutline,
    });
  }

  ionViewWillEnter() {
    this.activeMenu = 'tasks';
    this.isSideMenuOpen = false;
    this.currentUser = this.authService.currentUserValue || this.currentUser;
    this.loadTasks();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.currentUser = {
        id: 1,
        student_id: 'SUM2023-00980',
        full_name: 'Reiniel Talplacido',
        email: 'reiniel@student.neust.edu.ph',
        company_name: 'Project SOLO',
        required_hours: 500,
      };
    }
    this.loadTasks();
  }

  loadTasks(event?: any) {
    if (!this.currentUser) {
      if (event) event.target.complete();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.taskService.getTasks(this.currentUser.id).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        if (event) event.target.complete();
      },
    });
  }

  handleRefresh(event: any) {
    this.loadTasks(event);
  }

  applyFilters() {
    let result = [...this.tasks];

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      result = result.filter((t) => t.status === this.statusFilter);
    }

    // Priority filter
    if (this.priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === this.priorityFilter);
    }

    // Sort order
    if (this.sortBy === 'deadline') {
      result.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else if (this.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortBy === 'status') {
      result.sort((a, b) => a.status.localeCompare(b.status));
    }

    this.filteredTasks = result;
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.sortBy = 'deadline';
    this.applyFilters();
  }

  // Metrics computation
  get totalTasksCount(): number {
    return this.tasks.length;
  }

  get completedTasksCount(): number {
    return this.tasks.filter((t) => t.status === 'completed').length;
  }

  get inProgressTasksCount(): number {
    return this.tasks.filter((t) => t.status === 'in_progress' || t.status === 'pending').length;
  }

  get overdueTasksCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter(
      (t) => t.status !== 'completed' && t.deadline && t.deadline < today
    ).length;
  }

  isOverdue(task: TaskItem): boolean {
    if (task.status === 'completed' || !task.deadline) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.deadline < today;
  }

  // Toggle completion
  toggleTaskStatus(task: TaskItem) {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          task.status = newStatus;
          if (this.selectedTask && this.selectedTask.id === task.id) {
            this.selectedTask.status = newStatus;
          }
          this.applyFilters();
          this.nativeService.triggerHapticFeedback('medium');
          this.showFeedback(
            newStatus === 'completed' ? 'Task marked as completed!' : 'Task moved to pending.',
            'success'
          );
        }
      },
      error: () => {
        this.showFeedback('Unable to update task status.', 'error');
      },
    });
  }

  // Start Task workflow (pending -> in_progress)
  startTask(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    this.taskService.updateTaskStatus(task.id, 'in_progress').subscribe({
      next: (res) => {
        if (res.success) {
          task.status = 'in_progress';
          if (this.selectedTask && this.selectedTask.id === task.id) {
            this.selectedTask.status = 'in_progress';
          }
          this.applyFilters();
          this.cdr.detectChanges();
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback(`"${task.title}" started! Now In Progress.`, 'success');
        }
      },
      error: () => {
        this.showFeedback('Unable to start task.', 'error');
      },
    });
  }

  // Undo Start Task (in_progress -> pending)
  undoStartTask(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    this.taskService.updateTaskStatus(task.id, 'pending').subscribe({
      next: (res) => {
        if (res.success) {
          task.status = 'pending';
          if (this.selectedTask && this.selectedTask.id === task.id) {
            this.selectedTask.status = 'pending';
          }
          this.applyFilters();
          this.cdr.detectChanges();
          this.nativeService.triggerHapticFeedback('medium');
          this.showFeedback(`"${task.title}" reverted back to Pending.`, 'success');
        }
      },
      error: () => {
        this.showFeedback('Unable to undo task status.', 'error');
      },
    });
  }

  // Complete Task workflow
  completeTask(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    this.taskService.updateTaskStatus(task.id, 'completed').subscribe({
      next: (res) => {
        if (res.success) {
          task.status = 'completed';
          if (this.selectedTask && this.selectedTask.id === task.id) {
            this.selectedTask.status = 'completed';
          }
          this.applyFilters();
          this.cdr.detectChanges();
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback(`"${task.title}" marked as completed!`, 'success');
        }
      },
      error: () => {
        this.showFeedback('Unable to complete task.', 'error');
      },
    });
  }

  // Reopen Task
  reopenTask(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    this.taskService.updateTaskStatus(task.id, 'in_progress').subscribe({
      next: (res) => {
        if (res.success) {
          task.status = 'in_progress';
          if (this.selectedTask && this.selectedTask.id === task.id) {
            this.selectedTask.status = 'in_progress';
          }
          this.applyFilters();
          this.cdr.detectChanges();
          this.showFeedback('Task reopened to In Progress.', 'success');
        }
      },
      error: () => {
        this.showFeedback('Unable to reopen task.', 'error');
      },
    });
  }

  // View Task Details Modal
  viewTask(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedTask = task;
    this.showTaskDetailModal = true;
  }

  closeTaskDetailModal() {
    this.showTaskDetailModal = false;
    this.selectedTask = null;
  }

  // Camera & Documentation Attachment
  async openCameraForDocumentation(task: TaskItem) {
    try {
      const photo = await this.nativeService.openCameraForTask();
      if (photo) {
        this.saveTaskDocumentation(task, photo);
      }
    } catch {
      this.showFeedback('Camera could not be opened. You can attach from files instead.', 'error');
    }
  }

  async attachDocumentation(task: TaskItem) {
    try {
      const photo = await this.nativeService.captureTaskProof();
      if (photo) {
        this.saveTaskDocumentation(task, photo);
      }
    } catch {
      // Fallback handled via file input
    }
  }

  onFileSelected(event: any, task: TaskItem) {
    const file = event.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.saveTaskDocumentation(task, base64);
      };
      reader.readAsDataURL(file);
    }
  }

  saveTaskDocumentation(task: TaskItem, photoData: string) {
    this.isSavingProof = true;
    this.cdr.detectChanges();
    this.taskService.attachTaskProof(task.id, photoData).subscribe({
      next: (res) => {
        this.isSavingProof = false;
        const savedUrl = res?.task?.proof_url || photoData;
        task.proof_url = savedUrl;
        if (this.selectedTask && this.selectedTask.id === task.id) {
          this.selectedTask.proof_url = savedUrl;
        }
        this.nativeService.triggerHapticFeedback('success');
        this.showFeedback('Documentation photo attached successfully!', 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingProof = false;
        task.proof_url = photoData;
        if (this.selectedTask && this.selectedTask.id === task.id) {
          this.selectedTask.proof_url = photoData;
        }
        this.showFeedback('Documentation photo saved locally.', 'success');
        this.cdr.detectChanges();
      },
    });
  }

  removeDocumentation(task: TaskItem, event?: Event) {
    if (event) event.stopPropagation();
    task.proof_url = null;
    if (this.selectedTask && this.selectedTask.id === task.id) {
      this.selectedTask.proof_url = null;
    }
    this.taskService.updateTaskStatus(task.id, task.status, '').subscribe({
      next: () => {
        this.showFeedback('Documentation photo removed.', 'success');
      },
      error: () => {
        this.showFeedback('Documentation photo removed.', 'success');
      },
    });
  }

  getProofImageUrl(proofUrl?: string | null): string {
    if (!proofUrl) return '';
    if (proofUrl.startsWith('data:image') || proofUrl.startsWith('http://') || proofUrl.startsWith('https://')) {
      return proofUrl;
    }
    const baseUrl = environment.apiUrl.replace(/\/api$/, '');
    return `${baseUrl}/${proofUrl}`;
  }

  viewFullImage(url: string, event?: Event) {
    if (event) event.stopPropagation();
    if (!url) return;
    this.previewImageUrl = url;
    this.isImageModalOpen = true;
  }

  closeImageModal() {
    this.isImageModalOpen = false;
    this.previewImageUrl = '';
  }

  // Delete task
  deleteTask(task: TaskItem, event: Event) {
    event.stopPropagation();
    this.taskService.deleteTask(task.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.tasks = this.tasks.filter((t) => t.id !== task.id);
          this.applyFilters();
          this.showFeedback('Task removed.', 'success');
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.showFeedback('Could not delete task.', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  // Add New Task Modal
  openNewTaskModal() {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskDeadline = '';
    this.newTaskPriority = 'medium';
    this.isPriorityDropdownOpen = false;
    this.showNewTaskModal = true;
    this.cdr.detectChanges();
  }

  closeNewTaskModal() {
    this.showNewTaskModal = false;
    this.isPriorityDropdownOpen = false;
    this.cdr.detectChanges();
  }

  togglePriorityDropdown() {
    this.isPriorityDropdownOpen = !this.isPriorityDropdownOpen;
    this.cdr.detectChanges();
  }

  selectPriority(priority: TaskPriority) {
    this.newTaskPriority = priority;
    this.isPriorityDropdownOpen = false;
    this.cdr.detectChanges();
  }

  getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case 'low': return 'Low Priority';
      case 'medium': return 'Medium Priority';
      case 'high': return 'High Priority';
      default: return 'Medium Priority';
    }
  }

  openDatePicker(inputEl: HTMLInputElement) {
    if (inputEl) {
      if (typeof (inputEl as any).showPicker === 'function') {
        try {
          (inputEl as any).showPicker();
        } catch {
          inputEl.focus();
        }
      } else {
        inputEl.focus();
      }
    }
  }

  submitNewTask() {
    if (!this.currentUser) return;
    if (!this.newTaskTitle.trim()) {
      this.showFeedback('Please provide a task title.', 'error');
      return;
    }
    if (!this.newTaskDeadline) {
      this.showFeedback('Due date is required. Please set a deadline.', 'error');
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    const payload = {
      user_id: this.currentUser.id,
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription.trim(),
      deadline: this.newTaskDeadline,
      priority: this.newTaskPriority,
    };

    this.taskService.createTask(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showNewTaskModal = false;
        if (res.success && res.task) {
          this.tasks.unshift(res.task);
          this.applyFilters();
          this.newTaskTitle = '';
          this.newTaskDescription = '';
          this.newTaskDeadline = '';
          this.newTaskPriority = 'medium';
          this.nativeService.triggerHapticFeedback('success');
          this.showFeedback('Task added successfully!', 'success');
        } else {
          this.showFeedback(res.message || 'Could not create task.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmitting = false;
        this.showFeedback('Unable to connect to server.', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // Side Drawer navigation
  openSideMenu() {
    this.isSideMenuOpen = true;
  }

  closeSideMenu() {
    this.isSideMenuOpen = false;
  }

  selectMenuItem(item: string) {
    this.closeSideMenu();

    if (item === 'dashboard') {
      this.router.navigate(['/home']);
    } else if (item === 'timelogs') {
      this.router.navigate(['/timelogs']);
    } else if (item === 'profile') {
      this.router.navigate(['/profile']);
    } else if (item === 'reports') {
      this.router.navigate(['/reports']);
    } else if (item === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  logout() {
    this.closeSideMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'No due date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  showFeedback(msg: string, type: 'success' | 'error') {
    this.feedbackMessage = msg;
    this.feedbackType = type;
    this.toastService.show(msg, type);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.feedbackMessage = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}

