package com.loanmanagement.service;

import com.loanmanagement.dto.AdminDashboardDto;
import com.loanmanagement.dto.LoanBreakdownDto;
import com.loanmanagement.dto.UserBreakdownDto;
import com.loanmanagement.model.EmiPayment;
import com.loanmanagement.model.Loan;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.EmiPaymentRepository;
import com.loanmanagement.repository.LoanRepository;
import com.loanmanagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final EmiPaymentRepository emiPaymentRepository;

    public AdminDashboardDto getSummaryStats() {
        long totalUsers = userRepository.count();
        long totalLoanApplications = loanRepository.count();

        BigDecimal totalApprovedLoanAmount = loanRepository
        .findAllByLoanStatusIn(List.of(Loan.LoanStatus.APPROVED, Loan.LoanStatus.CLOSED))
        .stream()
        .map(Loan::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);


        BigDecimal totalRepaidAmount = emiPaymentRepository
                .findByStatus(EmiPayment.EmiStatus.PAID)
                .stream()
                .map(EmiPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .totalLoanApplications(totalLoanApplications)
                .totalApprovedLoanAmount(totalApprovedLoanAmount)
                .totalRepaidAmount(totalRepaidAmount)
                .build();
    }

    public UserBreakdownDto getUserBreakdown() {
        long adminCount = userRepository.countByRole(User.Role.ADMIN);
        long customerCount = userRepository.countByRole(User.Role.CUSTOMER);

        return UserBreakdownDto.builder()
                .totalAdmins(adminCount)
                .totalCustomers(customerCount)
                .build();
    }

    public LoanBreakdownDto getLoanBreakdown() {
        long approved = loanRepository.countByLoanStatus(Loan.LoanStatus.APPROVED);
        long closed = loanRepository.countByLoanStatus(Loan.LoanStatus.CLOSED);
        long rejected = loanRepository.countByLoanStatus(Loan.LoanStatus.REJECTED);

        return LoanBreakdownDto.builder()
                .totalApprovedLoans(approved)
                .totalClosedLoans(closed)
                .totalRejectedLoans(rejected)
                .build();
    }
}
