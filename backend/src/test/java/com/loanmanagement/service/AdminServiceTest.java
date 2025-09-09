package com.loanmanagement.service;

import com.loanmanagement.dto.AdminUpdateDto;
import com.loanmanagement.dto.CustomerUpdateDto;
import com.loanmanagement.dto.UserProfileDto;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AdminService adminService;

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
                .role(User.Role.ADMIN)
                .contactNumber("9876543210")
                .alternatePhoneNumber("9123456789")
                .dateOfBirth("1999-09-22")
                .gender("Male")
                .street("Tech Street")
                .city("Hyderabad")
                .state("Telangana")
                .pincode("500001")
                .country("India")
                .build();
    }

    // ============================
    @Nested
    @DisplayName("Get User By Id Tests")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should succeed when user exists")
        void givenValidId_whenGetUserById_thenReturnProfile() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

            UserProfileDto result = adminService.getUserById(1L);

            assertThat(result.getName()).isEqualTo("Purna Sai");
            assertThat(result.getCity()).isEqualTo("Hyderabad");
            verify(userRepository).findById(1L);
        }

        @Test
        @DisplayName("Should throw when user not found")
        void givenInvalidId_whenGetUserById_thenThrow() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.getUserById(99L))
                    .isInstanceOf(RuntimeException.class);

            verify(userRepository).findById(99L);
        }
    }

    // ============================
    @Nested
    @DisplayName("Get Own Profile Tests")
    class GetOwnProfileTests {

        @Test
        @DisplayName("Should succeed when valid request maps to user")
        void givenValidRequest_whenGetOwnProfile_thenReturnProfile() {
            AdminService spyService = spy(adminService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);

            UserProfileDto result = spyService.getOwnProfile(request);

            assertThat(result.getUsername()).isEqualTo("purna");
            assertThat(result.getRole()).isEqualTo("ADMIN");
        }
    }

    // ============================
    @Nested
    @DisplayName("Update User By Id Tests")
    class UpdateUserByIdTests {

        @Test
        @DisplayName("Should update all fields correctly when valid dto is provided")
        void givenValidDto_whenUpdateUserById_thenUpdateAndReturn() {
            AdminUpdateDto dto = new AdminUpdateDto();
            dto.setName("Updated Purna");
            dto.setContactNumber("1112223333");
            dto.setAlternatePhoneNumber("9998887777");
            dto.setDateOfBirth("2000-01-01");
            dto.setGender("Female");
            dto.setStreet("New Street");
            dto.setCity("Chennai");
            dto.setState("TN");
            dto.setPincode("600001");
            dto.setCountry("India");

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            UserProfileDto result = adminService.updateUserById(1L, dto);

            assertThat(result.getName()).isEqualTo("Updated Purna");
            assertThat(result.getContactNumber()).isEqualTo("1112223333");
            assertThat(result.getAlternatePhoneNumber()).isEqualTo("9998887777");
            assertThat(result.getDateOfBirth()).isEqualTo("2000-01-01");
            assertThat(result.getGender()).isEqualTo("Female");
            assertThat(result.getStreet()).isEqualTo("New Street");
            assertThat(result.getCity()).isEqualTo("Chennai");
            assertThat(result.getState()).isEqualTo("TN");
            assertThat(result.getPincode()).isEqualTo("600001");
            assertThat(result.getCountry()).isEqualTo("India");

            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Should throw when user not found")
        void givenInvalidId_whenUpdateUserById_thenThrow() {
            AdminUpdateDto dto = new AdminUpdateDto();
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.updateUserById(99L, dto))
                    .isInstanceOf(RuntimeException.class);

            verify(userRepository, never()).save(any());
        }
    }

    // ============================
    @Nested
    @DisplayName("Update Own Profile Tests")
    class UpdateOwnProfileTests {

        @Test
        @DisplayName("Should update all fields including password when provided")
        void givenValidDtoWithPassword_whenUpdateOwnProfile_thenEncodePassword() {
            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName("New Name");
            dto.setContactNumber("1234567890");
            dto.setAlternatePhoneNumber("8765432109");
            dto.setDateOfBirth("2001-01-01");
            dto.setGender("Other");
            dto.setStreet("Lake View");
            dto.setCity("Delhi");
            dto.setState("DL");
            dto.setPincode("110001");
            dto.setCountry("India");
            dto.setPassword("newPass");

            AdminService spyService = spy(adminService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);
            when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPass");
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            UserProfileDto result = spyService.updateOwnProfile(dto, request);

            assertThat(result.getName()).isEqualTo("New Name");
            assertThat(result.getCity()).isEqualTo("Delhi");
            verify(passwordEncoder).encode("newPass");
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Should update profile but not encode password when blank")
        void givenBlankPassword_whenUpdateOwnProfile_thenIgnorePassword() {
            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName("No Password Change");
            dto.setPassword("   ");

            AdminService spyService = spy(adminService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            UserProfileDto result = spyService.updateOwnProfile(dto, request);

            assertThat(result.getName()).isEqualTo("No Password Change");
            verify(passwordEncoder, never()).encode(any());
            verify(userRepository).save(sampleUser);
        }

        @ParameterizedTest
        @CsvSource({
                "'',   Empty name input",
                "'   ', Whitespace only input"
        })
        @DisplayName("Should save user even with blank/whitespace name")
        void givenBlankName_whenUpdateOwnProfile_thenStillSave(String badName, String desc) {
            CustomerUpdateDto dto = new CustomerUpdateDto();
            dto.setName(badName);

            AdminService spyService = spy(adminService);
            doReturn(sampleUser).when(spyService).getUserFromRequest(request);
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            UserProfileDto result = spyService.updateOwnProfile(dto, request);

            assertThat(result).isNotNull();
            verify(userRepository).save(sampleUser);
        }
    }
}
