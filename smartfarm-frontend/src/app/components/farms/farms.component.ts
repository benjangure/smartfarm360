import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FarmService, Farm as ServiceFarm } from '../../services/farm.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-farms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farms.component.html',
  styleUrls: ['./farms.component.scss']
})
export class FarmsComponent implements OnInit {
  farms: ServiceFarm[] = [];  // Use ServiceFarm type
  showCreateForm: boolean = false;
  showEditForm: boolean = false;
  selectedFarm: ServiceFarm | null = null;
  currentUserRole: string = '';
  loading: boolean = false;
  
  newFarm: Partial<ServiceFarm> = {
    name: '',
    location: '',
    size: 0,
    sizeUnit: 'acres',
    description: ''
    // Don't include createdAt/updatedAt - backend handles these
  };

  constructor(
    private farmService: FarmService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUserRole = this.authService.getCurrentUser()?.role || '';
    this.testAuth();
    this.loadFarms();
  }

  testAuth() {
    console.log('Testing authentication...');
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Token:', this.authService.getToken());
    
    this.farmService.testAuth().subscribe({
      next: (response) => {
        console.log('Auth test successful:', response);
      },
      error: (error) => {
        console.error('Auth test failed:', error);
      }
    });
  }

  openCreateModal(): void {
    this.showCreateForm = true;
    this.selectedFarm = null;
  }

  viewFarm(farm: ServiceFarm): void {
    this.selectedFarm = farm;
    console.log('Viewing farm:', farm);
  }

  editFarm(farm: ServiceFarm): void {
    this.selectedFarm = { ...farm };
    this.showEditForm = true;
  }

  loadFarms() {
    // System admins get all farms for oversight, others get their accessible farms
    const farmRequest = this.isSystemAdmin() 
      ? this.farmService.getAllFarmsForAdmin()
      : this.farmService.getMyFarms(); // Use getMyFarms instead of getAllFarms
      
    farmRequest.subscribe({
      next: (farms) => {
        console.log('Farms loaded successfully:', farms);
        this.farms = farms;
      },
      error: (error) => {
        console.error('Error loading farms:', error);
        if (error.status === 401) {
          console.log('Authentication failed, clearing storage and redirecting to login');
          this.authService.clearStorage();
          window.location.href = '/login';
        }
      }
    });
  }

  openCreateForm() {
    this.newFarm = {
      name: '',
      location: '',
      size: 0,
      description: '',
      sizeUnit: 'acres'
    };
    this.showCreateForm = true;
  }

  closeCreateForm() {
    this.showCreateForm = false;
  }

  createFarm() {
    console.log('Creating farm with data:', this.newFarm);
    console.log('Current user role:', this.currentUserRole);
    console.log('Can create farm:', this.canCreateFarm());
    
    if (!this.canCreateFarm()) {
      alert('You do not have permission to create farms.');
      return;
    }
    
    this.loading = true;
    this.farmService.createFarm(this.newFarm).subscribe({
      next: (farm) => {
        console.log('Farm created successfully:', farm);
        this.farms.push(farm);
        this.closeCreateForm();
        this.loading = false;
        alert('Farm created successfully!');
      },
      error: (error) => {
        console.error('Error creating farm:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);
        
        this.loading = false;
        
        let errorMessage = 'Error creating farm. Please try again.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to create farms.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        }
        
        alert(errorMessage);
      }
    });
  }

  openEditForm(farm: ServiceFarm) {
    this.selectedFarm = { ...farm };
    this.showEditForm = true;
  }

  closeEditForm() {
    this.showEditForm = false;
    this.selectedFarm = null;
  }

  updateFarm() {
    if (this.selectedFarm) {
      this.loading = true;
      const updateData: Partial<ServiceFarm> = {
        name: this.selectedFarm.name?.trim(),
        location: this.selectedFarm.location?.trim(),
        size: this.selectedFarm.size,
        sizeUnit: this.selectedFarm.sizeUnit,
        description: this.selectedFarm.description?.trim()
      };

      console.log('Updating farm with data:', updateData);

      this.farmService.updateFarm(this.selectedFarm.id, updateData).subscribe({
        next: (updatedFarm) => {
          console.log('Farm updated successfully:', updatedFarm);
          const index = this.farms.findIndex(f => f.id === updatedFarm.id);
          if (index !== -1) {
            this.farms[index] = updatedFarm;
          }
          this.closeEditForm();
          this.loading = false;
          alert('Farm updated successfully!');
        },
        error: (error) => {
          console.error('Error updating farm:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          
          this.loading = false;
          
          let errorMessage = 'Error updating farm. Please try again.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to update this farm.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (error.status === 404) {
            errorMessage = 'Farm not found.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  deleteFarm(farm: ServiceFarm) {
    const confirmMessage = `Are you sure you want to delete "${farm.name}"?\n\nThis will:\n- Remove the farm permanently\n- Unassign all users from this farm\n- This action cannot be undone`;
    
    if (confirm(confirmMessage)) {
      console.log('Deleting farm:', farm);
      this.loading = true;
      
      this.farmService.deleteFarm(farm.id).subscribe({
        next: (response) => {
          console.log('Farm deleted successfully:', response);
          this.farms = this.farms.filter(f => f.id !== farm.id);
          this.loading = false;
          alert('Farm deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting farm:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          
          this.loading = false;
          
          let errorMessage = 'Error deleting farm. Please try again.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to delete this farm.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (error.status === 404) {
            errorMessage = 'Farm not found.';
          } else if (error.status === 409) {
            errorMessage = 'Cannot delete farm. It may have assigned users or other dependencies.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  canCreateFarm(): boolean {
    return ['FARM_OWNER'].includes(this.currentUserRole);
  }

  canEditFarm(): boolean {
    return ['FARM_OWNER'].includes(this.currentUserRole);
  }

  canDeleteFarm(): boolean {
    return ['FARM_OWNER'].includes(this.currentUserRole);
  }
  
  isSystemAdmin(): boolean {
    return this.currentUserRole === 'SYSTEM_ADMIN';
  }
}
