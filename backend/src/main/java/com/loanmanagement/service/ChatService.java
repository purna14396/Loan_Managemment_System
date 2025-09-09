package com.loanmanagement.service;

import com.loanmanagement.dto.ChatMessageDto;
import com.loanmanagement.model.ChatMessage;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.ChatMessageRepository;
import com.loanmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository; // assume exists

    // Customer sends a message. username comes from Principal.getName()
    @Transactional
    public ChatMessageDto sendCustomerMessage(String username, String message) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        ChatMessage chat = ChatMessage.builder()
                .customer(customer)
                .admin(null)
                .senderType("CUSTOMER")
                .message(message)
                .sentAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(chat);
        return toDto(saved);
    }

    // Admin sends a reply to a customer's chat. adminUsername from
    // Principal.getName()
    @Transactional
    public ChatMessageDto sendAdminMessage(String adminUsername, Long customerId, String message) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        ChatMessage chat = ChatMessage.builder()
                .customer(customer)
                .admin(admin)
                .senderType("ADMIN")
                .message(message)
                .sentAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(chat);
        return toDto(saved);
    }

    // Get messages for a customer. Principal passed so we can enforce access rules
    // (customers view only their own)
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesForCustomer(Long customerId, java.security.Principal principal) {
        // If caller is admin -> allow. If caller is customer -> ensure matches their
        // id.
        String caller = principal.getName();
        User callerUser = userRepository.findByUsername(caller)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

        if (!isAdmin) {
            // if not admin, ensure callerUser.userId == customerId
            if (!callerUser.getUserId().equals(customerId)) {
                throw new SecurityException("Not authorized to view these messages");
            }
        }

        return chatMessageRepository.findByCustomer_UserIdOrderBySentAtAsc(customerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // Admin: get all chats (ordered by customer then time)
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getAllChats() {
        return chatMessageRepository.findAllByOrderByCustomer_UserIdAscSentAtAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // Mapper helper
    private ChatMessageDto toDto(ChatMessage chat) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(chat.getId());
        dto.setCustomerId(chat.getCustomer() == null ? null : chat.getCustomer().getUserId());
        dto.setCustomerName(chat.getCustomer() == null ? null : chat.getCustomer().getName());
        dto.setAdminId(chat.getAdmin() == null ? null : chat.getAdmin().getUserId());
        dto.setAdminName(chat.getAdmin() == null ? null : chat.getAdmin().getName());
        dto.setSenderType(chat.getSenderType());
        dto.setMessage(chat.getMessage());
        dto.setSentAt(chat.getSentAt());
        return dto;
    }

    public ChatMessage saveCustomerMessage(Long customerId, String message) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        ChatMessage chat = ChatMessage.builder()
                .customer(customer)
                .admin(null)
                .senderType("CUSTOMER")
                .message(message)
                .sentAt(LocalDateTime.now())
                .build();
        return chatMessageRepository.save(chat);
    }
}
