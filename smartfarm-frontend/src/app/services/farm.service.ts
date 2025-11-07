import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Farm {
  id: number;
  name: string;
  description?: string;
  location: string;
  size: number;
  sizeUnit: string;
  cropsCount?: number;
  livestockCount?: number;
  workersCount?: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.API_URL}/farms`);
  }

  getMyFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.API_URL}/farms/my-farms`);
  }

  getFarmById(id: number): Observable<Farm> {
    return this.http.get<Farm>(`${this.API_URL}/farms/${id}`);
  }

  createFarm(farm: Partial<Farm>): Observable<Farm> {
    // Ensure size is properly formatted for backend (BigDecimal expects string or number)
    const farmData = {
      ...farm,
      size: farm.size ? parseFloat(farm.size.toString()) : 0
    };
    console.log('Sending farm data to backend:', farmData);
    return this.http.post<Farm>(`${this.API_URL}/farms`, farmData);
  }

  updateFarm(id: number, farm: Partial<Farm>): Observable<Farm> {
    // Ensure size is properly formatted for backend
    const farmData = {
      ...farm,
      size: farm.size ? parseFloat(farm.size.toString()) : 0
    };
    console.log('Updating farm data:', farmData);
    return this.http.put<Farm>(`${this.API_URL}/farms/${id}`, farmData);
  }

  deleteFarm(id: number): Observable<any> {
    console.log('Deleting farm with ID:', id);
    return this.http.delete(`${this.API_URL}/farms/${id}`, { responseType: 'text' });
  }
  
  // Admin oversight methods
  getAllFarmsForAdmin(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.API_URL}/farms/admin/all`);
  }
  
  getFarmOwnerReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/farms/admin/reports`);
  }

  testAuth(): Observable<any> {
    return this.http.get(`${this.API_URL}/farms/test-auth`, { responseType: 'text' });
  }
}