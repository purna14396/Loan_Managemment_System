package com.loanmanagement.model;

// Enables ORM annotations like @Entity, @Id, @ManyToOne, etc.
import jakarta.persistence.*;

// Lombok for auto-generating boilerplate code
import lombok.*;

import java.time.LocalDateTime;

@Entity // Marks this class as a JPA entity mapped to a DB table
@Table(name = "otp_log") // Maps this entity to the "otp_log" table
@Data // Generates getters, setters, toString, equals, and hashCode
@NoArgsConstructor // Generates a no-argument constructor
@AllArgsConstructor // Generates a constructor with all fields
@Builder // Enables object creation using builder pattern
public class OtpLog {

    @Id // Declares this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Auto-generates ID using DB's auto-increment
    private Long id;

    @ManyToOne
    // Many OTP logs can be associated with one user
    private User user;

    private String otp; // OTP code sent to the user
    private LocalDateTime createdAt; // Timestamp when OTP was created
    private LocalDateTime expiresAt; // Expiry time for the OTP
    private boolean verified; // Indicates whether the OTP was successfully verified
}
