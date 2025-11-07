import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FarmService, Farm } from '../../services/farm.service';
import { AuthService } from '../../services/auth.service';
import { User, SimpleFarm } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SupervisorAssignment {
  supervisor: User;
  assignedFarms: SimpleFarm[];
  availableFarms: Farm[];
}

@Component({
  selector: 'app-supervisor-farm-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './supervisor-farm-management.component.html',
  styleUrls: ['./supervisor-farm-management.component.scss']
})
export class SupervisorFarmManagementComponent implements OnInit {
  supervisors: User[] = [];
  farms: Farm[] = [];
  supervisorAssignments: SupervisorAssignment[] = [];
  loading = true;
  error = '';
  
  selectedSupervisor: User | null = null;
  selectedFarm: Farm | null = null;
  showAssignModal = false;
  showReassignModal = false;
  
  reassignData: {
    supervisorId: number | null;
    fromFarmId: number | null;
    toFarmId: number | null;
  } = {
    supervisorId: null,
    fromFarmId: null,
    toFarmId: null
  };

  constructor(
    private userService: UserService,
    private farmService: FarmService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.testAssignmentSystem();
  }

  refreshData(): void {
    console.log('Refreshing supervisor farm management data...');
    this.supervisors = [];
    this.farms = [];
    this.supervisorAssignments = [];
    this.loadData();
  }

  testAssignmentSystem(): void {
    console.log('Testing supervisor assignment system...');
    this.http.get(`${environment.apiUrl}/supervisor-assignments/test`).subscribe({
      next: (result) => {
        console.log('Assignment system test result:', result);
      },
      error: (error) => {
        console.error('Assignment system test failed:', error);
      }
    });
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.loadSupervisors(),
      this.loadFarms()
    ]).then(() => {
      this.buildAssignmentData();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.error = 'Failed to load data. Please try again.';
      this.loading = false;
    });
  }

  private loadSupervisors(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getMyUsers().subscribe({
        next: (users) => {
          this.supervisors = users.filter(user => user.role === 'SUPERVISOR');
          resolve();
        },
        error: reject
      });
    });
  }

  private loadFarms(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.farmService.getMyFarms().subscribe({
        next: (farms) => {
          this.farms = farms;
          resolve();
        },
        error: reject
      });
    });
  }

  private buildAssignmentData(): void {
    console.log('Building assignment data for supervisors:', this.supervisors);
    
    this.supervisorAssignments = this.supervisors.map(supervisor => {
      const assignedFarms = supervisor.supervisedFarms || [];
      const availableFarms = this.farms.filter(farm => 
        !assignedFarms.some(af => af.id === farm.id)
      );
      
      console.log(`Supervisor ${supervisor.firstName} ${supervisor.lastName}:`, {
        supervisedFarms: assignedFarms,
        assignedCount: assignedFarms.length,
        availableFarms: availableFarms.length
      });
      
      return {
        supervisor,
        assignedFarms,
        availableFarms
      };
    });
  }

  openAssignModal(supervisor: User): void {
    this.selectedSupervisor = supervisor;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedSupervisor = null;
    this.selectedFarm = null;
  }

  assignSupervisorToFarm(): void {
    if (!this.selectedSupervisor || !this.selectedFarm) {
      alert('Please select both supervisor and farm.');
      return;
    }

    const assignment = this.supervisorAssignments.find(sa => 
      sa.supervisor.id === this.selectedSupervisor!.id
    );

    if (assignment && assignment.assignedFarms.length >= 2) {
      alert('Supervisor can only be assigned to a maximum of 2 farms.');
      return;
    }

    this.http.post<User>(`${environment.apiUrl}/supervisor-assignments/assign`, null, {
      params: {
        supervisorId: this.selectedSupervisor!.id.toString(),
        farmId: this.selectedFarm!.id.toString()
      }
    }).subscribe({
      next: (updatedSupervisor) => {
        console.log('Assignment successful, updated supervisor:', updatedSupervisor);
        // Refresh all data to ensure consistency
        this.refreshData();
        this.closeAssignModal();
        alert('Supervisor assigned to farm successfully!');
      },
      error: (error) => {
        console.error('Error assigning supervisor:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);
        
        let errorMessage = 'Failed to assign supervisor to farm.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Bad request. Please check the supervisor and farm selection.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to assign supervisors to farms.';
        } else if (error.status === 404) {
          errorMessage = 'Supervisor or farm not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. The database table might not exist. Please contact support.';
        }
        
        alert(`Assignment Failed:\n\n${errorMessage}\n\nPlease check the browser console for more details.`);
      }
    });
  }

  removeSupervisorFromFarm(supervisorId: number, farmId: number): void {
    if (confirm('Are you sure you want to remove this supervisor from the farm?')) {
      this.http.post<User>(`${environment.apiUrl}/supervisor-assignments/remove`, null, {
        params: {
          supervisorId: supervisorId.toString(),
          farmId: farmId.toString()
        }
      }).subscribe({
        next: (updatedSupervisor) => {
          // Update the supervisor in our local data
          const index = this.supervisors.findIndex(s => s.id === updatedSupervisor.id);
          if (index !== -1) {
            this.supervisors[index] = updatedSupervisor;
          }
          this.buildAssignmentData();
          alert('Supervisor removed from farm successfully!');
        },
        error: (error) => {
          console.error('Error removing supervisor:', error);
          let errorMessage = 'Failed to remove supervisor from farm.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          }
          alert(errorMessage);
        }
      });
    }
  }

  openReassignModal(supervisor: User): void {
    this.selectedSupervisor = supervisor;
    this.reassignData = {
      supervisorId: supervisor.id,
      fromFarmId: null,
      toFarmId: null
    };
    this.showReassignModal = true;
  }

  closeReassignModal(): void {
    this.showReassignModal = false;
    this.selectedSupervisor = null;
    this.reassignData = {
      supervisorId: null,
      fromFarmId: null,
      toFarmId: null
    };
  }

  reassignSupervisor(): void {
    if (!this.reassignData.fromFarmId || !this.reassignData.toFarmId) {
      alert('Please select both source and target farms.');
      return;
    }

    if (this.reassignData.fromFarmId === this.reassignData.toFarmId) {
      alert('Source and target farms cannot be the same.');
      return;
    }

    this.http.post<User>(`${environment.apiUrl}/supervisor-assignments/reassign`, this.reassignData).subscribe({
      next: (updatedSupervisor) => {
        // Update the supervisor in our local data
        const index = this.supervisors.findIndex(s => s.id === updatedSupervisor.id);
        if (index !== -1) {
          this.supervisors[index] = updatedSupervisor;
        }
        this.buildAssignmentData();
        this.closeReassignModal();
        alert('Supervisor reassigned successfully!');
      },
      error: (error) => {
        console.error('Error reassigning supervisor:', error);
        let errorMessage = 'Failed to reassign supervisor.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        }
        alert(errorMessage);
      }
    });
  }

  getAssignedFarmsForSupervisor(supervisor: User): SimpleFarm[] {
    return supervisor.supervisedFarms || [];
  }

  getAvailableFarmsForSupervisor(supervisor: User): Farm[] {
    const assignedFarms = this.getAssignedFarmsForSupervisor(supervisor);
    return this.farms.filter(farm => 
      !assignedFarms.some(af => af.id === farm.id)
    );
  }

  canAssignMoreFarms(supervisor: User): boolean {
    return this.getAssignedFarmsForSupervisor(supervisor).length < 2;
  }
}