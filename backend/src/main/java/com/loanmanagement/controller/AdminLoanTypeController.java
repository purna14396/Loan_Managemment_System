package com.loanmanagement.controller;

import com.loanmanagement.dto.LoanTypeDto;
import com.loanmanagement.service.AdminLoanTypeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/loan-types")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLoanTypeController {

    private final AdminLoanTypeService adminLoanTypeService;

    // ✅ Get all loan types
    @GetMapping
    public ResponseEntity<List<LoanTypeDto>> getAll() {
        return ResponseEntity.ok(adminLoanTypeService.getAllLoanTypes());
    }

    // ✅ Get a single loan type by ID
    @GetMapping("/{id}")
    public ResponseEntity<LoanTypeDto> getLoanTypeById(@PathVariable Long id) {
        LoanTypeDto dto = adminLoanTypeService.getLoanTypeById(id);
        return ResponseEntity.ok(dto);
    }

    // ✅ Create a new loan type with validation
    @PostMapping
    public ResponseEntity<LoanTypeDto> create(@Valid @RequestBody LoanTypeDto dto) {
        return ResponseEntity.ok(adminLoanTypeService.createLoanType(dto));
    }

    // ✅ Full update of a loan type (with validation)
    @PutMapping("/{id}")
    public ResponseEntity<LoanTypeDto> update(@PathVariable Long id, @Valid @RequestBody LoanTypeDto dto) {
        return ResponseEntity.ok(adminLoanTypeService.updateLoanType(id, dto));
    }

    // ✅ Delete a loan type (with 409 error if in use)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            adminLoanTypeService.deleteLoanType(id);
            return ResponseEntity.ok("Loan type deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    // ✅ Update configuration fields with validation
    @PutMapping("/loan-type-config/{id}")
    public ResponseEntity<LoanTypeDto> updateLoanTypeConfig(@PathVariable Long id, @Valid @RequestBody LoanTypeDto dto) {
        return ResponseEntity.ok(adminLoanTypeService.updateLoanTypeConfig(id, dto));
    }

    // ✅ Update financial fields with validation
    @PutMapping("/interest-rate-config/{id}")
    public ResponseEntity<LoanTypeDto> updateInterestAndPenaltyRates(
        @PathVariable Long id,
        @Valid @RequestBody LoanTypeDto dto) {
        return ResponseEntity.ok(adminLoanTypeService.updateInterestAndPenaltyRates(id, dto));
    }
}
