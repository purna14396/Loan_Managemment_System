package com.loanmanagement.controller;

import com.loanmanagement.dto.*;
import com.loanmanagement.service.AdminLoanService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/loans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLoanController {

    private final AdminLoanService adminLoanService;

    // ✅ Get all loans
    @GetMapping
    public ResponseEntity<List<AdminLoanSummaryDto>> getAllLoans() {
        return ResponseEntity.ok(adminLoanService.getAllLoans());
    }

    // ✅ Get specific loan details
    @GetMapping("/{id}")
    public ResponseEntity<AdminLoanDetailDto> getLoan(@PathVariable Long id) {
        return ResponseEntity.ok(adminLoanService.getLoanById(id));
    }

    // ✅ Delete a loan
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteLoan(@PathVariable Long id) {
        adminLoanService.deleteLoan(id);
        return ResponseEntity.ok("Loan deleted successfully");
    }

    // ✅ Update loan status — now validated
    @PutMapping("/{id}")
    public ResponseEntity<String> updateLoanStatus(
            @PathVariable Long id,
            @Valid @RequestBody LoanStatusUpdateRequest request
    ) {
        adminLoanService.updateLoanStatus(id, request);
        return ResponseEntity.ok("Loan status updated successfully");
    }
}
