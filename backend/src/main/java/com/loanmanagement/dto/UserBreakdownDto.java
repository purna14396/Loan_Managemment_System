package com.loanmanagement.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBreakdownDto {
    private long totalAdmins;
    private long totalCustomers;
}
