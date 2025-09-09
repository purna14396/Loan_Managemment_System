package com.loanmanagement.controller;

import com.loanmanagement.dto.AdminUpdateDto;
import com.loanmanagement.dto.CustomerUpdateDto;
import com.loanmanagement.dto.UserProfileDto;
import com.loanmanagement.service.AdminService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid; // ✅ Required for validation

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ✅ Admin fetches own profile
    @GetMapping("/me")
    public UserProfileDto getOwnProfile(HttpServletRequest request) {
        return adminService.getOwnProfile(request);
    }

    // ✅ Admin fetches any user by ID
    @GetMapping("/user/{userId}")
    public UserProfileDto getUserById(@PathVariable Long userId) {
        return adminService.getUserById(userId);
    }

    // ✅ Admin updates any user by ID — validated
    @PutMapping("/user/{userId}")
    public UserProfileDto updateUserById(@PathVariable Long userId, @Valid @RequestBody AdminUpdateDto updateDto) {
        return adminService.updateUserById(userId, updateDto);
    }

    // ✅ Admin updates own profile — validated
    @PutMapping("/update")
    public UserProfileDto updateOwnProfile(@Valid @RequestBody CustomerUpdateDto dto, HttpServletRequest request) {
        return adminService.updateOwnProfile(dto, request);
    }
}
