package com.loanmanagement.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminLoanSummaryDto {

    // Loan Info
    private Long id;
    private String loanType;
    private Double appliedInterestRate;
    private BigDecimal amount;
    private Integer tenureYears;
    private String loanStatus;
    private String purpose;
    private LocalDateTime submittedAt;

    // ✅ Nested Customer Object
    private UserDto customer;

    // Financial Info
    private String pan;
    private String aadhaar;
    private String employmentInfo;
    private String income;
    private Integer cibilScore;
}
