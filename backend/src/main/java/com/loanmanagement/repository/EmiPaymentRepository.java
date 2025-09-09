package com.loanmanagement.repository;

import com.loanmanagement.model.EmiPayment;
import com.loanmanagement.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmiPaymentRepository extends JpaRepository<EmiPayment, Long> {

    // ✅ Custom method to delete all EMI payments for a given loan
    void deleteAllByLoan(Loan loan);

    // (Optional) Get all EMI payments for a loan, ordered by payment date
    List<EmiPayment> findByLoanOrderByPaymentDateAsc(Loan loan);

    long countByLoan(Loan loan);

    // fetch EMIs in due-date order (use this in CustomerLoanService)
    List<EmiPayment> findByLoanOrderByDueDateAsc(Loan loan);

    // (optional) if you prefer by loanId, you can also keep this
    List<EmiPayment> findByLoanIdOrderByDueDateAsc(Long loanId);

    // ✅ NEW: count remaining PENDING EMIs
    long countByLoanAndStatus(Loan loan, EmiPayment.EmiStatus status);
    
    List<EmiPayment> findByStatus(EmiPayment.EmiStatus status);

}
