package com.loanmanagement.service;

import com.loanmanagement.dto.*;
import com.loanmanagement.model.*;
import com.loanmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLoanService {

    private final LoanRepository loanRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final EmiPaymentRepository emiPaymentRepository;
    private final EmiGenerationService emiGenerationService;
    private final MailService mailService; // ✅ added

    public List<AdminLoanSummaryDto> getAllLoans() {
        return loanRepository.findAll().stream().map(loan -> {
            UserDto customerDto = UserDto.builder()
                    .name(loan.getCustomer().getName())
                    .email(loan.getCustomer().getEmail())
                    .contactNumber(loan.getCustomer().getContactNumber())
                    .alternatePhoneNumber(loan.getCustomer().getAlternatePhoneNumber())
                    .gender(loan.getCustomer().getGender())
                    .dateOfBirth(loan.getCustomer().getDateOfBirth())
                    .street(loan.getCustomer().getStreet())
                    .city(loan.getCustomer().getCity())
                    .state(loan.getCustomer().getState())
                    .pincode(loan.getCustomer().getPincode())
                    .country(loan.getCustomer().getCountry())
                    .build();

            return AdminLoanSummaryDto.builder()
                    .id(loan.getId())
                    .loanType(loan.getLoanType().getName())
                    .appliedInterestRate(loan.getAppliedInterestRate())
                    .amount(loan.getAmount())
                    .tenureYears(loan.getTenureYears())
                    .loanStatus(loan.getLoanStatus().name())
                    .purpose(loan.getPurpose())
                    .submittedAt(loan.getSubmittedAt())
                    .pan(loan.getPan())
                    .aadhaar(loan.getAadhaar())
                    .employmentInfo(loan.getEmploymentInfo())
                    .income(loan.getIncome())
                    .cibilScore(loan.getCibilScore())
                    .customer(customerDto)
                    .build();
        }).collect(Collectors.toList());
    }

    public AdminLoanDetailDto getLoanById(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        UserDto customerDto = UserDto.builder()
                .name(loan.getCustomer().getName())
                .email(loan.getCustomer().getEmail())
                .contactNumber(loan.getCustomer().getContactNumber())
                .alternatePhoneNumber(loan.getCustomer().getAlternatePhoneNumber())
                .gender(loan.getCustomer().getGender())
                .dateOfBirth(loan.getCustomer().getDateOfBirth())
                .street(loan.getCustomer().getStreet())
                .city(loan.getCustomer().getCity())
                .state(loan.getCustomer().getState())
                .pincode(loan.getCustomer().getPincode())
                .country(loan.getCustomer().getCountry())
                .build();

        return AdminLoanDetailDto.builder()
                .id(loan.getId())
                .customer(customerDto)
                .loanType(loan.getLoanType().getName())
                .amount(loan.getAmount())
                .purpose(loan.getPurpose())
                .income(loan.getIncome())
                .employmentInfo(loan.getEmploymentInfo())
                .aadhaar(loan.getAadhaar())
                .pan(loan.getPan())
                .cibilScore(loan.getCibilScore())
                .tenureYears(loan.getTenureYears())
                .loanStatus(loan.getLoanStatus().name())
                .submittedAt(loan.getSubmittedAt())
                .build();
    }

    public void updateLoanStatus(Long id, LoanStatusUpdateRequest request) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        Loan.LoanStatus newStatus = request.getStatus();
        loan.setLoanStatus(newStatus);

        if (newStatus == Loan.LoanStatus.CLOSED) {
            loan.setClosedAt(LocalDateTime.now());

            // ✅ Mark all EMIs as PAID
            List<EmiPayment> emis = emiPaymentRepository.findByLoanIdOrderByDueDateAsc(loan.getId());
            for (EmiPayment emi : emis) {
                if (emi.getStatus() != EmiPayment.EmiStatus.PAID) {
                    emi.setStatus(EmiPayment.EmiStatus.PAID);
                    emi.setPaymentDate(LocalDateTime.now().toLocalDate());
                    emi.setTransactionRef(java.util.UUID.randomUUID().toString());
                }
            }
            emiPaymentRepository.saveAll(emis);

            // ✅ Compute total repayable (sum of all EMIs) and send closure email
            try {
                BigDecimal totalRepayable = emis.stream()
                        .map(EmiPayment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                mailService.sendLoanClosedText(loan, totalRepayable);
            } catch (Exception ignore) { /* don’t block admin flow on email */ }
        }

        if (newStatus == Loan.LoanStatus.APPROVED) {
            emiGenerationService.generateSchedule(loan);
        }

        loanRepository.save(loan);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .loan(loan)
                .status(newStatus)
                .comments(request.getComments())
                .updatedAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);
    }

    @Transactional
    public void deleteLoan(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // Allow deletion only if REJECTED or CLOSED
        if (!(loan.getLoanStatus() == Loan.LoanStatus.REJECTED || loan.getLoanStatus() == Loan.LoanStatus.CLOSED)) {
            throw new RuntimeException("Loan can only be deleted if it is REJECTED or CLOSED");
        }

        emiPaymentRepository.deleteAllByLoan(loan);
        historyRepository.deleteAllByLoan(loan);
        loanRepository.delete(loan);
    }
}
