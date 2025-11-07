package com.smartfarm360.dto;

import com.smartfarm360.model.Task;
import lombok.Data;

@Data
public class TaskUpdateRequest {
    
    private Task.TaskStatus status;
    
    private String completionNotes;
    
    private Integer actualHours;
    
    private String photoUrl;
    
    private String reasonForDelay;
    
    private String estimatedCompletionDate; // Will be parsed to LocalDateTime in service
}