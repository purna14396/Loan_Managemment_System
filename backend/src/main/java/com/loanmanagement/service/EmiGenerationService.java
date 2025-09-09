package com.loanmanagement.service;

import com.loanmanagement.model.EmiPayment;
import com.loanmanagement.model.Loan;
import com.loanmanagement.repository.EmiPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmiGenerationService {

    private final EmiPaymentRepository emiPaymentRepository;

    // use a high precision context for intermediate steps
    private static final MathContext MC = new MathContext(34, RoundingMode.HALF_UP);
    private static final RoundingMode RM = RoundingMode.HALF_UP;

    public void generateSchedule(Loan loan) {
        // Avoid duplicates
        if (emiPaymentRepository.countByLoan(loan) > 0) {
            return;
        }

        BigDecimal monthlyEmi = calculateEmi(
                loan.getAmount(),                 // BigDecimal
                loan.getAppliedInterestRate(),    // double %
                loan.getTenureYears()             // years
        ).setScale(2, RM);                        // store as 2 dp

        int totalMonths = loan.getTenureYears() * 12;
        LocalDate firstDueDate = LocalDate.now().plusMonths(1);

        BigDecimal totalRepayable = monthlyEmi.multiply(BigDecimal.valueOf(totalMonths), MC);
        BigDecimal remainingBalance = totalRepayable; // ✅ Total repayable = principal + interest


        List<EmiPayment> emis = new ArrayList<>();

        for (int i = 0; i < totalMonths; i++) {
            // reduce remaining balance; never negative
            remainingBalance = remainingBalance.subtract(monthlyEmi, MC);
            if (remainingBalance.signum() < 0) {
                remainingBalance = BigDecimal.ZERO;
            }

            EmiPayment emi = EmiPayment.builder()
                    .loan(loan)
                    .amount(monthlyEmi)                                   // BigDecimal(2 dp)
                    .dueDate(firstDueDate.plusMonths(i))
                    .status(EmiPayment.EmiStatus.PENDING)
                    .remainingBalance(remainingBalance.setScale(2, RM))   // 2 dp
                    .build();

            emis.add(emi);
        }

        emiPaymentRepository.saveAll(emis);
    }

    private BigDecimal calculateEmi(BigDecimal principal, double annualRatePercent, int tenureYears) {
        // EMI = P * r * (1+r)^n / [(1+r)^n - 1]
        int n = tenureYears * 12;
        if (n <= 0) return BigDecimal.ZERO;

        // r = monthly rate (decimal)
        BigDecimal r = BigDecimal.valueOf(annualRatePercent)
                .divide(BigDecimal.valueOf(1200), MC); // 12*100

        if (r.compareTo(BigDecimal.ZERO) == 0) {
            // No interest: simple division
            return principal.divide(BigDecimal.valueOf(n), MC);
        }

        BigDecimal onePlusR = BigDecimal.ONE.add(r, MC);
        BigDecimal pow = onePlusR.pow(n, MC);
        BigDecimal numerator = principal.multiply(r, MC).multiply(pow, MC);
        BigDecimal denominator = pow.subtract(BigDecimal.ONE, MC);

        return numerator.divide(denominator, MC);
    }
}
