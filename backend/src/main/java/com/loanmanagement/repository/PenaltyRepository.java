package com.loanmanagement.repository;

// Imports the Penalty entity for database operations
import com.loanmanagement.model.Penalty;

// Spring Data JPA interface providing CRUD methods
import org.springframework.data.jpa.repository.JpaRepository;

// Repository interface for Penalty entity with Long as ID type
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
    // No custom methods needed yet — inherits basic CRUD methods from JpaRepository
}
