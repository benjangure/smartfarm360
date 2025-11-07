import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, UserRegistrationRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Login response received:', response);
          console.log('Token received:', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response);
          console.log('Token stored in localStorage:', localStorage.getItem('token'));
        })
      );
  }

  register(userData: UserRegistrationRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, userData);
  }

  submitFarmOwnerApplication(applicationData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/applications/submit`, applicationData);
  }

  changePassword(passwordData: { currentPassword: string, newPassword: string, confirmPassword: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, passwordData);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  clearStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: string[]): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  getCurrentUserInfo(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.API_URL}/auth/me`);
  }

  updateCurrentUser(userData: any): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }
}