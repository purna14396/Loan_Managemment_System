// Repository: Handles database interactions related to User entity

package com.loanmanagement.repository;

import java.util.Optional;

import com.loanmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ Checks if a user exists with the given email (used in registration validation)
    boolean existsByEmail(String email);

    // ✅ Checks if a user exists with the given username (used in registration validation)
    boolean existsByUsername(String username);

    // ✅ Fetches a user by email (used for validation or search)
    Optional<User> findByEmail(String email);

    // ✅ Fetches a user by username (used during login)
    Optional<User> findByUsername(String username);
    
    long countByRole(User.Role role);

}
