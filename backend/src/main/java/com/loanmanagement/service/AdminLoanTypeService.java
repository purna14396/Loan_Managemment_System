package com.loanmanagement.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.loanmanagement.dto.LoanTypeDto;
import com.loanmanagement.model.LoanType;
import com.loanmanagement.repository.LoanTypeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminLoanTypeService {

    private final LoanTypeRepository loanTypeRepository;

    public List<LoanTypeDto> getAllLoanTypes() {
        return loanTypeRepository.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public LoanTypeDto getLoanTypeById(Long id) {
        LoanType type = loanTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan type not found"));
        return convertToDto(type);
    }

    public LoanTypeDto createLoanType(LoanTypeDto dto) {
        LoanType type = LoanType.builder()
                .name(dto.getName())
                .interestRate(dto.getInterestRate())
                .maxTenureYears(dto.getMaxTenureYears())
                .maxLoanAmount(dto.getMaxLoanAmount())
                .penaltyRatePercent(dto.getPenaltyRatePercent())
                .maxLoansPerCustomerPerLoanType(
                    dto.getMaxLoansPerCustomerPerLoanType() > 0
                        ? dto.getMaxLoansPerCustomerPerLoanType()
                        : 3)
                .build();

        loanTypeRepository.save(type);
        return convertToDto(type);
        
    }

    public LoanTypeDto updateLoanType(Long id, LoanTypeDto dto) {
        LoanType existing = loanTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan type not found"));

        existing.setName(dto.getName());
        existing.setInterestRate(dto.getInterestRate());
        existing.setMaxTenureYears(dto.getMaxTenureYears());
        existing.setMaxLoanAmount(dto.getMaxLoanAmount());
        existing.setPenaltyRatePercent(dto.getPenaltyRatePercent());
        existing.setMaxLoansPerCustomerPerLoanType(
            dto.getMaxLoansPerCustomerPerLoanType() > 0
                ? dto.getMaxLoansPerCustomerPerLoanType()
                : 3);

        loanTypeRepository.save(existing);
        return convertToDto(existing);
    }

    public void deleteLoanType(Long id) {
        LoanType existing = loanTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan type not found"));

        if (!existing.getLoans().isEmpty()) {
            throw new RuntimeException("Loan type is in use and cannot be deleted.");
        }

        loanTypeRepository.delete(existing);
    }

    public LoanTypeDto updateLoanTypeConfig(Long id, LoanTypeDto dto) {
        LoanType existing = loanTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan type not found"));

        existing.setName(dto.getName());
        existing.setMaxLoanAmount(dto.getMaxLoanAmount());
        existing.setMaxTenureYears(dto.getMaxTenureYears());
        existing.setMaxLoansPerCustomerPerLoanType(
            dto.getMaxLoansPerCustomerPerLoanType() > 0
                ? dto.getMaxLoansPerCustomerPerLoanType()
                : 3);

        loanTypeRepository.save(existing);
        return convertToDto(existing);
    }

    public LoanTypeDto updateInterestAndPenaltyRates(Long id, LoanTypeDto dto) {
        LoanType existing = loanTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan type not found"));

        existing.setInterestRate(dto.getInterestRate());
        existing.setPenaltyRatePercent(dto.getPenaltyRatePercent());

        loanTypeRepository.save(existing);
        return convertToDto(existing);
    }
    

    private LoanTypeDto convertToDto(LoanType loanType) {
        return LoanTypeDto.builder()
                .loanTypeId(loanType.getLoanTypeId())
                .name(loanType.getName())
                .interestRate(loanType.getInterestRate())
                .maxTenureYears(loanType.getMaxTenureYears())
                .maxLoanAmount(loanType.getMaxLoanAmount())
                .penaltyRatePercent(loanType.getPenaltyRatePercent())
                .maxLoansPerCustomerPerLoanType(loanType.getMaxLoansPerCustomerPerLoanType())
                .build();
    }
}
