// DTO: Represents the response returned after successful authentication (e.g., login)

package com.loanmanagement.dto;

// --- Imports ---
import com.loanmanagement.model.User.Role; // Role enum (ADMIN, USER, etc.)
import lombok.AllArgsConstructor;         // Lombok annotation to generate all-args constructor
import lombok.Data;                       // Lombok annotation for getters, setters, toString, equals, hashCode


@Data                             // Generates getter/setter, toString, equals, hashCode
@AllArgsConstructor               // Generates constructor with all fields
public class AuthResponse {

    private String token;         // JWT token to be sent to the frontend
    private Role role;            // User role (e.g., ADMIN, USER)
}
