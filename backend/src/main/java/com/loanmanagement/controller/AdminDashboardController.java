package com.loanmanagement.controller;

import com.loanmanagement.dto.AdminDashboardDto;
import com.loanmanagement.dto.UserBreakdownDto;
import com.loanmanagement.dto.LoanBreakdownDto;
import com.loanmanagement.service.AdminDashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/summary")
    public AdminDashboardDto getSummary() {
        return dashboardService.getSummaryStats();
    }

    @GetMapping("/users")
    public UserBreakdownDto getUserStats() {
        return dashboardService.getUserBreakdown();
    }

    @GetMapping("/loans")
    public LoanBreakdownDto getLoanStats() {
        return dashboardService.getLoanBreakdown();
    }
}
