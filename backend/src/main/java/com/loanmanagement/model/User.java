package com.loanmanagement.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = "email")
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private LocalDateTime createdAt;

    // 📞 Contact
    @Column(length = 10)
    private String contactNumber;

    @Column(length = 10)
    private String alternatePhoneNumber;

    // 📅 Date of Birth
    @Column(length = 12) // Format like "1999-09-22"
    private String dateOfBirth;

    // ⚧ Gender: Male / Female / Prefer not to say
    @Column(length = 20)
    private String gender;

    // 📍 Address Fields
    @Column(length = 30)
    private String street;

    @Column(length = 30)
    private String city;

    @Column(length = 30)
    private String state;

    @Column(length = 6)
    private String pincode;

    @Column(length = 30)
    private String country;

    public enum Role {
        ADMIN,
        CUSTOMER
    }
}
