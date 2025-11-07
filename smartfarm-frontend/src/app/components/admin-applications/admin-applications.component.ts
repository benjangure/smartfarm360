import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApplicationService, FarmOwnerApplication } from '../../services/application.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-applications.component.html',
  styleUrls: ['./admin-applications.component.scss']
})
export class AdminApplicationsComponent implements OnInit {
  applications: FarmOwnerApplication[] = [];
  loading = true;
  selectedApplication: FarmOwnerApplication | null = null;
  showRejectModal = false;
  rejectReason = '';

  constructor(
    private authService: AuthService,
    private applicationService: ApplicationService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.applicationService.getAllApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.loading = false;
      }
    });
  }

  approveApplication(application: FarmOwnerApplication): void {
    if (confirm(`Approve application for ${application.firstName} ${application.lastName}?\n\nThis will:\n• Create a user account\n• Send welcome email with login credentials\n• Grant farm owner access`)) {
      this.applicationService.approveApplication(application.id).subscribe({
        next: (response) => {
          console.log('Approval response:', response);
          alert('✅ Application approved successfully!\n\n📧 User account created and welcome email sent.\n👤 User can now log in with their credentials.');
          this.loadApplications();
        },
        error: (error) => {
          console.error('Approval error:', error);
          
          // Check if it's a network error vs server error
          if (error.status === 0) {
            alert('❌ Network Error\n\nPlease check your internet connection and try again.');
          } else if (error.status >= 500) {
            alert('⚠️ Server Error\n\nThe approval may have been processed despite the error.\nPlease refresh the page to check the status.\n\nIf the issue persists, check the server logs.');
          } else if (error.status === 409) {
            alert('⚠️ User Already Exists\n\nAn account with this email already exists.\nThe application status will be updated.');
            this.loadApplications();
          } else {
            const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
            alert('❌ Approval Failed\n\n' + errorMessage + '\n\nPlease try again or check the server logs.');
          }
        }
      });
    }
  }

  openRejectModal(application: FarmOwnerApplication): void {
    this.selectedApplication = application;
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  rejectApplication(): void {
    if (!this.rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!this.selectedApplication) return;

    this.applicationService.rejectApplication(this.selectedApplication.id, this.rejectReason).subscribe({
      next: (response) => {
        console.log('Rejection response:', response);
        alert('✅ Application rejected successfully!\n\n📧 Rejection email sent to applicant with reason.');
        this.showRejectModal = false;
        this.loadApplications();
      },
      error: (error) => {
        console.error('Rejection error:', error);
        
        if (error.status === 0) {
          alert('❌ Network Error\n\nPlease check your internet connection and try again.');
        } else if (error.status >= 500) {
          alert('⚠️ Server Error\n\nThe rejection may have been processed despite the error.\nPlease refresh the page to check the status.');
          this.showRejectModal = false;
          this.loadApplications();
        } else {
          const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
          alert('❌ Rejection Failed\n\n' + errorMessage);
        }
      }
    });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedApplication = null;
    this.rejectReason = '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'fas fa-clock text-yellow-600';
      case 'APPROVED':
        return 'fas fa-check-circle text-green-600';
      case 'REJECTED':
        return 'fas fa-times-circle text-red-600';
      default:
        return 'fas fa-question-circle text-gray-600';
    }
  }

  getPendingCount(): number {
    return this.applications.filter(a => a.status === 'PENDING').length;
  }

  getApprovedCount(): number {
    return this.applications.filter(a => a.status === 'APPROVED').length;
  }

  getRejectedCount(): number {
    return this.applications.filter(a => a.status === 'REJECTED').length;
  }
}