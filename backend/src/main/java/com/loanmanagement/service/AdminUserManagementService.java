package com.loanmanagement.service;

import com.loanmanagement.dto.UserManagementDto;
import com.loanmanagement.model.Loan;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.ApplicationStatusHistoryRepository;
import com.loanmanagement.repository.ChatMessageRepository;
import com.loanmanagement.repository.EmiPaymentRepository;
import com.loanmanagement.repository.LoanRepository;
import com.loanmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ✅ Added import

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private ApplicationStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;

    /**
     * Get all users with active loan count for customers.
     * Active loans = SUBMITTED + APPROVED only.
     */
    public List<UserManagementDto> getAllUsersWithLoanCount() {
        return userRepository.findAll().stream().map(user -> {
            Long activeLoanCount = null;
            if (user.getRole() == User.Role.CUSTOMER) {
                activeLoanCount = loanRepository.countByCustomerAndLoanStatusIn(
                        user,
                        List.of(
                                Loan.LoanStatus.SUBMITTED,
                                Loan.LoanStatus.APPROVED
                        )
                );
            }
            return new UserManagementDto(
                    user.getUserId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name(),
                    activeLoanCount,
                    user.getCreatedAt() // ✅ Added
            );
        }).collect(Collectors.toList());
    }


    /**
     * Delete a user safely.
     * - Admins: Can be deleted directly.
     * - Customers: Can only be deleted if no active loans (SUBMITTED / APPROVED).
     *   All CLOSED/REJECTED loans and their related records will be removed.
     */
    @Transactional
    public String deleteUserWithoutKeyCheck(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String roleName = user.getRole().name().toLowerCase();

        if (user.getRole() == User.Role.CUSTOMER) {
            // Check active loan count (SUBMITTED / APPROVED)
            Long activeLoanCount = loanRepository.countByCustomerAndLoanStatusIn(
                    user,
                    List.of(Loan.LoanStatus.SUBMITTED, Loan.LoanStatus.APPROVED)
            );

            if (activeLoanCount > 0) {
                throw new RuntimeException("Cannot delete customer with active loans.");
            }

            // Delete chat messages first
            chatMessageRepository.deleteAllByCustomer(user);

            // Fetch all loans for the customer (may be empty)
            List<Loan> allLoans = loanRepository.findByCustomer(user);

            if (!allLoans.isEmpty()) {
                // Delete related history & payments first
                for (Loan loan : allLoans) {
                    statusHistoryRepository.deleteAllByLoan(loan);
                    emiPaymentRepository.deleteAllByLoan(loan);
                }

                // Delete loans
                loanRepository.deleteAll(allLoans);
            }
        }

        // Delete the user (admins or customers)
        userRepository.delete(user);

        return "User (" + roleName + ") deleted successfully";
    }

}
