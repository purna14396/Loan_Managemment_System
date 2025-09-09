package com.loanmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoanStatusHistoryDto {
    private String status;
    private String comments;
    private LocalDateTime updatedAt;
}
