import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { LoginResponse } from '../../models/user.model';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { FarmOwnerDashboardComponent } from '../farm-owner-dashboard/farm-owner-dashboard.component';
import { SupervisorDashboardComponent } from '../supervisor-dashboard/supervisor-dashboard.component';
import { WorkerDashboardComponent } from '../worker-dashboard/worker-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, AdminDashboardComponent, FarmOwnerDashboardComponent, SupervisorDashboardComponent, WorkerDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: LoginResponse | null = null;
  dashboardStats: any = {};
  loading = true;
  currentDate = new Date();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    // Add a small delay to ensure authentication is properly set
    setTimeout(() => {
      this.dashboardService.getDashboardStats().subscribe({
        next: (stats) => {
          this.dashboardStats = stats;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          
          // If authentication error, redirect to login
          if (error.status === 401 || error.status === 403) {
            console.log('Authentication error, redirecting to login');
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          
          this.loading = false;
        }
      });
    }, 200);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getStatCards(): any[] {
    if (!this.currentUser) return [];

    switch (this.currentUser.role) {
      case 'SYSTEM_ADMIN':
        return [
          {
            title: 'Total Users',
            value: this.dashboardStats.totalUsers || 0,
            icon: 'fas fa-users',
            color: 'bg-blue-500',
            change: '+12%'
          },
          {
            title: 'Total Farms',
            value: this.dashboardStats.totalFarms || 0,
            icon: 'fas fa-seedling',
            color: 'bg-green-500',
            change: '+5%'
          },
          {
            title: 'Active Tasks',
            value: (this.dashboardStats.pendingTasks || 0) + (this.dashboardStats.inProgressTasks || 0),
            icon: 'fas fa-tasks',
            color: 'bg-yellow-500',
            change: '+8%'
          },
          {
            title: 'Completed Tasks',
            value: this.dashboardStats.completedTasks || 0,
            icon: 'fas fa-check-circle',
            color: 'bg-purple-500',
            change: '+15%'
          }
        ];
      
      case 'SUPERVISOR':
        return [
          {
            title: 'Farm Workers',
            value: this.dashboardStats.farmWorkers || 0,
            icon: 'fas fa-users',
            color: 'bg-blue-500'
          },
          {
            title: 'Tasks Created',
            value: this.dashboardStats.tasksCreated || 0,
            icon: 'fas fa-plus-circle',
            color: 'bg-green-500'
          },
          {
            title: 'Farm Tasks',
            value: this.dashboardStats.farmTasks || 0,
            icon: 'fas fa-tasks',
            color: 'bg-yellow-500'
          },
          {
            title: 'Farm Crops',
            value: this.dashboardStats.farmCrops || 0,
            icon: 'fas fa-seedling',
            color: 'bg-purple-500'
          }
        ];
      
      case 'WORKER':
        return [
          {
            title: 'Pending Tasks',
            value: this.dashboardStats.pendingTasks || 0,
            icon: 'fas fa-clock',
            color: 'bg-yellow-500'
          },
          {
            title: 'In Progress',
            value: this.dashboardStats.inProgressTasks || 0,
            icon: 'fas fa-play-circle',
            color: 'bg-blue-500'
          },
          {
            title: 'Completed',
            value: this.dashboardStats.completedTasks || 0,
            icon: 'fas fa-check-circle',
            color: 'bg-green-500'
          },
          {
            title: 'Attendance',
            value: this.dashboardStats.totalAttendance || 0,
            icon: 'fas fa-calendar-check',
            color: 'bg-purple-500'
          }
        ];
      
      default:
        return [];
    }
  }
}