package com.loanmanagement.controller;

import com.loanmanagement.dto.UserManagementDto;
import com.loanmanagement.service.AdminUserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/user-management")
public class AdminUserManagementController {

    @Autowired
    private AdminUserManagementService adminUserManagementService;

    // Load Super Admin Key from application-secret.properties
    @Value("${super.admin.key}")
    private String superAdminKey;

    /**
     * Validate Super Admin Key before allowing page access.
     */
    @GetMapping("/validate-super-key")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Boolean> validateSuperKey(@RequestParam String key) {
        return ResponseEntity.ok(superAdminKey.equals(key));
    }

    /**
     * Get all users with active loan count for customers.
     * Only callable if frontend already validated super key.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserManagementDto>> getAllUsers() {
        return ResponseEntity.ok(adminUserManagementService.getAllUsersWithLoanCount());
    }

    /**
     * Delete a user (admins or customers).
     * Customers can only be deleted if active loan count = 0.
     * Only callable if frontend already validated super key.
     * Returns a success message on deletion.
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId) {
        String message = adminUserManagementService.deleteUserWithoutKeyCheck(userId);
        return ResponseEntity.ok(message);
    }
}
