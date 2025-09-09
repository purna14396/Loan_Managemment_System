package com.loanmanagement.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoanTypeDto {

    private Long loanTypeId;

    @NotBlank(message = "Loan type name is required")
    @Size(max = 100, message = "Loan type name must not exceed 100 characters")
    private String name;

    @Min(value = 1, message = "Maximum tenure years must be at least 1")
    @Max(value = 30, message = "Maximum tenure years cannot exceed 30")
    private int maxTenureYears;

    @NotNull(message = "Maximum loan amount is required")
    @DecimalMin(value = "20000.00", inclusive = true, message = "Maximum loan amount must be at least ₹20,000")
    @DecimalMax(value = "1000000000.00", message = "Maximum loan amount must not exceed ₹100 Cr")
    private BigDecimal maxLoanAmount;


    @NotNull(message = "Interest rate is required")
    @DecimalMin(value = "6.5", inclusive = true, message = "Interest rate must be at least 6.5%")
    @DecimalMax(value = "15.0", message = "Interest rate cannot exceed 15 percent")
    @Digits(integer = 3, fraction = 2, message = "Interest rate format is invalid")
    private BigDecimal interestRate;


    @NotNull(message = "Penalty rate is required")
    @DecimalMin(value = "0.0", message = "Penalty rate cannot be negative")
    @DecimalMax(value = "5.0", message = "Penalty rate cannot exceed 5 percent")
    private BigDecimal penaltyRatePercent;

    @Min(value = 1, message = "Max loans per customer must be at least 1")
    @Max(value = 3, message = "Max loans per customer cannot exceed 3")
    private int maxLoansPerCustomerPerLoanType;
}
