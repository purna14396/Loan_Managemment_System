package com.loanmanagement.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminLoanDetailDto {
    private Long id;

    // ✅ Use nested customer DTO
    private UserDto customer;

    private String loanType;
    private BigDecimal amount;
    private String purpose;
    private String income;
    private String employmentInfo;
    private String aadhaar;
    private String pan;
    private int cibilScore;
    private int tenureYears;
    private String loanStatus;
    private LocalDateTime submittedAt;

    private Double appliedInterestRate;
}
