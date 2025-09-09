package com.loanmanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "loans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {
    
    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ApplicationStatusHistory> statusHistory;


    public enum LoanStatus {
        SUBMITTED,   // When the customer submits a loan
        APPROVED,    // When admin approves
        REJECTED,    // When admin rejects
        CLOSED       // When loan is closed or completed
    }


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne
    @JoinColumn(name = "loan_type_id")
    @JsonIgnoreProperties("loans")
    private LoanType loanType;

    
    
    @NotNull(message = "Applied interest rate is required")
    @Column(name = "applied_interest_rate")
    private Double appliedInterestRate;
    
    
    


    @NotNull(message = "Loan amount is required")
    @DecimalMin(value = "500.00", inclusive = true, message = "Loan amount must be at least ₹500")
    @DecimalMax(value = "1000000000.00", message = "Loan amount must not exceed ₹100 Crores")
    @Digits(integer = 13, fraction = 2, message = "Invalid loan amount format")
    @Column(precision = 15, scale = 2)
    private java.math.BigDecimal amount;


    @NotBlank(message = "Loan purpose is required")
    @Size(min = 3, max = 300, message = "Purpose must be between 3 and 300 characters")
    private String purpose;

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
    @Pattern(regexp = "\\d{12}", message = "Aadhaar must be 12 digits")
    private String aadhaar;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "[A-Z]{5}[0-9]{4}[A-Z]", message = "Invalid PAN format")
    private String pan;


    @Min(value = 300, message = "CIBIL score must be at least 300")
    @Max(value = 900, message = "CIBIL score cannot exceed 900")
    private int cibilScore;

    @Min(value = 1, message = "Tenure must be at least 1 year")
    @Max(value = 30, message = "Tenure cannot exceed 30 years")
    private int tenureYears;

    @NotNull(message = "Loan status is required")
    @Enumerated(EnumType.STRING)
    private LoanStatus loanStatus;

    private LocalDateTime submittedAt;
    private LocalDateTime closedAt;
}
