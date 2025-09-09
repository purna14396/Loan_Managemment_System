package com.loanmanagement.repository;

// Imports the OtpLog entity for database operations
import com.loanmanagement.model.OtpLog;

// Spring Data JPA interface providing CRUD methods
import org.springframework.data.jpa.repository.JpaRepository;

// Repository interface for OtpLog entity with Long as ID type
public interface OtpLogRepository extends JpaRepository<OtpLog, Long> {
    // No custom methods needed yet — inherits basic CRUD methods from JpaRepository
}
