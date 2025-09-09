package com.loanmanagement.service;

import com.loanmanagement.dto.*;
import com.loanmanagement.model.*;
import com.loanmanagement.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminLoanService Unit Tests")
class AdminLoanServiceTest {

    @Mock private LoanRepository loanRepository;
    @Mock private ApplicationStatusHistoryRepository historyRepository;
    @Mock private EmiPaymentRepository emiPaymentRepository;
    @Mock private EmiGenerationService emiGenerationService;
    @Mock private MailService mailService;

    @InjectMocks
    private AdminLoanService adminLoanService;

    private Loan loan;
    private User customer;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .userId(1L)
                .name("Purna Sai")
                .email("purna@example.com")
                .contactNumber("9999999999")
                .alternatePhoneNumber("8888888888")
                .gender("Male")
                .dateOfBirth("1999-01-01")
                .street("Main Street")
                .city("Hyderabad")
                .state("Telangana")
                .pincode("500001")
                .country("India")
                .build();

        loan = Loan.builder()
                .id(100L)
                .loanType(LoanType.builder().name("Home Loan").build())
                .customer(customer)
                .amount(BigDecimal.valueOf(500000))
                .appliedInterestRate(7.5) // ✅ Double, not BigDecimal
                .tenureYears(10)
                .purpose("House Construction")
                .income("₹30,000 - ₹70,000")      // ✅ valid range
                .employmentInfo("Software (IT)") // ✅ valid enum
                .aadhaar("123456789012")
                .pan("ABCDE1234F")
                .cibilScore(750)
                .loanStatus(Loan.LoanStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();
    }

    // =============================
    // getAllLoans
    // =============================
    @Nested
    @DisplayName("getAllLoans() Tests")
    class GetAllLoansTests {

        @Test
        @DisplayName("Should succeed when loans exist")
        void givenLoansExist_whenGetAllLoans_thenReturnLoanSummaries() {
            when(loanRepository.findAll()).thenReturn(List.of(loan));

            List<AdminLoanSummaryDto> result = adminLoanService.getAllLoans();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLoanType()).isEqualTo("Home Loan");
            verify(loanRepository).findAll();
        }

        @Test
        @DisplayName("Should return empty list when no loans exist")
        void givenNoLoans_whenGetAllLoans_thenReturnEmptyList() {
            when(loanRepository.findAll()).thenReturn(Collections.emptyList());

            List<AdminLoanSummaryDto> result = adminLoanService.getAllLoans();

            assertThat(result).isEmpty();
            verify(loanRepository).findAll();
        }
    }

    // =============================
    // getLoanById
    // =============================
    @Nested
    @DisplayName("getLoanById() Tests")
    class GetLoanByIdTests {

        @Test
        @DisplayName("Should succeed when loan exists")
        void givenLoanExists_whenGetLoanById_thenReturnDetailDto() {
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));

            AdminLoanDetailDto result = adminLoanService.getLoanById(100L);

            assertThat(result.getLoanType()).isEqualTo("Home Loan");
            assertThat(result.getCustomer().getName()).isEqualTo("Purna Sai");
            verify(loanRepository).findById(100L);
        }

        @Test
        @DisplayName("Should throw when loan does not exist")
        void givenLoanNotFound_whenGetLoanById_thenThrowException() {
            when(loanRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminLoanService.getLoanById(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Loan not found");

            verify(loanRepository).findById(999L);
        }
    }

    // =============================
    // updateLoanStatus
    // =============================
    @Nested
    @DisplayName("updateLoanStatus() Tests")
    class UpdateLoanStatusTests {

        @Test
        @DisplayName("Should approve loan and generate EMI schedule")
        void givenSubmittedLoan_whenApprove_thenGenerateSchedule() {
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));

            LoanStatusUpdateRequest request = new LoanStatusUpdateRequest();
            request.setStatus(Loan.LoanStatus.APPROVED);
            request.setComments("Approved by admin");

            adminLoanService.updateLoanStatus(100L, request);

            assertThat(loan.getLoanStatus()).isEqualTo(Loan.LoanStatus.APPROVED);
            verify(emiGenerationService).generateSchedule(loan);
            verify(historyRepository).save(any(ApplicationStatusHistory.class));
            verify(loanRepository).save(loan);
        }

        @Test
        @DisplayName("Should close loan, mark EMIs paid, and send mail")
        void givenLoan_whenClose_thenMarkEmisPaidAndSendMail() {
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));

            List<EmiPayment> emis = List.of(
                    EmiPayment.builder().amount(BigDecimal.valueOf(1000)).status(EmiPayment.EmiStatus.PENDING).build()
            );
            when(emiPaymentRepository.findByLoanIdOrderByDueDateAsc(100L)).thenReturn(emis);

            LoanStatusUpdateRequest request = new LoanStatusUpdateRequest();
            request.setStatus(Loan.LoanStatus.CLOSED);
            request.setComments("Loan closed");

            adminLoanService.updateLoanStatus(100L, request);

            assertThat(loan.getLoanStatus()).isEqualTo(Loan.LoanStatus.CLOSED);
            verify(emiPaymentRepository).saveAll(emis);
            verify(mailService).sendLoanClosedText(eq(loan), any(BigDecimal.class));
            verify(historyRepository).save(any(ApplicationStatusHistory.class));
        }

        @Test
        @DisplayName("Should throw when loan not found")
        void givenInvalidLoanId_whenUpdateLoanStatus_thenThrowException() {
            when(loanRepository.findById(999L)).thenReturn(Optional.empty());

            LoanStatusUpdateRequest request = new LoanStatusUpdateRequest();
            request.setStatus(Loan.LoanStatus.APPROVED);

            assertThatThrownBy(() -> adminLoanService.updateLoanStatus(999L, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Loan not found");

            verify(loanRepository).findById(999L);
            verifyNoInteractions(emiGenerationService, historyRepository, mailService);
        }
    }

    // =============================
    // deleteLoan
    // =============================
    @Nested
    @DisplayName("deleteLoan() Tests")
    class DeleteLoanTests {

        @ParameterizedTest
        @CsvSource({
                "REJECTED", "CLOSED"
        })
        @DisplayName("Should delete loan when status is REJECTED or CLOSED")
        void givenDeletableStatus_whenDeleteLoan_thenDeleteLoan(Loan.LoanStatus status) {
            loan.setLoanStatus(status);
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));

            adminLoanService.deleteLoan(100L);

            verify(emiPaymentRepository).deleteAllByLoan(loan);
            verify(historyRepository).deleteAllByLoan(loan);
            verify(loanRepository).delete(loan);
        }

        @Test
        @DisplayName("Should throw when loan is not REJECTED or CLOSED")
        void givenActiveLoan_whenDeleteLoan_thenThrowException() {
            loan.setLoanStatus(Loan.LoanStatus.APPROVED);
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));

            assertThatThrownBy(() -> adminLoanService.deleteLoan(100L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Loan can only be deleted");

            verify(loanRepository).findById(100L);
            verifyNoInteractions(emiPaymentRepository, historyRepository);
        }
    }
}
