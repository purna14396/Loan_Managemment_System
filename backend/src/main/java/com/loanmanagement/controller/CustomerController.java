package com.loanmanagement.controller;

import com.loanmanagement.dto.CustomerUpdateDto;
import com.loanmanagement.dto.UserProfileDto;
import com.loanmanagement.service.CustomerService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid; // ✅ Needed for validation

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    // ✅ Get current logged-in customer
    @GetMapping("/me")
    public UserProfileDto getCurrentUser(HttpServletRequest request) {
        return customerService.getCurrentUser(request);
    }

    // ✅ Update customer's profile with validation
    @PutMapping("/update")
    public UserProfileDto updateCustomer(@Valid @RequestBody CustomerUpdateDto updateDto, HttpServletRequest request) {
        return customerService.updateCustomer(updateDto, request);
    }
}
