package com.smartfarm360.service;

import com.smartfarm360.model.Attendance;
import com.smartfarm360.model.Crop;
import com.smartfarm360.model.Farm;
import com.smartfarm360.model.Livestock;
import com.smartfarm360.model.Task;
import com.smartfarm360.repository.AttendanceRepository;
import com.smartfarm360.repository.FarmRepository;
import com.smartfarm360.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {
    
    private final AttendanceRepository attendanceRepository;
    private final TaskRepository taskRepository;
    private final FarmRepository farmRepository;
    
    public Resource generateAttendancePdfReport(LocalDate startDate, LocalDate endDate, Long farmId) {
        // For now, we'll generate Excel and convert to PDF later
        // This is a simplified implementation
        return generateAttendanceExcelReport(startDate, endDate, farmId);
    }
    
    public Resource generateAttendanceExcelReport(LocalDate startDate, LocalDate endDate, Long farmId) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Attendance Report");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Date", "Employee", "Clock In", "Clock Out", "Hours Worked", "Status"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Get attendance data
            LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.now().minusMonths(1);
            LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.now();
            
            List<Attendance> attendances;
            if (farmId != null) {
                attendances = attendanceRepository.findByUserAssignedFarmIdAndClockInTimeBetween(farmId, start, end);
            } else {
                attendances = attendanceRepository.findByClockInTimeBetween(start, end);
            }
            
            // Fill data rows
            int rowNum = 1;
            for (Attendance attendance : attendances) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(attendance.getCheckInTime().toLocalDate().toString());
                row.createCell(1).setCellValue(attendance.getUser().getFirstName() + " " + attendance.getUser().getLastName());
                row.createCell(2).setCellValue(attendance.getCheckInTime().toString());
                row.createCell(3).setCellValue(attendance.getCheckOutTime() != null ? attendance.getCheckOutTime().toString() : "Not clocked out");
                
                if (attendance.getCheckOutTime() != null) {
                    long hours = java.time.Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime()).toHours();
                    row.createCell(4).setCellValue(hours + " hours");
                } else {
                    row.createCell(4).setCellValue("In progress");
                }
                
                row.createCell(5).setCellValue(attendance.getCheckInTime().getHour() <= 8 ? "On Time" : "Late");
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            
            return new ByteArrayResource(outputStream.toByteArray());
            
        } catch (IOException e) {
            throw new RuntimeException("Error generating attendance report", e);
        }
    }
    
    public Resource generateTaskPdfReport(LocalDate startDate, LocalDate endDate, Long farmId) {
        return generateTaskExcelReport(startDate, endDate, farmId);
    }
    
    public Resource generateTaskExcelReport(LocalDate startDate, LocalDate endDate, Long farmId) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Task Report");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Task Title", "Assigned To", "Created Date", "Due Date", "Status", "Completion Date"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Get task data
            LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.now().minusMonths(1);
            LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.now();
            
            List<Task> tasks;
            if (farmId != null) {
                tasks = taskRepository.findByFarmIdAndCreatedAtBetween(farmId, start, end);
            } else {
                tasks = taskRepository.findByCreatedAtBetween(start, end);
            }
            
            // Fill data rows
            int rowNum = 1;
            for (Task task : tasks) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(task.getTitle());
                row.createCell(1).setCellValue(task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName());
                row.createCell(2).setCellValue(task.getCreatedAt().toLocalDate().toString());
                row.createCell(3).setCellValue(task.getDueDate().toString());
                row.createCell(4).setCellValue(task.getStatus().toString());
                row.createCell(5).setCellValue(task.getCompletedAt() != null ? task.getCompletedAt().toLocalDate().toString() : "Not completed");
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            
            return new ByteArrayResource(outputStream.toByteArray());
            
        } catch (IOException e) {
            throw new RuntimeException("Error generating task report", e);
        }
    }
    
    public Resource generateFarmSummaryPdfReport(Long farmId) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Farm farm = farmRepository.findById(farmId)
                    .orElseThrow(() -> new RuntimeException("Farm not found"));
            
            Sheet sheet = workbook.createSheet("Farm Summary - " + farm.getName());
            
            int rowNum = 0;
            
            // Farm details
            Row titleRow = sheet.createRow(rowNum++);
            titleRow.createCell(0).setCellValue("FARM SUMMARY REPORT");
            
            Row farmNameRow = sheet.createRow(rowNum++);
            farmNameRow.createCell(0).setCellValue("Farm Name:");
            farmNameRow.createCell(1).setCellValue(farm.getName());
            
            Row locationRow = sheet.createRow(rowNum++);
            locationRow.createCell(0).setCellValue("Location:");
            locationRow.createCell(1).setCellValue(farm.getLocation());
            
            Row sizeRow = sheet.createRow(rowNum++);
            sizeRow.createCell(0).setCellValue("Size:");
            sizeRow.createCell(1).setCellValue(farm.getSize() + " acres");
            
            rowNum++; // Empty row
            
            // Crops section
            Row cropsHeaderRow = sheet.createRow(rowNum++);
            cropsHeaderRow.createCell(0).setCellValue("CROPS");
            
            if (farm.getCrops() != null && !farm.getCrops().isEmpty()) {
                Row cropHeaderRow = sheet.createRow(rowNum++);
                cropHeaderRow.createCell(0).setCellValue("Crop Name");
                cropHeaderRow.createCell(1).setCellValue("Variety");
                cropHeaderRow.createCell(2).setCellValue("Planting Date");
                cropHeaderRow.createCell(3).setCellValue("Expected Harvest");
                
                for (Crop crop : farm.getCrops()) {
                    Row cropRow = sheet.createRow(rowNum++);
                    cropRow.createCell(0).setCellValue(crop.getName());
                    cropRow.createCell(1).setCellValue(crop.getVariety());
                    cropRow.createCell(2).setCellValue(crop.getPlantingDate().toString());
                    cropRow.createCell(3).setCellValue(crop.getExpectedHarvestDate().toString());
                }
            } else {
                Row noCropsRow = sheet.createRow(rowNum++);
                noCropsRow.createCell(0).setCellValue("No crops registered");
            }
            
            rowNum++; // Empty row
            
            // Livestock section
            Row livestockHeaderRow = sheet.createRow(rowNum++);
            livestockHeaderRow.createCell(0).setCellValue("LIVESTOCK");
            
            if (farm.getLivestock() != null && !farm.getLivestock().isEmpty()) {
                Row livestockColHeaderRow = sheet.createRow(rowNum++);
                livestockColHeaderRow.createCell(0).setCellValue("Type");
                livestockColHeaderRow.createCell(1).setCellValue("Breed");
                livestockColHeaderRow.createCell(2).setCellValue("Tag Number");
                livestockColHeaderRow.createCell(3).setCellValue("Health Status");
                
                for (Livestock livestock : farm.getLivestock()) {
                    Row livestockRow = sheet.createRow(rowNum++);
                    livestockRow.createCell(0).setCellValue(livestock.getType());
                    livestockRow.createCell(1).setCellValue(livestock.getBreed());
                    livestockRow.createCell(2).setCellValue(livestock.getTagNumber() != null ? livestock.getTagNumber() : "N/A");
                    livestockRow.createCell(3).setCellValue(livestock.getHealthStatus().toString());
                }
            } else {
                Row noLivestockRow = sheet.createRow(rowNum++);
                noLivestockRow.createCell(0).setCellValue("No livestock registered");
            }
            
            // Auto-size columns
            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            
            return new ByteArrayResource(outputStream.toByteArray());
            
        } catch (IOException e) {
            throw new RuntimeException("Error generating farm summary report", e);
        }
    }
}