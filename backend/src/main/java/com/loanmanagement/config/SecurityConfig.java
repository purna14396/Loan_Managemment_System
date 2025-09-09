// Security Configuration for Spring Boot + JWT + CORS

package com.loanmanagement.config;

// --- Spring Core Annotations ---
import org.springframework.context.annotation.Bean; // Declares a method as a Spring-managed bean
import org.springframework.context.annotation.Configuration; // Marks this class as a configuration class
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; // Enables Spring Security

// --- Spring Security Configuration ---
import org.springframework.security.config.annotation.web.builders.HttpSecurity; // Builds security filter chain rules
import org.springframework.security.config.http.SessionCreationPolicy; // Defines how sessions are managed
import org.springframework.security.config.Customizer; // Utility for concise configuration blocks
import org.springframework.security.web.SecurityFilterChain; // Defines the filter chain for Spring Security
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// --- Password Encryption ---
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // BCrypt implementation for hashing passwords
import org.springframework.security.crypto.password.PasswordEncoder; // Interface for password encoders

// --- CORS Configuration ---
import org.springframework.web.cors.CorsConfiguration; // Represents CORS config options
import org.springframework.web.cors.CorsConfigurationSource; // Source for CORS config
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // Maps URL paths to CORS config

import java.util.List; // Utility for working with lists

// Main Spring Security Configuration Class
@Configuration
@EnableWebSecurity // Enables Spring Security support
public class SecurityConfig {

    // Configures the Spring Security filter chain

    private final JwtAuthFilter jwtAuthFilter; // instance, not class name

    // Constructor injection
    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/chat/admin/**").authenticated()
                        .requestMatchers("/api/chat/customer/**").authenticated()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); // Add your JWT filter here

        return http.build();
    }

    // Password encoder bean using BCrypt (used during registration/login)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Strong password hashing
    }

    // Global CORS configuration bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000")); // Allow requests from React frontend
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")); // Allow common HTTP methods
        config.setAllowedHeaders(List.of("*")); // Allow all request headers
        config.setAllowCredentials(true); // Allow cookies and auth headers

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Apply config to all paths

        return source; // Return CORS config source
    }
}
