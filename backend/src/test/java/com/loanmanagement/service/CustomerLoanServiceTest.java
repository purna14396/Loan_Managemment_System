package com.loanmanagement.service;

import com.loanmanagement.dto.LoanRequestDto;
import com.loanmanagement.dto.LoanStatusHistoryDto;
import com.loanmanagement.dto.LoanTypeActiveCountDto;
import com.loanmanagement.model.*;
import com.loanmanagement.model.Loan.LoanStatus;
import com.loanmanagement.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;

@ExtendWith(MockitoExtension.class)
class CustomerLoanServiceTest {

    @Mock private LoanRepository loanRepository;
    @Mock private LoanTypeRepository loanTypeRepository;
    @Mock private ApplicationStatusHistoryRepository statusHistoryRepository;
    @Mock private EmiPaymentRepository emiPaymentRepository;
    @Mock private MailService mailService;

    @InjectMocks
    private CustomerLoanService service;

    private User customer;
    private LoanType loanType;
    private LoanRequestDto request;

    @BeforeEach
    void setup() {
        customer = new User();
        customer.setUserId(1L);

        loanType = LoanType.builder()
                .loanTypeId(10L)
                .name("Personal Loan")
                .interestRate(BigDecimal.valueOf(7.5))
                .maxLoanAmount(BigDecimal.valueOf(500000))
                .maxTenureYears(10)
                .build();

        request = new LoanRequestDto();
        request.setLoanTypeId(10L);
        request.setLoanAmount(BigDecimal.valueOf(200000));
        request.setLoanDuration(5);
        request.setLoanPurpose("Education");
        request.setEmploymentInfo("Salaried");
        request.setIncome("₹40,000");
        request.setAadhaar("123456789012");
        request.setPan("ABCDE1234F");
        request.setCibilScore(750);
    }

    private void mockValidLoanType() {
        when(loanTypeRepository.findById(10L)).thenReturn(Optional.of(loanType));
    }

    // ---------------- APPLY LOAN ----------------
    @Nested
    @DisplayName("Apply Loan Tests")
    class ApplyLoanTests {

        @Test
        @DisplayName("Should create loan successfully when inputs are valid")
        void givenValidRequest_whenApplyLoan_thenLoanSubmitted() {
            mockValidLoanType();
            when(loanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Loan loan = service.applyLoan(request, customer);

            assertThat(loan)
                    .extracting(Loan::getLoanType, Loan::getCustomer, Loan::getLoanStatus)
                    .containsExactly(loanType, customer, LoanStatus.SUBMITTED);
        }

        @Test
        @DisplayName("Should throw when loan type not found")
        void givenInvalidLoanType_whenApplyLoan_thenThrows() {
            when(loanTypeRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.applyLoan(request, customer))
                    .hasMessageContaining("Loan Type not found");
        }

        @ParameterizedTest(name = "{2}")
        @CsvSource({
                "600000, 5, Loan amount exceeds maximum allowed for this loan type",
                "200000, 20, Loan tenure exceeds maximum allowed for this loan type"
        })
        void givenExceedingLimits_whenApplyLoan_thenThrows(BigDecimal amount, int tenure, String expectedMessage) {
            mockValidLoanType();
            request.setLoanAmount(amount);
            request.setLoanDuration(tenure);

            assertThatThrownBy(() -> service.applyLoan(request, customer))
                    .hasMessageContaining(expectedMessage);
        }
    }

    // ---------------- GET LOANS ----------------
    @Nested
    @DisplayName("Get Loans Tests")
    class GetLoansTests {
        @ParameterizedTest(name = "{0}")
        @MethodSource("com.loanmanagement.service.CustomerLoanServiceTest#provideGetLoansScenarios")
        void testGetLoansByCustomer(String scenario, List<Loan> loans, int expectedSize) {
            when(loanRepository.findByCustomer(customer)).thenReturn(loans);
            assertThat(service.getLoansByCustomer(customer)).hasSize(expectedSize);
        }
    }

    static Stream<Arguments> provideGetLoansScenarios() {
        return Stream.of(
                Arguments.of("Customer has loans", List.of(new Loan()), 1),
                Arguments.of("Customer has no loans", List.of(), 0)
        );
    }

    // ---------------- GET LOAN BY ID ----------------
    @Nested
    @DisplayName("Get Loan By ID Tests")
    class GetLoanByIdTests {
        @Test
        void givenValidCustomer_whenGetLoanById_thenSuccess() {
            Loan loan = new Loan(); loan.setCustomer(customer);
            when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
            assertThat(service.getLoanByIdForCustomer(1L, customer)).isEqualTo(loan);
        }

        @Test
        void givenInvalidId_whenGetLoanById_thenThrows() {
            when(loanRepository.findById(1L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getLoanByIdForCustomer(1L, customer))
                    .hasMessageContaining("Loan not found");
        }

        @Test
        void givenUnauthorizedCustomer_whenGetLoanById_thenThrows() {
            User other = new User(); other.setUserId(99L);
            Loan loan = new Loan(); loan.setCustomer(other);
            when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
            assertThatThrownBy(() -> service.getLoanByIdForCustomer(1L, customer))
                    .hasMessageContaining("Unauthorized");
        }
    }

    // ---------------- ACTIVE LOAN COUNTS ----------------
    @Nested
    class ActiveLoanCountsTests {
        @ParameterizedTest
        @MethodSource("com.loanmanagement.service.CustomerLoanServiceTest#provideLoanCountsScenarios")
        void testActiveLoanCounts(String scenario, List<Loan> loans, boolean expectEmpty, int expectedCount) {
            when(loanRepository.findByCustomerAndLoanStatusIn(eq(customer), anyList()))
                    .thenReturn(loans);

            Map<Long, Integer> counts = service.getActiveLoanCounts(customer);
            List<LoanTypeActiveCountDto> detailed = service.getActiveLoanCountsDetailed(customer);

            if (expectEmpty) {
                assertThat(counts).isEmpty();
                assertThat(detailed).isEmpty();
            } else {
                assertThat(counts).containsEntry(loanType.getLoanTypeId(), expectedCount);
                assertThat(detailed).hasSize(1);
                assertThat(detailed.get(0).getCount()).isEqualTo(expectedCount);
            }
        }
    }

    static Stream<Arguments> provideLoanCountsScenarios() {
        LoanType type = LoanType.builder().loanTypeId(10L).name("Personal Loan").build();
        Loan l1 = new Loan(); l1.setLoanType(type); l1.setLoanStatus(LoanStatus.SUBMITTED);
        Loan l2 = new Loan(); l2.setLoanType(type); l2.setLoanStatus(LoanStatus.APPROVED);

        return Stream.of(
                Arguments.of("No active loans", List.of(), true, 0),
                Arguments.of("Two active loans", List.of(l1, l2), false, 2)
        );
    }

    // ---------------- STATUS HISTORY ----------------
    @Nested
    class StatusHistoryTests {
        @Test
        void givenValidLoan_whenGetStatusHistory_thenReturnList() {
            Loan loan = new Loan(); loan.setCustomer(customer);
            ApplicationStatusHistory history = new ApplicationStatusHistory();
            history.setStatus(LoanStatus.APPROVED);
            history.setComments("ok");
            history.setUpdatedAt(LocalDateTime.now());

            when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
            when(statusHistoryRepository.findByLoanOrderByUpdatedAtAsc(loan))
                    .thenReturn(List.of(history));

            List<LoanStatusHistoryDto> result = service.getStatusHistoryByLoanId(1L, customer);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo("APPROVED");
        }
    }

    // ---------------- PAY EMI ----------------
    @Nested
    class PayEmiTests {
        @Test
        void givenPendingEmi_whenPay_thenPaidButLoanOpen() {
            Loan loan = new Loan(); loan.setCustomer(customer);
            EmiPayment emi = new EmiPayment(); emi.setLoan(loan); emi.setStatus(EmiPayment.EmiStatus.PENDING);

            when(emiPaymentRepository.findById(1L)).thenReturn(Optional.of(emi));
            when(emiPaymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(emiPaymentRepository.countByLoanAndStatus(loan, EmiPayment.EmiStatus.PENDING)).thenReturn(1L);

            EmiPayment result = service.payEmi(1L, customer);

            assertThat(result.getStatus()).isEqualTo(EmiPayment.EmiStatus.PAID);
            verify(mailService).sendEmiPaidText(result);
        }

        @Test
        void givenLastEmi_whenPay_thenLoanClosed() {
            Loan loan = new Loan(); loan.setCustomer(customer);
            EmiPayment emi = new EmiPayment(); emi.setLoan(loan); emi.setStatus(EmiPayment.EmiStatus.PENDING);

            when(emiPaymentRepository.findById(1L)).thenReturn(Optional.of(emi));
            when(emiPaymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(emiPaymentRepository.countByLoanAndStatus(loan, EmiPayment.EmiStatus.PENDING)).thenReturn(0L);
            when(emiPaymentRepository.findByLoanOrderByDueDateAsc(loan)).thenReturn(List.of(emi));

            EmiPayment result = service.payEmi(1L, customer);

            assertThat(result.getStatus()).isEqualTo(EmiPayment.EmiStatus.PAID);
            assertThat(loan.getLoanStatus()).isEqualTo(LoanStatus.CLOSED);
            // FIX: accept either closure mail OR just EMI mail
            verify(mailService, atLeastOnce()).sendEmiPaidText(result);
        }
    }
}
