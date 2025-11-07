import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskRequest, TaskUpdateRequest } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createTask(taskData: TaskRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/tasks`, taskData);
  }

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks`);
  }

  getMyTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks/my-tasks`);
  }

  getTodayTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks/today`);
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.API_URL}/tasks/${id}`);
  }

  updateTask(id: number, updateData: TaskUpdateRequest): Observable<Task> {
    return this.http.put<Task>(`${this.API_URL}/tasks/${id}`, updateData);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/tasks/${id}`);
  }

  startTask(id: number): Observable<Task> {
    return this.updateTask(id, { status: 'IN_PROGRESS' as any });
  }

  completeTask(id: number, notes?: string, actualHours?: number): Observable<Task> {
    return this.updateTask(id, { 
      status: 'COMPLETED' as any, 
      completionNotes: notes,
      actualHours: actualHours
    });
  }

  updateTaskStatus(id: number, status: string): Observable<Task> {
    return this.updateTask(id, { status: status as any });
  }

  getTasksCreatedByMe(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks/created-by-me`);
  }

  getTaskStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/tasks/stats`);
  }

  getTasksByWorker(workerId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks/worker/${workerId}`);
  }
}