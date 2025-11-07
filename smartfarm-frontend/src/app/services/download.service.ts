import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface ReportData {
  title: string;
  generatedBy: string;
  generatedAt: string;
  data: any[];
  summary?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(private authService: AuthService) {}

  // Generate PDF report
  generatePDF(reportData: ReportData): void {
    const currentUser = this.authService.getCurrentUser();
    
    // Create PDF content as HTML string
    const htmlContent = this.createPDFContent(reportData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  }

  // Generate Excel (CSV) report
  generateExcel(reportData: ReportData): void {
    const csvContent = this.createCSVContent(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.sanitizeFilename(reportData.title)}_${this.getDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate attendance report
  generateAttendanceReport(attendanceData: any[], format: 'pdf' | 'excel'): void {
    const reportData: ReportData = {
      title: 'Attendance Report',
      generatedBy: this.authService.getCurrentUser()?.firstName + ' ' + this.authService.getCurrentUser()?.lastName || 'System',
      generatedAt: new Date().toLocaleString(),
      data: attendanceData,
      summary: this.calculateAttendanceSummary(attendanceData)
    };

    if (format === 'pdf') {
      this.generatePDF(reportData);
    } else {
      this.generateExcel(reportData);
    }
  }

  // Generate user report
  generateUserReport(users: any[], format: 'pdf' | 'excel'): void {
    const reportData: ReportData = {
      title: 'Users Report',
      generatedBy: this.authService.getCurrentUser()?.firstName + ' ' + this.authService.getCurrentUser()?.lastName || 'System',
      generatedAt: new Date().toLocaleString(),
      data: users,
      summary: this.calculateUserSummary(users)
    };

    if (format === 'pdf') {
      this.generatePDF(reportData);
    } else {
      this.generateExcel(reportData);
    }
  }

  // Generate task report
  generateTaskReport(tasks: any[], format: 'pdf' | 'excel'): void {
    const reportData: ReportData = {
      title: 'Tasks Report',
      generatedBy: this.authService.getCurrentUser()?.firstName + ' ' + this.authService.getCurrentUser()?.lastName || 'System',
      generatedAt: new Date().toLocaleString(),
      data: tasks,
      summary: this.calculateTaskSummary(tasks)
    };

    if (format === 'pdf') {
      this.generatePDF(reportData);
    } else {
      this.generateExcel(reportData);
    }
  }

  // Generate farm report
  generateFarmReport(farms: any[], format: 'pdf' | 'excel'): void {
    const reportData: ReportData = {
      title: 'Farms Report',
      generatedBy: this.authService.getCurrentUser()?.firstName + ' ' + this.authService.getCurrentUser()?.lastName || 'System',
      generatedAt: new Date().toLocaleString(),
      data: farms,
      summary: this.calculateFarmSummary(farms)
    };

    if (format === 'pdf') {
      this.generatePDF(reportData);
    } else {
      this.generateExcel(reportData);
    }
  }

  private createPDFContent(reportData: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .meta { font-size: 12px; color: #666; }
          .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .summary h3 { margin-top: 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${reportData.title}</div>
          <div class="meta">
            Generated by: ${reportData.generatedBy}<br>
            Generated on: ${reportData.generatedAt}<br>
            SmartFarm360 Management System
          </div>
        </div>
        
        ${reportData.summary ? this.createSummaryHTML(reportData.summary) : ''}
        
        <div class="data-section">
          <h3>Detailed Data</h3>
          ${this.createTableHTML(reportData.data, reportData.title)}
        </div>
        
        <div class="footer">
          <p>This report was generated automatically by SmartFarm360 Management System</p>
          <p>© ${new Date().getFullYear()} SmartFarm360. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  private createCSVContent(reportData: ReportData): string {
    if (!reportData.data || reportData.data.length === 0) {
      return `${reportData.title}\nGenerated by: ${reportData.generatedBy}\nGenerated on: ${reportData.generatedAt}\n\nNo data available`;
    }

    const headers = Object.keys(reportData.data[0]);
    const csvRows = [
      `${reportData.title}`,
      `Generated by: ${reportData.generatedBy}`,
      `Generated on: ${reportData.generatedAt}`,
      '',
      headers.join(','),
      ...reportData.data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private createSummaryHTML(summary: any): string {
    const summaryItems = Object.entries(summary).map(([key, value]) => 
      `<p><strong>${this.formatLabel(key)}:</strong> ${value}</p>`
    ).join('');
    
    return `
      <div class="summary">
        <h3>Summary</h3>
        ${summaryItems}
      </div>
    `;
  }

  private createTableHTML(data: any[], reportType: string): string {
    if (!data || data.length === 0) {
      return '<p>No data available for this report.</p>';
    }

    const headers = Object.keys(data[0]);
    const headerRow = headers.map(header => `<th>${this.formatLabel(header)}</th>`).join('');
    const dataRows = data.map(row => 
      `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
    ).join('');

    return `
      <table>
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
    `;
  }

  private calculateAttendanceSummary(data: any[]): any {
    return {
      totalRecords: data.length,
      onTimeCount: data.filter(d => d.status === 'ON_TIME').length,
      lateCount: data.filter(d => d.status === 'LATE').length,
      absentCount: data.filter(d => d.status === 'ABSENT').length,
      averageHours: data.length > 0 ? (data.reduce((sum, d) => sum + (parseFloat(d.totalHours) || 0), 0) / data.length).toFixed(2) : '0'
    };
  }

  private calculateUserSummary(data: any[]): any {
    return {
      totalUsers: data.length,
      activeUsers: data.filter(d => d.isActive).length,
      inactiveUsers: data.filter(d => !d.isActive).length,
      farmOwners: data.filter(d => d.role === 'FARM_OWNER').length,
      supervisors: data.filter(d => d.role === 'SUPERVISOR').length,
      workers: data.filter(d => d.role === 'WORKER').length
    };
  }

  private calculateTaskSummary(data: any[]): any {
    return {
      totalTasks: data.length,
      pendingTasks: data.filter(d => d.status === 'PENDING').length,
      inProgressTasks: data.filter(d => d.status === 'IN_PROGRESS').length,
      completedTasks: data.filter(d => d.status === 'COMPLETED').length,
      overdueTasks: data.filter(d => new Date(d.dueDate) < new Date() && d.status !== 'COMPLETED').length
    };
  }

  private calculateFarmSummary(data: any[]): any {
    return {
      totalFarms: data.length,
      totalArea: data.reduce((sum, d) => sum + (parseFloat(d.size) || 0), 0).toFixed(2),
      averageSize: data.length > 0 ? (data.reduce((sum, d) => sum + (parseFloat(d.size) || 0), 0) / data.length).toFixed(2) : '0',
      activeFarms: data.filter(d => d.isActive !== false).length
    };
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .replace(/_/g, ' ');
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}