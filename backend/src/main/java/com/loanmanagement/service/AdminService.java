package com.loanmanagement.service;

import com.loanmanagement.dto.AdminUpdateDto;
import com.loanmanagement.dto.CustomerUpdateDto;
import com.loanmanagement.dto.UserProfileDto;
import com.loanmanagement.model.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class AdminService extends UserService {

    public UserProfileDto getUserById(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return mapToDto(user);
    }
    
    public UserProfileDto getOwnProfile(HttpServletRequest request) {
        User user = getUserFromRequest(request);  // from UserService
        return mapToDto(user);                    // from UserService
    }


    public UserProfileDto updateUserById(Long userId, AdminUpdateDto dto) {
        User user = userRepository.findById(userId).orElseThrow();

        user.setName(dto.getName());
        user.setContactNumber(dto.getContactNumber());
        user.setAlternatePhoneNumber(dto.getAlternatePhoneNumber());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setGender(dto.getGender());

        user.setStreet(dto.getStreet());
        user.setCity(dto.getCity());
        user.setState(dto.getState());
        user.setPincode(dto.getPincode());
        user.setCountry(dto.getCountry());

        userRepository.save(user);
        return mapToDto(user);
    }

    public UserProfileDto updateOwnProfile(CustomerUpdateDto dto, HttpServletRequest request) {
        User user = getUserFromRequest(request);

        user.setName(dto.getName());
        user.setContactNumber(dto.getContactNumber());
        user.setAlternatePhoneNumber(dto.getAlternatePhoneNumber());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setGender(dto.getGender());

        user.setStreet(dto.getStreet());
        user.setCity(dto.getCity());
        user.setState(dto.getState());
        user.setPincode(dto.getPincode());
        user.setCountry(dto.getCountry());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        userRepository.save(user);
        return mapToDto(user);
    }
}
