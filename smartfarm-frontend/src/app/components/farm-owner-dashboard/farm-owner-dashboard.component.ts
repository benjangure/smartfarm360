import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FarmService } from '../../services/farm.service';
import { UserService } from '../../services/user.service';

interface FarmOwnerStats {
  totalFarms: number;
  totalSupervisors: number;
  totalWorkers: number;
  activeTasks: number;
  completedTasks: number;
  assignedSupervisors: number;
  totalRevenue?: number;
}

@Component({
  selector: 'app-farm-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './farm-owner-dashboard.component.html',
  styleUrls: ['./farm-owner-dashboard.component.scss']
})
export class FarmOwnerDashboardComponent implements OnInit {
  stats: FarmOwnerStats = {
    totalFarms: 0,
    totalSupervisors: 0,
    totalWorkers: 0,
    activeTasks: 0,
    completedTasks: 0,
    assignedSupervisors: 0
  };

  recentFarms: any[] = [];
  recentSupervisors: any[] = [];
  loading = true;
  currentUser: any;

  constructor(
    private authService: AuthService,
    private farmService: FarmService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load farms owned by this farm owner
    this.farmService.getMyFarms().subscribe({
      next: (farms) => {
        this.recentFarms = farms.slice(0, 5); // Show latest 5 farms
        this.stats.totalFarms = farms.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading farms:', error);
        this.loading = false;
      }
    });

    // Load supervisors and calculate assigned count
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        const supervisors = users.filter(user => user.role === 'SUPERVISOR');
        const workers = users.filter(user => user.role === 'WORKER');
        const assignedSupervisors = supervisors.filter(supervisor => supervisor.assignedFarm);
        
        this.stats.totalSupervisors = supervisors.length;
        this.stats.totalWorkers = workers.length;
        this.stats.assignedSupervisors = assignedSupervisors.length;
        
        // Create recent supervisors list
        this.recentSupervisors = supervisors.slice(0, 3).map(supervisor => ({
          id: supervisor.id,
          name: `${supervisor.firstName} ${supervisor.lastName}`,
          farmName: supervisor.assignedFarm ? supervisor.assignedFarm.name : 'Not assigned',
          email: supervisor.email,
          createdAt: supervisor.createdAt
        }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });

    // Initialize task stats to 0 - will be loaded from real API later
    this.stats = {
      ...this.stats,
      activeTasks: 0,
      completedTasks: 0
    };
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  viewAssignedSupervisors(): void {
    this.router.navigate(['/dashboard/assigned-supervisors']);
  }
}