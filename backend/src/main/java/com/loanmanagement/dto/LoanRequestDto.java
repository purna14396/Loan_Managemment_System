package com.loanmanagement.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanRequestDto {

    @NotNull(message = "Loan type is required")
    private Long loanTypeId;

    @NotNull(message = "Loan amount is required")
    @DecimalMin(value = "20000.00", message = "Loan amount must be at least ₹20,000")
    @DecimalMax(value = "1000000000.00", message = "Loan amount must not exceed ₹100 Crores")
    @Digits(integer = 13, fraction = 2, message = "Invalid loan amount format")
    private BigDecimal loanAmount;

    @Min(value = 1, message = "Loan duration must be at least 1 year")
    @Max(value = 30, message = "Loan duration cannot exceed 30 years")
    private int loanDuration;

    @NotBlank(message = "Loan purpose is required")
    @Size(min = 3, max = 300, message = "Loan purpose must be between 3 and 300 characters")
    private String loanPurpose;

    @NotBlank(message = "Income is required")
    @Pattern(
        regexp = "N/A|< ₹30,000|₹30,000 - ₹70,000|₹70,001 - ₹1,00,000|> ₹1,00,000",
        message = "Invalid income range"
    )
    private String income;

    @NotBlank(message = "Employment info is required")
    @Pattern(
        regexp = "Software \\(IT\\)|Software \\(Non-IT\\)|Entrepreneur|Farming / Agriculture|Government Employee|Self-Employed / Freelancer|Student|Healthcare / Medical|Education / Teaching|Other",
        message = "Invalid employment info"
    )
    @Size(min = 3, max = 100, message = "Employment info must be between 3 and 100 characters")
    private String employmentInfo;

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "\\d{12}", message = "Aadhaar must be exactly 12 digits")
    private String aadhaar;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "[A-Z]{5}[0-9]{4}[A-Z]", message = "Invalid PAN format (e.g., ABCDE1234F)")
    private String pan;

    @Min(value = 300, message = "CIBIL score must be at least 300")
    @Max(value = 900, message = "CIBIL score cannot exceed 900")
    private int cibilScore;
}
