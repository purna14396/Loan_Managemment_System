package com.loanmanagement.repository;

// Imports the LoanType entity for database operations
import com.loanmanagement.model.LoanType;

// Spring Data JPA interface providing CRUD methods
import org.springframework.data.jpa.repository.JpaRepository;

// Repository interface for LoanType entity with Long as ID type
public interface LoanTypeRepository extends JpaRepository<LoanType, Long> {
    // No custom methods needed yet — inherits basic CRUD methods from JpaRepository
}
