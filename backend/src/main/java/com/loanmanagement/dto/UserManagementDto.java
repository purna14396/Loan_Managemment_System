package com.loanmanagement.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserManagementDto {
    private Long userId;
    private String username;
    private String email;
    private String role;
    private Long activeLoanCount;
    private LocalDateTime createdAt; // ✅ For sorting
}

