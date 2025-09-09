package com.loanmanagement.dto;

import com.loanmanagement.model.EmiPayment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO representing a loan along with its EMI details.
 * Uses Lombok annotations for boilerplate code.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoanWithEmiDto {

    /** ID of the loan */
    private Long loanId;

    /** Principal amount of the loan */
    private BigDecimal amount;

    /** Interest rate applied at the time of approval */
    private double appliedInterestRate;

    /** Loan tenure in years */
    private int tenureYears;

    /** Number of EMIs remaining */
    private int remainingEmis;

    /** Total remaining amount across all unpaid EMIs */
    private BigDecimal remainingAmount;

    /** List of EMI payment records for this loan */
    private List<EmiPayment> emis;
}
