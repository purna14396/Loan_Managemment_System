package com.loanmanagement.repository;

import com.loanmanagement.model.Loan;
import com.loanmanagement.model.User;
import com.loanmanagement.model.Loan.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    // 🔍 Find all loans belonging to a particular customer
    List<Loan> findByCustomer(User customer);

    // ✅ Count only approved loans for a customer
    int countByCustomerAndLoanStatus(User customer, LoanStatus status);

    // ✅ NEW: Count active loans grouped by type (for apply rule enforcement)
    List<Loan> findByCustomerAndLoanStatusIn(User customer, List<LoanStatus> statuses);
    
        // Count active loans for a customer
    @Query("SELECT COUNT(l) FROM Loan l WHERE l.customer = :customer AND l.loanStatus IN :statuses")
    Long countByCustomerAndLoanStatusIn(@Param("customer") User customer, @Param("statuses") List<Loan.LoanStatus> statuses);

    // Delete all loans for a specific customer
    void deleteAllByCustomer(User customer);
    
    long countByLoanStatus(Loan.LoanStatus status);
    List<Loan> findAllByLoanStatus(Loan.LoanStatus status);
    
    // LoanRepository.java
    List<Loan> findAllByLoanStatusIn(Collection<Loan.LoanStatus> statuses);


    
    
}
