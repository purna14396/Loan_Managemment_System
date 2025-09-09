package com.loanmanagement.service;

import com.loanmanagement.dto.LoanTypeDto;
import com.loanmanagement.model.LoanType;
import com.loanmanagement.repository.LoanTypeRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.*;
import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminLoanTypeServiceTest {

    @Mock
    private LoanTypeRepository loanTypeRepository;

    @InjectMocks
    private AdminLoanTypeService adminLoanTypeService;

    private LoanType sampleLoanType;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        sampleLoanType = LoanType.builder()
                .loanTypeId(1L)
                .name("Home Loan")
                .interestRate(BigDecimal.valueOf(7.5))
                .maxTenureYears(20)
                .maxLoanAmount(BigDecimal.valueOf(5_000_000))
                .penaltyRatePercent(BigDecimal.valueOf(2))
                .maxLoansPerCustomerPerLoanType(2)
                .loans(Collections.emptyList())
                .build();
    }

    private LoanTypeDto sampleDto() {
        return LoanTypeDto.builder()
                .loanTypeId(1L)
                .name("Home Loan")
                .interestRate(BigDecimal.valueOf(7.5))
                .maxTenureYears(20)
                .maxLoanAmount(BigDecimal.valueOf(5_000_000))
                .penaltyRatePercent(BigDecimal.valueOf(2))
                .maxLoansPerCustomerPerLoanType(2)
                .build();
    }

    // -------------------------------
    @Nested
    @DisplayName("Get All Loan Types")
    class GetAllLoanTypesTests {

        @Test
        @DisplayName("Should return all loan types when repository has data")
        void givenLoanTypesExist_whenGetAll_thenReturnList() {
            when(loanTypeRepository.findAll()).thenReturn(List.of(sampleLoanType));

            List<LoanTypeDto> result = adminLoanTypeService.getAllLoanTypes();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Home Loan");

            verify(loanTypeRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should return empty list when no loan types exist")
        void givenNoLoanTypes_whenGetAll_thenReturnEmptyList() {
            when(loanTypeRepository.findAll()).thenReturn(Collections.emptyList());

            List<LoanTypeDto> result = adminLoanTypeService.getAllLoanTypes();

            assertThat(result).isEmpty();
            verify(loanTypeRepository).findAll();
        }
    }

    // -------------------------------
    @Nested
    @DisplayName("Get Loan Type By ID")
    class GetLoanTypeByIdTests {

        @Test
        @DisplayName("Should return loan type when ID exists")
        void givenValidId_whenGetById_thenReturnDto() {
            when(loanTypeRepository.findById(1L)).thenReturn(Optional.of(sampleLoanType));

            LoanTypeDto result = adminLoanTypeService.getLoanTypeById(1L);

            assertThat(result.getName()).isEqualTo("Home Loan");
            verify(loanTypeRepository).findById(1L);
        }

        @Test
        @DisplayName("Should throw when loan type not found")
        void givenInvalidId_whenGetById_thenThrow() {
            when(loanTypeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminLoanTypeService.getLoanTypeById(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Loan type not found");

            verify(loanTypeRepository).findById(99L);
        }
    }

    // -------------------------------
    @Nested
    @DisplayName("Create Loan Type")
    class CreateLoanTypeTests {

        @Test
        @DisplayName("Should succeed when valid data is provided")
        void givenValidDto_whenCreate_thenReturnSavedDto() {
            LoanTypeDto dto = sampleDto();
            when(loanTypeRepository.save(any(LoanType.class))).thenAnswer(invocation -> {
                LoanType saved = invocation.getArgument(0);
                saved.setLoanTypeId(1L);
                return saved;
            });

            LoanTypeDto result = adminLoanTypeService.createLoanType(dto);

            assertThat(result.getLoanTypeId()).isEqualTo(1L);
            verify(loanTypeRepository).save(any(LoanType.class));
        }

        @ParameterizedTest(name = "Should default maxLoansPerCustomerPerLoanType to 3 when input is {0}")
        @CsvSource({"0", "-1"})
        void givenInvalidMaxLoans_whenCreate_thenDefaultTo3(int invalidMaxLoans) {
            LoanTypeDto dto = sampleDto();
            dto.setMaxLoansPerCustomerPerLoanType(invalidMaxLoans);

            when(loanTypeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            LoanTypeDto result = adminLoanTypeService.createLoanType(dto);

            assertThat(result.getMaxLoansPerCustomerPerLoanType()).isEqualTo(3);
        }
    }

    // -------------------------------
    @Nested
    @DisplayName("Update Loan Type")
    class UpdateLoanTypeTests {

        @Test
        @DisplayName("Should succeed when loan type exists")
        void givenValidIdAndDto_whenUpdate_thenReturnUpdatedDto() {
            when(loanTypeRepository.findById(1L)).thenReturn(Optional.of(sampleLoanType));
            when(loanTypeRepository.save(any())).thenReturn(sampleLoanType);

            LoanTypeDto dto = sampleDto();
            dto.setName("Updated Loan");

            LoanTypeDto result = adminLoanTypeService.updateLoanType(1L, dto);

            assertThat(result.getName()).isEqualTo("Updated Loan");
            verify(loanTypeRepository).save(any(LoanType.class));
        }

        @Test
        @DisplayName("Should throw when loan type not found")
        void givenInvalidId_whenUpdate_thenThrow() {
            when(loanTypeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminLoanTypeService.updateLoanType(99L, sampleDto()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Loan type not found");
        }
    }

    // -------------------------------
    @Nested
    @DisplayName("Delete Loan Type")
    class DeleteLoanTypeTests {

        @Test
        @DisplayName("Should succeed when loan type has no linked loans")
        void givenValidIdWithNoLoans_whenDelete_thenRemove() {
            when(loanTypeRepository.findById(1L)).thenReturn(Optional.of(sampleLoanType));

            adminLoanTypeService.deleteLoanType(1L);

            verify(loanTypeRepository).delete(sampleLoanType);
        }

        @Test
        @DisplayName("Should throw when loan type has existing loans")
        void givenLoanTypeWithLoans_whenDelete_thenThrow() {
            sampleLoanType.setLoans(List.of(new com.loanmanagement.model.Loan()));
            when(loanTypeRepository.findById(1L)).thenReturn(Optional.of(sampleLoanType));

            assertThatThrownBy(() -> adminLoanTypeService.deleteLoanType(1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Loan type is in use and cannot be deleted.");

            verify(loanTypeRepository, never()).delete(any());
        }
    }

    // -------------------------------
    @Nested
    @DisplayName("Update Loan Type Config")
    class UpdateLoanTypeConfigTests {

        @Test
        @DisplayName("Should update config fields successfully")
        void givenValidIdAndDto_whenUpdateConfig_thenReturnUpdatedDto() {
            when(loanTypeRepository.findById(1L)).thenReturn(Optional.of(sampleLoanType));
            when(loanTypeRepository.save(any())).thenReturn(sampleLoanType);

            LoanTypeDto dto = sampleDto();
            dto.setMaxLoanAmount(BigDecimal.valueOf(10_000_000));

            LoanTypeDto result = adminLoanTypeService.updateLoanTypeConfig(1L, dto);

            assertThat(result.getMaxLoanAmount()).isEqualTo(BigDecimal.valueOf(10_000_000));
            verify(loanTypeRepository).save(any());
        }
    }

    // -------------------------------
    @Nested
    @DisplayName("Update Interest and Penalty Rates")
    class UpdateInterestAndPenaltyTests {

        @Test
        @DisplayName("Should update rates successfully")
        void givenValidIdAndDto_whenUpdateRates_thenReturnUpdatedDto() {
            when(loanTypeRepository.findById(1L)).thenReturn(Optional.of(sampleLoanType));
            when(loanTypeRepository.save(any())).thenReturn(sampleLoanType);

            LoanTypeDto dto = sampleDto();
            dto.setInterestRate(BigDecimal.valueOf(8.5));
            dto.setPenaltyRatePercent(BigDecimal.valueOf(3));

            LoanTypeDto result = adminLoanTypeService.updateInterestAndPenaltyRates(1L, dto);

            assertThat(result.getInterestRate()).isEqualTo(BigDecimal.valueOf(8.5));
            assertThat(result.getPenaltyRatePercent()).isEqualTo(BigDecimal.valueOf(3));
            verify(loanTypeRepository).save(any());
        }
    }
}
