import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { DownloadService } from '../../services/download.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-supervisors-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './supervisors-list.component.html',
  styleUrls: ['./supervisors-list.component.scss']
})
export class SupervisorsListComponent implements OnInit {
  supervisors: User[] = [];
  loading = true;
  error = '';
  currentUser: any;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private downloadService: DownloadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSupervisors();
  }

  loadSupervisors(): void {
    this.loading = true;
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        // Filter only supervisors
        this.supervisors = users.filter(user => user.role === 'SUPERVISOR');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading supervisors:', error);
        this.error = 'Failed to load supervisors. Please try again.';
        this.loading = false;
      }
    });
  }

  toggleSupervisorStatus(supervisor: User): void {
    const action = supervisor.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${supervisor.firstName} ${supervisor.lastName}?`)) {
      this.userService.toggleUserStatus(supervisor.id).subscribe({
        next: (updatedUser) => {
          const index = this.supervisors.findIndex(s => s.id === supervisor.id);
          if (index !== -1) {
            this.supervisors[index] = updatedUser;
          }
        },
        error: (error) => {
          console.error('Error toggling supervisor status:', error);
          alert('Failed to update supervisor status. Please try again.');
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

  getActiveSupervisorsCount(): number {
    return this.supervisors.filter(s => s.isActive).length;
  }

  getAssignedSupervisorsCount(): number {
    return this.supervisors.filter(s => 
      s.assignedFarm || (s.supervisedFarms && s.supervisedFarms.length > 0)
    ).length;
  }

  viewSupervisor(supervisor: User): void {
    // Create a modal or navigate to a detailed view
    this.showSupervisorDetails(supervisor);
  }

  editSupervisor(supervisor: User): void {
    // Navigate to edit page or open edit modal
    this.showEditSupervisorModal(supervisor);
  }

  private showSupervisorDetails(supervisor: User): void {
    const details = `
Supervisor Details:

Name: ${supervisor.firstName} ${supervisor.lastName}
Email: ${supervisor.email}
Phone: ${supervisor.phoneNumber || 'Not provided'}
Username: ${supervisor.username}
Status: ${supervisor.isActive ? 'Active' : 'Inactive'}
Assigned Farm: ${supervisor.assignedFarm ? supervisor.assignedFarm.name : 'Not assigned'}
Farm Location: ${supervisor.assignedFarm ? supervisor.assignedFarm.location : 'N/A'}
Joined: ${this.formatDate(supervisor.createdAt)}
Last Updated: ${this.formatDate(supervisor.updatedAt)}
    `;
    
    alert(details);
  }

  private showEditSupervisorModal(supervisor: User): void {
    const newFirstName = prompt('First Name:', supervisor.firstName);
    if (newFirstName === null) return; // User cancelled

    const newLastName = prompt('Last Name:', supervisor.lastName);
    if (newLastName === null) return;

    const newEmail = prompt('Email:', supervisor.email);
    if (newEmail === null) return;

    const newPhone = prompt('Phone Number:', supervisor.phoneNumber || '');
    if (newPhone === null) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Prepare update data
    const updateData = {
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email: newEmail.trim(),
      phoneNumber: newPhone.trim() || undefined
    };

    // Confirm changes
    const confirmMessage = `
Confirm changes for ${supervisor.firstName} ${supervisor.lastName}:

First Name: ${supervisor.firstName} → ${updateData.firstName}
Last Name: ${supervisor.lastName} → ${updateData.lastName}
Email: ${supervisor.email} → ${updateData.email}
Phone: ${supervisor.phoneNumber || 'Not set'} → ${updateData.phoneNumber || 'Not set'}

Do you want to save these changes?
    `;

    if (confirm(confirmMessage)) {
      this.userService.updateUser(supervisor.id, updateData).subscribe({
        next: (updatedUser) => {
          // Update the supervisor in the list
          const index = this.supervisors.findIndex(s => s.id === supervisor.id);
          if (index !== -1) {
            this.supervisors[index] = updatedUser;
          }
          alert('Supervisor updated successfully!');
        },
        error: (error) => {
          console.error('Error updating supervisor:', error);
          
          let errorMessage = 'Failed to update supervisor. Please try again.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to update this user.';
          } else if (error.status === 404) {
            errorMessage = 'User not found.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  exportSupervisors(): void {
    const format = confirm('Choose format:\nOK for PDF\nCancel for Excel') ? 'pdf' : 'excel';
    this.downloadService.generateUserReport(this.supervisors, format);
    alert(`✅ Supervisors report downloaded as ${format.toUpperCase()}\n\nCheck your Downloads folder.`);
  }
}