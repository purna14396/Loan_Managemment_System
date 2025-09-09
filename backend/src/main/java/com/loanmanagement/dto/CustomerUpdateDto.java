package com.loanmanagement.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CustomerUpdateDto {

    @NotBlank(message = "Name cannot be blank")
    @Size(max = 30, message = "Name must not exceed 30 characters")
    private String name;

    // 📌 Password optional, but if present must meet policy
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).*$",
        message = "Password must contain upper, lower, digit, and special character"
    )
    private String password;

    // 📞 Contact
    @Pattern(regexp = "^[0-9]{10}$", message = "Contact number must be exactly 10 digits")
    private String contactNumber;

    @Pattern(regexp = "^[0-9]{10}$", message = "Alternate phone number must be exactly 10 digits")
    private String alternatePhoneNumber;

    // 📅 Personal
    @Pattern(
        regexp = "^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
        message = "Date of birth must be in format YYYY-MM-DD"
    )
    private String dateOfBirth;

    @Pattern(
        regexp = "^(Male|Female|Prefer not to say)$",
        message = "Gender must be Male, Female, or Prefer not to say"
    )
    private String gender;

    // 🏠 Address
    @Size(max = 30, message = "Street must not exceed 30 characters")
    private String street;

    @Size(max = 30, message = "City must not exceed 30 characters")
    private String city;

    @Size(max = 30, message = "State must not exceed 30 characters")
    private String state;

    @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be exactly 6 digits")
    private String pincode;

    @Size(max = 30, message = "Country must not exceed 30 characters")
    private String country;
}
