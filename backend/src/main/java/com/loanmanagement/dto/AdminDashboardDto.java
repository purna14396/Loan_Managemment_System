package com.loanmanagement.dto;

import java.math.BigDecimal;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardDto {
    private long totalUsers;
    private long totalLoanApplications;
    private BigDecimal totalApprovedLoanAmount;
    private BigDecimal totalRepaidAmount;
}
