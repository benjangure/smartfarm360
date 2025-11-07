import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRegistrationRequest } from '../models/user.model';
import { WorkerStats } from '../models/worker-stats.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Get users that the current user can manage (based on role hierarchy)
  getMyUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/my-users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: UserRegistrationRequest): Observable<any> {
    return this.http.post(this.apiUrl, user, { responseType: 'text' });
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  updateProfile(profileData: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profileData);
  }

  getCurrentProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  getUsersByRole(role: string): Observable<User[]> {
    const endpoint = role === 'FARM_OWNER' ? 'farm-owners' : 
                     role === 'SUPERVISOR' ? 'supervisors' : 
                     role === 'WORKER' ? 'workers' : '';
    return this.http.get<User[]>(`${this.apiUrl}/${endpoint}`);
  }

  getPendingApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/applications/pending`);
  }

  getWorkerStats(workerId: number): Observable<WorkerStats> {
    return this.http.get<WorkerStats>(`${this.apiUrl}/${workerId}/stats`);
  }
}