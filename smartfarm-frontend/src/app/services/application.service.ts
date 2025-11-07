import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FarmOwnerApplication {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  farmName: string;
  farmLocation: string;
  farmSize?: string;
  farmType?: string;
  expectedUsers?: string;
  comments?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  reviewedBy?: number;
  createdUserId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllApplications(): Observable<FarmOwnerApplication[]> {
    return this.http.get<FarmOwnerApplication[]>(`${this.API_URL}/applications/all`);
  }

  getPendingApplications(): Observable<FarmOwnerApplication[]> {
    return this.http.get<FarmOwnerApplication[]>(`${this.API_URL}/applications/pending`);
  }

  approveApplication(applicationId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/applications/${applicationId}/approve`, {});
  }

  rejectApplication(applicationId: number, reason: string): Observable<any> {
    return this.http.post(`${this.API_URL}/applications/${applicationId}/reject`, reason, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  testApplicationSystem(): Observable<any> {
    return this.http.get(`${this.API_URL}/applications/test`);
  }
}