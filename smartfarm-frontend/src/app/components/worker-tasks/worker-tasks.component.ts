import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-worker-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-tasks.component.html',
  styleUrls: ['./worker-tasks.component.scss']
})
export class WorkerTasksComponent implements OnInit {
  tasks: Task[] = [];
  loading = false;
  error = '';
  selectedTask: Task | null = null;
  showUpdateModal = false;
  updateForm = {
    status: '',
    completionNotes: '',
    actualHours: 0,
    reasonForDelay: '',
    estimatedCompletionDate: ''
  };

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadMyTasks();
  }

  loadMyTasks() {
    this.loading = true;
    this.error = '';
    console.log('Loading my tasks...');
    
    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        console.log('Tasks loaded successfully:', tasks);
        console.log('Number of tasks:', tasks.length);
        this.tasks = tasks;
        this.loading = false;
        
        if (tasks.length === 0) {
          console.warn('No tasks found for current user');
        }
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        if (error.status === 401 || error.status === 403) {
          this.error = 'Authentication error. Please log in again.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          this.error = `Failed to load tasks: ${error.error?.message || error.message || 'Unknown error'}`;
        }
        
        this.loading = false;
      }
    });
  }

  updateTaskStatus(taskId: number, status: string) {
    this.taskService.updateTaskStatus(taskId, status).subscribe({
      next: () => {
        console.log(`Task ${taskId} status updated to ${status}`);
        this.loadMyTasks();
        // Show success message
        alert(`Task status updated to ${status.replace('_', ' ').toLowerCase()}`);
      },
      error: (error) => {
        this.error = 'Failed to update task status';
        console.error('Error updating task:', error);
        alert('Failed to update task status. Please try again.');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'pending': return 'status-pending';
      case 'not_done': return 'status-not-done';
      case 'to_be_done_later': return 'status-delayed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  onStatusChange(taskId: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value;
    
    // Find the task
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // If status requires additional info, show modal
    if (newStatus === 'COMPLETED' || newStatus === 'NOT_DONE' || newStatus === 'TO_BE_DONE_LATER') {
      this.selectedTask = task;
      this.updateForm.status = newStatus;
      this.showUpdateModal = true;
    } else {
      // Simple status update
      this.updateTaskStatus(taskId, newStatus);
    }
  }

  openUpdateModal(task: Task): void {
    this.selectedTask = task;
    this.updateForm = {
      status: task.status,
      completionNotes: task.completionNotes || '',
      actualHours: task.actualHours || 0,
      reasonForDelay: '',
      estimatedCompletionDate: ''
    };
    this.showUpdateModal = true;
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedTask = null;
    this.updateForm = {
      status: '',
      completionNotes: '',
      actualHours: 0,
      reasonForDelay: '',
      estimatedCompletionDate: ''
    };
  }

  submitTaskUpdate(): void {
    if (!this.selectedTask) return;

    const updateData: any = {
      status: this.updateForm.status
    };

    if (this.updateForm.completionNotes) {
      updateData.completionNotes = this.updateForm.completionNotes;
    }

    if (this.updateForm.actualHours > 0) {
      updateData.actualHours = this.updateForm.actualHours;
    }

    if (this.updateForm.reasonForDelay) {
      updateData.reasonForDelay = this.updateForm.reasonForDelay;
    }

    if (this.updateForm.estimatedCompletionDate) {
      updateData.estimatedCompletionDate = this.updateForm.estimatedCompletionDate;
    }

    this.taskService.updateTask(this.selectedTask.id, updateData).subscribe({
      next: () => {
        this.loadMyTasks();
        this.closeUpdateModal();
      },
      error: (error) => {
        this.error = 'Failed to update task';
        console.error('Error updating task:', error);
      }
    });
  }
}