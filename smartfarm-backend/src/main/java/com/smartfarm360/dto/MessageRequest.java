package com.smartfarm360.dto;

import com.smartfarm360.model.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private Long recipientId;
    private String content;
    private Message.MessageType messageType;
}