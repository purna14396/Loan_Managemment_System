package com.loanmanagement.dto;

import com.loanmanagement.model.Loan;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoanStatusUpdateRequest {

    @NotNull(message = "Loan status is required")
    private Loan.LoanStatus status;

    @Size(max = 500, message = "Comments must not exceed 500 characters")
    private String comments; // Optional field
}
