package com.loanmanagement.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanBreakdownDto {
    private long totalApprovedLoans;
    private long totalClosedLoans;
    private long totalRejectedLoans;
}
