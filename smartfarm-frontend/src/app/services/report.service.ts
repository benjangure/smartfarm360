import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http: HttpClient) {}

  generateAttendancePdfReport(startDate?: string, endDate?: string, farmId?: number | null): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (farmId) params = params.set('farmId', farmId.toString());

    return this.http.get(`${environment.apiUrl}/api/reports/attendance/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  generateAttendanceExcelReport(startDate?: string, endDate?: string, farmId?: number | null): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (farmId) params = params.set('farmId', farmId.toString());

    return this.http.get(`${environment.apiUrl}/api/reports/attendance/excel`, {
      params,
      responseType: 'blob'
    });
  }

  generateTaskPdfReport(startDate?: string, endDate?: string, farmId?: number | null): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (farmId) params = params.set('farmId', farmId.toString());

    return this.http.get(`${environment.apiUrl}/api/reports/tasks/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  generateTaskExcelReport(startDate?: string, endDate?: string, farmId?: number | null): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (farmId) params = params.set('farmId', farmId.toString());

    return this.http.get(`${environment.apiUrl}/api/reports/tasks/excel`, {
      params,
      responseType: 'blob'
    });
  }

  generateFarmSummaryPdfReport(farmId: number): Observable<Blob> {
    const params = new HttpParams().set('farmId', farmId.toString());

    return this.http.get(`${environment.apiUrl}/api/reports/farm-summary/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}