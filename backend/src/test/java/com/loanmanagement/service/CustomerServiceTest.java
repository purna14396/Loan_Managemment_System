package com.loanmanagement.service;

import com.loanmanagement.dto.CustomerUpdateDto;
import com.loanmanagement.dto.UserProfileDto;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class CustomerServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private CustomerService customerService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        sampleUser = User.builder()
                .userId(1L)
                .username("purna")
                .name("Purna Sai")
                .email("purna@example.com")
                .password("encodedPass")
                .role(User.Role.CUSTOMER)
                .contactNumber("9876543210")
                .pincode("500001")
                .build();
    }

    // -------------------- getCurrentUser Tests --------------------
    @Nested
    @DisplayName("getCurrentUser Tests")
    class GetCurrentUserTests {

        @Test
        @DisplayName("Should succeed when valid request is provided")
        void givenValidRequest_whenGetCurrentUser_thenReturnUserProfile() {
            CustomerService spyService = spy(customerService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);

            UserProfileDto result = spyService.getCurrentUser(request);

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("purna@example.com");
            assertThat(result.getUsername()).isEqualTo("purna");
        }

        @Test
        @DisplayName("Should throw when request does not map to a user")
        void givenInvalidRequest_whenGetCurrentUser_thenThrowException() {
            CustomerService spyService = spy(customerService);
            doThrow(new IllegalArgumentException("Invalid token"))
                    .when(spyService).getUserFromRequest(request);

            assertThatThrownBy(() -> spyService.getCurrentUser(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid token");
        }
    }

    // -------------------- updateCustomer Tests --------------------
    @Nested
    @DisplayName("updateCustomer Tests")
    class UpdateCustomerTests {

        @Test
        @DisplayName("Should update profile when valid DTO is provided")
        void givenValidDto_whenUpdateCustomer_thenUpdateAndReturnDto() {
            CustomerService spyService = spy(customerService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);

            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName("Updated Purna");
            dto.setCity("Hyderabad");
            dto.setPassword("newPassword");
            dto.setPincode("600001");

            when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPass");

            UserProfileDto result = spyService.updateCustomer(dto, request);

            assertThat(result.getName()).isEqualTo("Updated Purna");
            assertThat(result.getCity()).isEqualTo("Hyderabad");
            assertThat(result.getPincode()).isEqualTo("600001");

            verify(userRepository).save(sampleUser);
            verify(passwordEncoder).encode("newPassword");
        }

        @ParameterizedTest(name = "Should not encode password when password is \"{0}\"")
        @CsvSource({",", "''", "'   '"})
        void givenBlankOrNullPassword_whenUpdateCustomer_thenSkipEncoding(String passwordInput) {
            CustomerService spyService = spy(customerService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);

            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName("Updated Again");
            dto.setPassword(passwordInput);

            UserProfileDto result = spyService.updateCustomer(dto, request);

            assertThat(result.getName()).isEqualTo("Updated Again");
            verify(passwordEncoder, never()).encode(anyString());
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Should throw when user not found from request")
        void givenInvalidRequest_whenUpdateCustomer_thenThrowException() {
            CustomerService spyService = spy(customerService);
            doThrow(new IllegalArgumentException("Unauthorized"))
                    .when(spyService).getUserFromRequest(request);

            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName("Does not matter");

            assertThatThrownBy(() -> spyService.updateCustomer(dto, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Unauthorized");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should update all fields including optional ones")
        void givenFullDto_whenUpdateCustomer_thenUpdateAllFields() {
            CustomerService spyService = spy(customerService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);

            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName("New Name");
            dto.setContactNumber("9998887776");
            dto.setAlternatePhoneNumber("8887776665");
            dto.setDateOfBirth("1999-12-31");
            dto.setGender("Male");
            dto.setStreet("MG Road");
            dto.setCity("Bangalore");
            dto.setState("Karnataka");
            dto.setPincode("560001");
            dto.setCountry("India");
            dto.setPassword("securePass");

            when(passwordEncoder.encode("securePass")).thenReturn("encodedPass");

            UserProfileDto result = spyService.updateCustomer(dto, request);

            assertThat(result.getName()).isEqualTo("New Name");
            assertThat(result.getCity()).isEqualTo("Bangalore");
            assertThat(result.getPincode()).isEqualTo("560001");
            assertThat(result.getCountry()).isEqualTo("India");

            verify(userRepository).save(sampleUser);
            verify(passwordEncoder).encode("securePass");
        }
    }
}
