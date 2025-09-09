package com.loanmanagement.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ✅ Handle validation errors (from @Valid DTOs)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        // Extract first validation error message
        String firstErrorMessage = ex.getBindingResult()
                                     .getFieldErrors()
                                     .stream()
                                     .map(FieldError::getDefaultMessage)
                                     .findFirst()
                                     .orElse("Validation failed");

        // Return { "message": "<error message>" }
        return new ResponseEntity<>(Map.of("message", firstErrorMessage), HttpStatus.BAD_REQUEST);
    }

    // ✅ Handle general runtime exceptions consistently
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }


}
