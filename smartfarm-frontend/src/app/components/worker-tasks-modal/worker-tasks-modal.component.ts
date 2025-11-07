import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-worker-tasks-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-tasks-modal.component.html',
  styleUrls: ['./worker-tasks-modal.component.scss']
})
export class WorkerTasksModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() workerId!: number;
  @Input() workerName!: string;
  @Output() closeModal = new EventEmitter<void>();

  tasks: Task[] = [];
  loading = true;
  error = '';
  
  // Filter states
  selectedStatus: string = 'ALL';
  selectedPriority: string = 'ALL';

  // Stats
  stats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  };

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    if (this.isOpen && this.workerId) {
      this.loadWorkerTasks();
    }
  }

  ngOnChanges(): void {
    if (this.isOpen && this.workerId) {
      this.loadWorkerTasks();
    }
  }

  loadWorkerTasks(): void {
    this.loading = true;
    this.error = '';
    
    this.taskService.getTasksByWorker(this.workerId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading worker tasks:', error);
        this.error = 'Failed to load tasks. Please try again.';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.tasks.length;
    this.stats.pending = this.tasks.filter(t => t.status === TaskStatus.PENDING).length;
    this.stats.inProgress = this.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    this.stats.completed = this.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  }

  getFilteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const statusMatch = this.selectedStatus === 'ALL' || task.status === this.selectedStatus;
      const priorityMatch = this.selectedPriority === 'ALL' || task.priority === this.selectedPriority;
      return statusMatch && priorityMatch;
    });
  }

  close(): void {
    this.closeModal.emit();
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'text-gray-600';
      case TaskPriority.MEDIUM:
        return 'text-blue-600';
      case TaskPriority.HIGH:
        return 'text-orange-600';
      case TaskPriority.URGENT:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  refreshTasks(): void {
    this.loadWorkerTasks();
  }
}
