package com.smartfarm360.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.smartfarm360.model.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TaskRequest {
    
    @NotBlank(message = "Task title is required")
    private String title;
    
    private String description;
    
    private String category;
    
    @NotNull(message = "Assigned user ID is required")
    private Long assignedToId;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    
    private Task.TaskPriority priority = Task.TaskPriority.MEDIUM;
    
    private Integer estimatedHours;
    
    // Helper method to convert LocalDate to LocalDateTime
    public LocalDateTime getDueDateAsDateTime() {
        return dueDate != null ? dueDate.atStartOfDay() : null;
    }
}