package com.smartfarm360.controller;

import com.smartfarm360.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Report generation APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportController {
    
    private final ReportService reportService;
    
    @GetMapping("/attendance/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Generate attendance PDF report")
    public ResponseEntity<Resource> generateAttendancePdfReport(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long farmId) {
        
        Resource resource = reportService.generateAttendancePdfReport(startDate, endDate, farmId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-report.pdf\"")
                .body(resource);
    }
    
    @GetMapping("/attendance/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Generate attendance Excel report")
    public ResponseEntity<Resource> generateAttendanceExcelReport(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long farmId) {
        
        Resource resource = reportService.generateAttendanceExcelReport(startDate, endDate, farmId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-report.xlsx\"")
                .body(resource);
    }
    
    @GetMapping("/tasks/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Generate task completion PDF report")
    public ResponseEntity<Resource> generateTaskPdfReport(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long farmId) {
        
        Resource resource = reportService.generateTaskPdfReport(startDate, endDate, farmId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"task-report.pdf\"")
                .body(resource);
    }
    
    @GetMapping("/tasks/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Generate task completion Excel report")
    public ResponseEntity<Resource> generateTaskExcelReport(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long farmId) {
        
        Resource resource = reportService.generateTaskExcelReport(startDate, endDate, farmId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"task-report.xlsx\"")
                .body(resource);
    }
    
    @GetMapping("/farm-summary/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Generate farm summary PDF report")
    public ResponseEntity<Resource> generateFarmSummaryPdfReport(@RequestParam Long farmId) {
        
        Resource resource = reportService.generateFarmSummaryPdfReport(farmId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"farm-summary-report.pdf\"")
                .body(resource);
    }
}