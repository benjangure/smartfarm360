import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { UserService } from '../../services/user.service';

interface DashboardStats {
  totalUsers: number;
  totalFarmOwners: number;
  totalSupervisors: number;
  totalWorkers: number;
  pendingApplications: number;
  activeFarms: number;
  totalTasks: number;
  totalAttendanceRecords: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    totalFarmOwners: 0,
    totalSupervisors: 0,
    totalWorkers: 0,
    pendingApplications: 0,
    activeFarms: 0,
    totalTasks: 0,
    totalAttendanceRecords: 0
  };

  loading = true;
  currentUser: any;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    
    // Load admin dashboard stats from backend
    this.dashboardService.getAdminDashboardStats().subscribe({
      next: (data) => {
        this.stats.totalUsers = data['totalUsers'] || 0;
        this.stats.totalSupervisors = data['totalSupervisors'] || 0;
        this.stats.totalWorkers = data['totalWorkers'] || 0;
        this.stats.activeFarms = data['totalFarms'] || 0;
        this.stats.totalTasks = data['totalTasks'] || 0;
        this.stats.totalAttendanceRecords = data['totalAttendanceRecords'] || 0;
        
        // Load pending applications count
        this.loadPendingApplications();
        
        // Load farm owners count
        this.loadFarmOwnersCount();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading admin dashboard stats:', error);
        this.loading = false;
      }
    });
  }

  private loadPendingApplications(): void {
    this.userService.getPendingApplications().subscribe({
      next: (applications) => {
        this.stats.pendingApplications = applications.length;
      },
      error: (error) => {
        console.error('Error loading pending applications:', error);
        this.stats.pendingApplications = 0;
      }
    });
  }

  private loadFarmOwnersCount(): void {
    this.userService.getUsersByRole('FARM_OWNER').subscribe({
      next: (farmOwners) => {
        this.stats.totalFarmOwners = farmOwners.length;
      },
      error: (error) => {
        console.error('Error loading farm owners:', error);
        this.stats.totalFarmOwners = 0;
      }
    });
  }
}