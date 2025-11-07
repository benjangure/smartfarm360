import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { DownloadService } from '../../services/download.service';
import { User } from '../../models/user.model';
import { WorkerStats } from '../../models/worker-stats.model';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { WorkerTasksModalComponent } from '../worker-tasks-modal/worker-tasks-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-workers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatModalComponent, WorkerTasksModalComponent],
  templateUrl: './workers-list.component.html',
  styleUrls: ['./workers-list.component.scss']
})
export class WorkersListComponent implements OnInit {
  workers: User[] = [];
  workerStats: Map<number, WorkerStats> = new Map();
  loading = true;
  error = '';
  currentUser: any;
  Math = Math;
  showChatModal = false;
  showTasksModal = false;
  selectedWorker: User | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadWorkers();
  }

  loadWorkers(): void {
    this.loading = true;
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        // Filter only workers
        this.workers = users.filter(user => user.role === 'WORKER');
        
        // Load stats for each worker
        if (this.workers.length > 0) {
          this.loadWorkerStats();
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading workers:', error);
        this.error = 'Failed to load workers. Please try again.';
        this.loading = false;
      }
    });
  }

  loadWorkerStats(): void {
    const statsRequests = this.workers.map(worker => 
      this.userService.getWorkerStats(worker.id)
    );

    forkJoin(statsRequests).subscribe({
      next: (statsArray) => {
        statsArray.forEach(stats => {
          this.workerStats.set(stats.workerId, stats);
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading worker stats:', error);
        // Don't show error, just use default stats
        this.loading = false;
      }
    });
  }

  toggleWorkerStatus(worker: User): void {
    const action = worker.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${worker.firstName} ${worker.lastName}?`)) {
      this.userService.toggleUserStatus(worker.id).subscribe({
        next: (updatedUser) => {
          const index = this.workers.findIndex(w => w.id === worker.id);
          if (index !== -1) {
            this.workers[index] = updatedUser;
          }
        },
        error: (error) => {
          console.error('Error toggling worker status:', error);
          alert('Failed to update worker status. Please try again.');
        }
      });
    }
  }

  getStatusClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive 
      ? 'fas fa-check-circle text-green-600' 
      : 'fas fa-times-circle text-red-600';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getWorkerStats(workerId: number) {
    const stats = this.workerStats.get(workerId);
    if (stats) {
      return {
        tasksCompleted: stats.completedTasks,
        attendanceRate: Math.round(stats.attendanceRate),
        lastActive: stats.lastActive
      };
    }
    return { tasksCompleted: 0, attendanceRate: 0, lastActive: 'N/A' };
  }

  getTotalTasksCompleted(): number {
    let total = 0;
    this.workerStats.forEach(stats => {
      total += stats.completedTasks;
    });
    return total;
  }

  getAverageAttendance(): number {
    if (this.workerStats.size === 0) return 0;
    let total = 0;
    this.workerStats.forEach(stats => {
      total += stats.attendanceRate;
    });
    return Math.round(total / this.workerStats.size);
  }

  getActiveWorkersCount(): number {
    return this.workers.filter(w => w.isActive).length;
  }

  exportWorkers(): void {
    const format = confirm('Choose format:\nOK for PDF\nCancel for Excel') ? 'pdf' : 'excel';
    this.downloadService.generateUserReport(this.workers, format);
    alert(`✅ Workers report downloaded as ${format.toUpperCase()}\n\nCheck your Downloads folder.`);
  }

  openChat(worker: User): void {
    this.selectedWorker = worker;
    this.showChatModal = true;
  }

  closeChatModal(): void {
    this.showChatModal = false;
    this.selectedWorker = null;
  }

  openTasks(worker: User): void {
    this.selectedWorker = worker;
    this.showTasksModal = true;
  }

  closeTasksModal(): void {
    this.showTasksModal = false;
    this.selectedWorker = null;
  }
}