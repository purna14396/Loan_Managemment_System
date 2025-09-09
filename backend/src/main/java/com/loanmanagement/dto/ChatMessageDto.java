package com.loanmanagement.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessageDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long adminId;
    private String adminName;
    private String senderType; // "CUSTOMER" or "ADMIN"
    private String message;
    private LocalDateTime sentAt;
}
