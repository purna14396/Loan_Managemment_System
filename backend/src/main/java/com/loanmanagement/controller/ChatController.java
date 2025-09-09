package com.loanmanagement.controller;

import com.loanmanagement.dto.ChatMessageDto;
import com.loanmanagement.dto.UserInfoDto;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.UserRepository;
import com.loanmanagement.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final UserRepository userRepository;

    // Customer sends a message. Customer identity is taken from the JWT principal.
    @PostMapping("/customer/send")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('USER')") // adjust roles as per your app
    public ResponseEntity<ChatMessageDto> customerSend(@RequestBody CustomerChatRequest req, Principal principal) {
        ChatMessageDto dto = chatService.sendCustomerMessage(principal.getName(), req.getMessage());
        return ResponseEntity.ok(dto);
    }

    // Admin sends a reply to a specific customer. Admin identity is taken from the
    // JWT principal.
    @PostMapping("/admin/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChatMessageDto> adminSend(@RequestBody AdminChatRequest req, Principal principal) {
        ChatMessageDto dto = chatService.sendAdminMessage(principal.getName(), req.getCustomerId(), req.getMessage());
        return ResponseEntity.ok(dto);
    }

    // Get all messages for a customer (for customer view)
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<List<ChatMessageDto>> getCustomerChat(@PathVariable Long customerId, Principal principal) {
        // Customers should only view their own chats. Admins can view any customer's
        // chat.
        List<ChatMessageDto> msgs = chatService.getMessagesForCustomer(customerId, principal);
        return ResponseEntity.ok(msgs);
    }

    // Get all chats (for admin view)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatMessageDto>> getAllChats() {
        return ResponseEntity.ok(chatService.getAllChats());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<UserInfoDto> getCurrentUserInfo(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserInfoDto dto = new UserInfoDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().toString());
        // Add other fields as needed

        return ResponseEntity.ok(dto);
    }

    // DTOs for requests
    public static class CustomerChatRequest {
        private String message;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class AdminChatRequest {
        private Long customerId;
        private String message;

        public Long getCustomerId() {
            return customerId;
        }

        public void setCustomerId(Long customerId) {
            this.customerId = customerId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
