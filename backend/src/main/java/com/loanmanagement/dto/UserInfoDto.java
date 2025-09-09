package com.loanmanagement.dto;

import lombok.Data;

@Data
public class UserInfoDto {
    private Long userId;
    private String name;
    private String username;
    private String email;
    private String role;
    // Add more fields if needed
}
