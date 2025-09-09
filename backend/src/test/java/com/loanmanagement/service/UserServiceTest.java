package com.loanmanagement.service;

import com.loanmanagement.config.JwtUtil;
import com.loanmanagement.dto.UserProfileDto;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private UserService userService;

    // ---------------- getUserFromRequest ----------------
    @Nested
    @DisplayName("Get User From Request Tests")
    class GetUserFromRequestTests {

        @Test
        @DisplayName("Should return user when token is valid and user exists")
        void givenValidToken_whenGetUserFromRequest_thenReturnUser() {
            String token = "mock.jwt.token";
            String username = "purna";

            when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(jwtUtil.isTokenValid(token)).thenReturn(true);
            when(jwtUtil.extractUsername(token)).thenReturn(username);

            User user = User.builder()
                    .username("purna")
                    .email("purna@example.com")
                    .name("Purna Sai")
                    .build();

            when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

            User result = userService.getUserFromRequest(request);

            assertThat(result).isNotNull();
            assertThat(result.getUsername()).isEqualTo("purna");
            assertThat(result.getName()).isEqualTo("Purna Sai");

            verify(jwtUtil).isTokenValid(token);
            verify(jwtUtil).extractUsername(token);
            verify(userRepository).findByUsername(username);
        }

        @Test
        @DisplayName("Should throw when Authorization header has invalid format")
        void givenInvalidHeaderFormat_whenGetUserFromRequest_thenThrows() {
            when(request.getHeader("Authorization")).thenReturn("Token abc.def.ghi");

            assertThatThrownBy(() -> userService.getUserFromRequest(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Invalid or missing JWT token");
        }

        @Test
        @DisplayName("Should throw when Authorization header is missing")
        void givenNoAuthorizationHeader_whenGetUserFromRequest_thenThrows() {
            when(request.getHeader("Authorization")).thenReturn(null);

            assertThatThrownBy(() -> userService.getUserFromRequest(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Invalid or missing JWT token");
        }

        @Test
        @DisplayName("Should throw when token is invalid")
        void givenInvalidToken_whenGetUserFromRequest_thenThrows() {
            String token = "invalid.token";

            when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(jwtUtil.isTokenValid(token)).thenReturn(false);

            assertThatThrownBy(() -> userService.getUserFromRequest(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Invalid or missing JWT token");

            verify(jwtUtil).isTokenValid(token);
            verify(jwtUtil, never()).extractUsername(anyString());
            verify(userRepository, never()).findByUsername(anyString());
        }

        @Test
        @DisplayName("Should throw when user not found for valid token")
        void givenValidTokenButUserNotFound_whenGetUserFromRequest_thenThrows() {
            String token = "valid.token";
            String username = "purna";

            when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(jwtUtil.isTokenValid(token)).thenReturn(true);
            when(jwtUtil.extractUsername(token)).thenReturn(username);
            when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserFromRequest(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found with username: " + username);
        }
    }

    // ---------------- mapToDto ----------------
    @Nested
    @DisplayName("Map To DTO Tests")
    class MapToDtoTests {

        @Test
        @DisplayName("Should map User to UserProfileDto correctly")
        void givenUser_whenMapToDto_thenReturnDto() {
            User user = User.builder()
                    .username("purna")
                    .name("Purna Sai")
                    .email("purna@example.com")
                    .role(User.Role.CUSTOMER)
                    .contactNumber("9876543210")
                    .alternatePhoneNumber("9999999999")
                    .dateOfBirth("1999-09-09")
                    .gender("Male")
                    .street("Tech Street")
                    .city("Hyderabad")
                    .state("Telangana")
                    .pincode("500001")
                    .country("India")
                    .build();

            UserProfileDto dto = userService.mapToDto(user);

            assertThat(dto.getUsername()).isEqualTo("purna");
            assertThat(dto.getName()).isEqualTo("Purna Sai");
            assertThat(dto.getEmail()).isEqualTo("purna@example.com");
            assertThat(dto.getRole()).isEqualTo("CUSTOMER");
            assertThat(dto.getContactNumber()).isEqualTo("9876543210");
            assertThat(dto.getAlternatePhoneNumber()).isEqualTo("9999999999");
            assertThat(dto.getDateOfBirth()).isEqualTo("1999-09-09");
            assertThat(dto.getGender()).isEqualTo("Male");
            assertThat(dto.getStreet()).isEqualTo("Tech Street");
            assertThat(dto.getCity()).isEqualTo("Hyderabad");
            assertThat(dto.getState()).isEqualTo("Telangana");
            assertThat(dto.getPincode()).isEqualTo("500001");
            assertThat(dto.getCountry()).isEqualTo("India");
        }
    }
}
