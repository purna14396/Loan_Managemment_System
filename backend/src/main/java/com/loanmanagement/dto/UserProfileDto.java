package com.loanmanagement.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private String name;
    private String username;
    private String email;
    private String role;

    // Contact Info
    private String contactNumber;
    private String alternatePhoneNumber;

    // Personal Info
    private String dateOfBirth;
    private String gender;

    // Address Fields
    private String street;
    private String city;
    private String state;
    private String pincode;
    private String country;
}
