import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface FarmOwner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  farmCount: number;
}

@Component({
  selector: 'app-farm-owners-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './farm-owners-list.component.html',
  styleUrls: ['./farm-owners-list.component.scss']
})
export class FarmOwnersListComponent implements OnInit {
  farmOwners: FarmOwner[] = [];
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadFarmOwners();
  }

  loadFarmOwners(): void {
    this.loading = true;
    this.error = '';

    this.http.get<FarmOwner[]>(`${environment.apiUrl}/users/farm-owners`).subscribe({
      next: (data) => {
        this.farmOwners = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading farm owners:', error);
        this.error = 'Failed to load farm owners. Please try again.';
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}