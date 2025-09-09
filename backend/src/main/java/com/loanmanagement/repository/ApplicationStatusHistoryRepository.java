package com.loanmanagement.repository;

import com.loanmanagement.model.ApplicationStatusHistory;
import com.loanmanagement.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, Long> {

    void deleteAllByLoan(Loan loan);

    // ✅ New method to get status history of a loan ordered by updatedAt
    List<ApplicationStatusHistory> findByLoanOrderByUpdatedAtAsc(Loan loan);
}

