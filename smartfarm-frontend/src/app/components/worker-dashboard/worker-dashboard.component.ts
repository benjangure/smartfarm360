import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { WorkerTasksComponent } from '../worker-tasks/worker-tasks.component';
import { WorkerCheckinComponent } from '../worker-checkin/worker-checkin.component';
import { WorkerProfileComponent } from '../worker-profile/worker-profile.component';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { Task, TaskStatus } from '../../models/task.model';

interface WorkerStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  todayAttendance: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  totalHoursWorked: number;
  attendanceRate: number;
}

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, WorkerTasksComponent, WorkerCheckinComponent, WorkerProfileComponent, ChatModalComponent],
  templateUrl: './worker-dashboard.component.html',
  styleUrls: ['./worker-dashboard.component.scss']
})
export class WorkerDashboardComponent implements OnInit {
  stats: WorkerStats = {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    todayAttendance: false,
    totalHoursWorked: 0,
    attendanceRate: 0
  };

  recentTasks: Task[] = [];
  upcomingTasks: Task[] = [];
  loading = true;
  currentUser: any;
  assignedFarm: any;
  currentTime = new Date();
  activeTab = 'overview';
  Math = Math;
  showChatModal = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private taskService: TaskService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.assignedFarm = this.currentUser?.assignedFarm;
    this.loadDashboardData();

    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load task statistics
    this.taskService.getTaskStats().subscribe({
      next: (stats) => {
        this.stats.totalTasks = stats.total || 0;
        this.stats.pendingTasks = stats.pending || 0;
        this.stats.inProgressTasks = stats.inProgress || 0;
        this.stats.completedTasks = stats.completed || 0;
      },
      error: (error) => {
        console.error('Error loading task stats:', error);
      }
    });

    // Load worker's assigned tasks
    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.recentTasks = tasks.slice(0, 5);
        this.upcomingTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED).slice(0, 3);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  calculateStats(tasks: Task[]): void {
    this.stats.totalTasks = tasks.length;
    this.stats.pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    this.stats.inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    this.stats.completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    
    // Calculate total hours worked from completed tasks
    this.stats.totalHoursWorked = tasks
      .filter(t => t.status === TaskStatus.COMPLETED && t.actualHours)
      .reduce((total, task) => total + (task.actualHours || 0), 0);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getTaskStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }

  getTaskStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'fas fa-clock text-yellow-600';
      case 'IN_PROGRESS':
        return 'fas fa-play-circle text-blue-600';
      case 'COMPLETED':
        return 'fas fa-check-circle text-green-600';
      default:
        return 'fas fa-question-circle text-gray-600';
    }
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  }

  getWorkingHours(): string {
    if (this.stats.checkInTime && !this.stats.checkOutTime) {
      const checkIn = new Date(`2024-01-01 ${this.stats.checkInTime}`);
      const now = new Date();
      const currentTime = new Date(`2024-01-01 ${now.getHours()}:${now.getMinutes()}`);
      const diff = currentTime.getTime() - checkIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return '0h 0m';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Quick Actions
  goToTasks(): void {
    this.router.navigate(['/dashboard/tasks']);
  }

  goToAttendance(): void {
    this.router.navigate(['/dashboard/attendance']);
  }

  openChat(): void {
    this.showChatModal = true;
  }

  closeChatModal(): void {
    this.showChatModal = false;
  }
}