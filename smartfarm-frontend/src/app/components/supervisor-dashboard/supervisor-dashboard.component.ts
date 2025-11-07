import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ConversationsComponent } from '../conversations/conversations.component';

interface SupervisorStats {
  totalWorkers: number;
  activeWorkers: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  todayAttendance: number;
  lateArrivals: number;
}

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ConversationsComponent],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit {
  stats: SupervisorStats = {
    totalWorkers: 0,
    activeWorkers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    todayAttendance: 0,
    lateArrivals: 0
  };

  recentWorkers: any[] = [];
  recentTasks: any[] = [];
  todayAttendanceList: any[] = [];
  loading = true;
  currentUser: any;
  assignedFarm: any;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Check if supervisor has farm assignment from JWT token
    if (this.currentUser?.farmId && this.currentUser?.farmName) {
      this.assignedFarm = {
        id: this.currentUser.farmId,
        name: this.currentUser.farmName
      };
    }
    console.log('Current user:', this.currentUser);
    console.log('Assigned farm:', this.assignedFarm);
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Supervisors can work without a farm assignment initially
    // They will be assigned farms by farm owners
    
    // Load workers managed by this supervisor
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        const workers = users.filter(user => user.role === 'WORKER');
        this.recentWorkers = workers.slice(0, 5);
        this.stats.totalWorkers = workers.length;
        this.stats.activeWorkers = workers.filter(w => w.isActive).length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workers:', error);
        this.loading = false;
      }
    });

    // Initialize with empty data - will be loaded from real API
    this.stats = {
      ...this.stats,
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      todayAttendance: 0,
      lateArrivals: 0
    };
    
    this.recentTasks = [];
    this.todayAttendanceList = [];
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

  getAttendanceStatusClass(status: string): string {
    switch (status) {
      case 'ON_TIME':
        return 'bg-green-100 text-green-800';
      case 'LATE':
        return 'bg-red-100 text-red-800';
      case 'EARLY':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
}