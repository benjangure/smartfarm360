import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AssignedSupervisor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  farmId: number;
  farmName: string;
  assignedDate: string;
  isActive: boolean;
}

@Component({
  selector: 'app-assigned-supervisors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './assigned-supervisors.component.html',
  styleUrls: ['./assigned-supervisors.component.scss']
})
export class AssignedSupervisorsComponent implements OnInit {
  assignedSupervisors: AssignedSupervisor[] = [];
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAssignedSupervisors();
  }

  loadAssignedSupervisors(): void {
    this.loading = true;
    this.error = '';

    this.http.get<AssignedSupervisor[]>(`${environment.apiUrl}/users/supervisors/assigned`).subscribe({
      next: (data) => {
        this.assignedSupervisors = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assigned supervisors:', error);
        this.error = 'Failed to load assigned supervisors. Please try again.';
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}