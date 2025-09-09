package com.loanmanagement.controller;

import com.loanmanagement.model.LoanType;
import com.loanmanagement.repository.LoanTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-types")
public class LoanTypeController {

    @Autowired
    private LoanTypeRepository loanTypeRepository;

    // ✅ Get all loan types (public)
    @GetMapping
    public List<LoanType> getAllLoanTypes() {
        return loanTypeRepository.findAll();
    }

    // ✅ Get loan type by ID with built-in global exception fallback
    @GetMapping("/{id}")
    public LoanType getLoanTypeById(@PathVariable Long id) {
        return loanTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LoanType not found with id " + id));
    }
}
