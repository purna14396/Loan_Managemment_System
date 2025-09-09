package com.loanmanagement.service;

import com.loanmanagement.dto.LoanStatusHistoryDto;
import com.loanmanagement.dto.LoanRequestDto;
import com.loanmanagement.dto.LoanTypeActiveCountDto;
import com.loanmanagement.dto.LoanWithEmiDto;
import com.loanmanagement.model.ApplicationStatusHistory;
import com.loanmanagement.model.EmiPayment;
import com.loanmanagement.model.Loan;
import com.loanmanagement.model.Loan.LoanStatus;
import com.loanmanagement.model.LoanType;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.ApplicationStatusHistoryRepository;
import com.loanmanagement.repository.EmiPaymentRepository;
import com.loanmanagement.repository.LoanRepository;
import com.loanmanagement.repository.LoanTypeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RequiredArgsConstructor
@Service
public class CustomerLoanService {

    private final LoanRepository loanRepository;
    private final LoanTypeRepository loanTypeRepository;
    private final ApplicationStatusHistoryRepository statusHistoryRepository;
    private final EmiPaymentRepository emiPaymentRepository;
    private final MailService mailService;

    public Loan applyLoan(LoanRequestDto dto, User customer) {
        LoanType loanType = loanTypeRepository.findById(dto.getLoanTypeId())
                .orElseThrow(() -> new RuntimeException("Loan Type not found"));

        if (dto.getLoanAmount() == null)
            throw new RuntimeException("Loan amount is required");
        if (dto.getLoanDuration() <= 0)
            throw new RuntimeException("Loan duration must be positive");
        if (dto.getLoanPurpose() == null || dto.getLoanPurpose().trim().isEmpty())
            throw new RuntimeException("Loan purpose is required");
        if ("Student".equals(dto.getEmploymentInfo()) && !"N/A".equals(dto.getIncome()))
            throw new RuntimeException("For Students, monthly income must be 'N/A'");
        if (dto.getLoanAmount().compareTo(loanType.getMaxLoanAmount()) > 0)
            throw new RuntimeException("Loan amount exceeds maximum allowed for this loan type");
        if (dto.getLoanDuration() > loanType.getMaxTenureYears())
            throw new RuntimeException("Loan tenure exceeds maximum allowed for this loan type");

        Loan loan = new Loan();
        loan.setLoanType(loanType);
        loan.setAppliedInterestRate(loanType.getInterestRate().doubleValue());
        loan.setIncome(dto.getIncome());
        loan.setAmount(dto.getLoanAmount());
        loan.setTenureYears(dto.getLoanDuration());
        loan.setPurpose(dto.getLoanPurpose().trim());
        loan.setEmploymentInfo(dto.getEmploymentInfo());
        loan.setAadhaar(dto.getAadhaar());
        loan.setPan(dto.getPan());
        loan.setCibilScore(dto.getCibilScore());
        loan.setLoanStatus(LoanStatus.SUBMITTED);
        loan.setCustomer(customer);
        loan.setSubmittedAt(java.time.LocalDateTime.now());

        return loanRepository.save(loan);
    }

    public List<Loan> getLoansByCustomer(User customer) {
        return loanRepository.findByCustomer(customer);
    }

    public Loan getLoanByIdForCustomer(Long loanId, User customer) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        if (!loan.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new RuntimeException("Unauthorized access to loan");
        }
        return loan;
    }

    public Map<Long, Integer> getActiveLoanCounts(User customer) {
        List<Loan> activeLoans = loanRepository.findByCustomerAndLoanStatusIn(
                customer,
                List.of(LoanStatus.SUBMITTED, LoanStatus.APPROVED));

        return activeLoans.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        loan -> loan.getLoanType().getLoanTypeId(),
                        java.util.stream.Collectors.reducing(0, e -> 1, Integer::sum)));
    }

    public List<LoanTypeActiveCountDto> getActiveLoanCountsDetailed(User customer) {
        List<Loan> activeLoans = loanRepository.findByCustomerAndLoanStatusIn(
                customer,
                List.of(Loan.LoanStatus.SUBMITTED, Loan.LoanStatus.APPROVED));

        Map<Long, LoanTypeActiveCountDto> map = new HashMap<>();

        for (Loan loan : activeLoans) {
            Long loanTypeId = loan.getLoanType().getLoanTypeId();
            String loanTypeName = loan.getLoanType().getName();

            map.compute(loanTypeId, (id, existing) -> {
                if (existing == null) {
                    return new LoanTypeActiveCountDto(loanTypeId, loanTypeName, 1);
                } else {
                    existing.setCount(existing.getCount() + 1);
                    return existing;
                }
            });
        }

        return new ArrayList<>(map.values());
    }

    public List<LoanStatusHistoryDto> getStatusHistoryByLoanId(Long loanId, User customer) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!loan.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new RuntimeException("Access denied for this loan");
        }

        List<ApplicationStatusHistory> historyList = statusHistoryRepository.findByLoanOrderByUpdatedAtAsc(loan);

        return historyList.stream()
                .map(h -> LoanStatusHistoryDto.builder()
                        .status(h.getStatus().name())
                        .comments(h.getComments())
                        .updatedAt(h.getUpdatedAt())
                        .build())
                .toList();
    }

    // ✅ Fetch EMI list with loan details
    public LoanWithEmiDto getLoanWithEmis(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        List<EmiPayment> emis = emiPaymentRepository.findByLoanOrderByDueDateAsc(loan);

        int remainingEmis = (int) emis.stream()
                .filter(e -> e.getStatus() != EmiPayment.EmiStatus.PAID)
                .count();

        BigDecimal remainingAmount = emis.stream()
                .filter(e -> e.getStatus() != EmiPayment.EmiStatus.PAID)
                .map(EmiPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        Long id = loan.getId(); // or loan.getLoanId()

        return new LoanWithEmiDto(
                id,
                loan.getAmount(),
                loan.getAppliedInterestRate(),
                loan.getTenureYears(),
                remainingEmis,
                remainingAmount,
                emis);
    }

    // ✅ Pay EMI + auto-close loan when last EMI paid (also email loan closure)
    @Transactional
    public EmiPayment payEmi(Long emiId, User customer) {
        EmiPayment emi = emiPaymentRepository.findById(emiId)
                .orElseThrow(() -> new RuntimeException("EMI not found"));

        // ownership
        if (!emi.getLoan().getCustomer().getUserId().equals(customer.getUserId())) {
            throw new RuntimeException("Unauthorized access to this EMI");
        }
        // status
        if (emi.getStatus() != EmiPayment.EmiStatus.PENDING) {
            throw new RuntimeException("EMI is not pending or already paid");
        }

        // mark paid
        emi.setStatus(EmiPayment.EmiStatus.PAID);
        emi.setPaymentDate(java.time.LocalDate.now());
        emi.setTransactionRef(java.util.UUID.randomUUID().toString());

        // save first
        EmiPayment saved = emiPaymentRepository.save(emi);

        // 🔔 send plain-text payment receipt (non-blocking try/catch)
        try {
            mailService.sendEmiPaidText(saved);
        } catch (Exception ignore) {
        }

        // 🔒 If no more PENDING EMIs, close the loan
        Loan loan = saved.getLoan();
        long pendingLeft = emiPaymentRepository.countByLoanAndStatus(loan, EmiPayment.EmiStatus.PENDING);
        if (pendingLeft == 0) {
            loan.setLoanStatus(LoanStatus.CLOSED);
            loan.setClosedAt(LocalDateTime.now());
            loanRepository.save(loan);

            // compute totals for closure email: total repayable = sum of all EMIs
            try {
                List<EmiPayment> allEmis = emiPaymentRepository.findByLoanOrderByDueDateAsc(loan);
                BigDecimal totalRepayable = allEmis.stream()
                        .map(EmiPayment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);

                mailService.sendLoanClosedText(loan, totalRepayable);
            } catch (Exception ignore) {
            }
        }

        return saved;
    }
}
