package com.loanmanagement.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {
    private String name;
    private String email;
    private String contactNumber;
    private String alternatePhoneNumber;
    private String gender;
    private String dateOfBirth;
    private String street;       // ✅ instead of address
    private String city;
    private String state;
    private String pincode;
    private String country;
}
