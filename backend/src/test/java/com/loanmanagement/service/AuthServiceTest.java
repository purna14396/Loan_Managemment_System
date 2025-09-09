package com.loanmanagement.service;

import com.loanmanagement.config.JwtUtil;
import com.loanmanagement.dto.AuthResponse;
import com.loanmanagement.dto.LoginRequest;
import com.loanmanagement.dto.RegisterRequest;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.UserRepository;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private static final String TEST_SECRET = "super-secret";

    static class TestableAuthService extends AuthService {
        public TestableAuthService(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder, String adminSecret) {
            super(userRepository, jwtUtil, passwordEncoder);
            this.adminSecret = adminSecret;
        }
    }

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        authService = new TestableAuthService(userRepository, jwtUtil, passwordEncoder, TEST_SECRET);
    }

    // ---------------- LOGIN ----------------
    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should return token when login is successful")
        void givenValidCredentials_whenLogin_thenReturnAuthResponse() {
            LoginRequest request = new LoginRequest();
            request.setUsername("purna123");
            request.setPassword("Purna@123");

            User user = User.builder()
                    .username("purna123")
                    .password("$2a$10$hashed")
                    .role(User.Role.CUSTOMER)
                    .build();

            when(userRepository.findByUsername("purna123")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Purna@123", "$2a$10$hashed")).thenReturn(true);
            when(jwtUtil.generateToken("purna123", "CUSTOMER")).thenReturn("mock-jwt-token");

            AuthResponse response = authService.login(request);

            assertThat(response.getToken()).isEqualTo("mock-jwt-token");
            assertThat(response.getRole()).isEqualTo(User.Role.CUSTOMER);
        }

        @ParameterizedTest(name = "{0}")
        @MethodSource("com.loanmanagement.service.AuthServiceTest#invalidLoginScenarios")
        void givenInvalidLoginScenarios_whenLogin_thenThrows(
                String testName,
                Optional<User> userOpt,
                boolean passwordMatches,
                String expectedMessage
        ) {
            LoginRequest request = new LoginRequest();
            request.setUsername("purna123");
            request.setPassword("password");

            when(userRepository.findByUsername("purna123")).thenReturn(userOpt);

            if (userOpt.isPresent()) {
                when(passwordEncoder.matches(eq("password"), anyString())).thenReturn(passwordMatches);
            }

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage(expectedMessage);
        }
    }

    static Stream<Arguments> invalidLoginScenarios() {
        User existingUser = User.builder()
                .username("purna123")
                .password("hash")
                .build();

        return Stream.of(
                Arguments.of("User not found", Optional.empty(), false, "User not found"),
                Arguments.of("Invalid password", Optional.of(existingUser), false, "Invalid username or password")
        );
    }

    // ---------------- REGISTER ----------------
    // ---------------- REGISTER ----------------
@Nested
@DisplayName("Register Tests")
class RegisterTests {

    @Test
    @DisplayName("Should register customer successfully")
    void givenValidCustomerRequest_whenRegister_thenSaveUser() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("purna123");
        request.setName("Purna Sai");
        request.setEmail("purna@example.com");
        request.setPassword("StrongPass@123");
        request.setRole(User.Role.CUSTOMER);

        when(userRepository.findByEmail("purna@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("purna123")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("StrongPass@123")).thenReturn("encodedpass");

        authService.register(request);

        verify(userRepository).save(any(User.class));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("com.loanmanagement.service.AuthServiceTest#invalidRegisterScenarios")
    void givenInvalidRegisterScenarios_whenRegister_thenThrows(
            String testName,
            RegisterRequest request,
            String expectedMessage
    ) {
        if ("Username already taken".equals(testName)) {
            when(userRepository.findByUsername("takenUser")).thenReturn(Optional.of(new User()));
        }
        if ("Email already exists".equals(testName)) {
            when(userRepository.findByEmail("exists@x.com")).thenReturn(Optional.of(new User()));
        }

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage(expectedMessage);
    }

    @Test
    @DisplayName("Should register admin when correct admin secret provided")
    void givenValidAdminRequest_whenRegister_thenSaveAdmin() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("adminPurna1");
        request.setName("Purna Sai");
        request.setEmail("admin@smartlend.com");
        request.setPassword("AdminPass@123");
        request.setRole(User.Role.ADMIN);
        request.setAdminKey(TEST_SECRET);

        when(userRepository.findByEmail("admin@smartlend.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("adminPurna1")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("AdminPass@123")).thenReturn("encodedAdmin");

        authService.register(request);

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw when admin secret is invalid")
    void givenInvalidAdminSecret_whenRegister_thenThrows() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("adminPurna1");
        request.setName("Purna Sai");
        request.setEmail("admin@smartlend.com");
        request.setPassword("AdminPass@123");
        request.setRole(User.Role.ADMIN);
        request.setAdminKey("wrong-secret");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid or missing Admin Secret Key");
    }
}


    static Stream<Arguments> invalidRegisterScenarios() {
        RegisterRequest usernameTaken = new RegisterRequest();
        usernameTaken.setUsername("takenUser");
        usernameTaken.setEmail("unique@x.com");
        usernameTaken.setPassword("pass");
        usernameTaken.setRole(User.Role.CUSTOMER);

        RegisterRequest emailTaken = new RegisterRequest();
        emailTaken.setUsername("uniqueUser");
        emailTaken.setEmail("exists@x.com");
        emailTaken.setPassword("pass");
        emailTaken.setRole(User.Role.CUSTOMER);

        return Stream.of(
                Arguments.of("Username already taken", usernameTaken, "Username already taken"),
                Arguments.of("Email already exists", emailTaken, "Email already exists")
        );
    }

    // ---------------- UPDATE PASSWORD ----------------
    @Nested
    @DisplayName("Update Password Tests")
    class UpdatePasswordTests {

        @Test
        @DisplayName("Should update password successfully")
        void givenValidRequest_whenUpdatePassword_thenPasswordUpdated() {
            User user = new User();
            user.setUsername("purna123");
            user.setPassword("oldHash");

            when(userRepository.findByUsername("purna123")).thenReturn(Optional.of(user));
            when(passwordEncoder.encode("NewPass@123")).thenReturn("newHash");

            authService.updatePassword("purna123", "NewPass@123", "NewPass@123");

            assertThat(user.getPassword()).isEqualTo("newHash");
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw when passwords do not match")
        void givenMismatchedPasswords_whenUpdatePassword_thenThrows() {
            assertThatThrownBy(() -> authService.updatePassword("purna123", "NewPass@123", "Different@123"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Passwords do not match");
        }

        @Test
        @DisplayName("Should throw when user not found")
        void givenInvalidUser_whenUpdatePassword_thenThrows() {
            when(userRepository.findByUsername("purna123")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.updatePassword("purna123", "Valid@123", "Valid@123"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");
        }
    }

    // ---------------- GET USER ----------------
    @Nested
    @DisplayName("Get User By Username Tests")
    class GetUserByUsernameTests {

        @Test
        @DisplayName("Should return user when found")
        void givenValidUsername_whenGetUser_thenReturnUser() {
            User user = new User();
            user.setUsername("purna123");

            when(userRepository.findByUsername("purna123")).thenReturn(Optional.of(user));

            User result = authService.getUserByUsername("purna123");

            assertThat(result.getUsername()).isEqualTo("purna123");
        }

        @Test
        @DisplayName("Should throw when user not found")
        void givenInvalidUsername_whenGetUser_thenThrows() {
            when(userRepository.findByUsername("purna123")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.getUserByUsername("purna123"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");
        }
    }
}
