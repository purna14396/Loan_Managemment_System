package com.loanmanagement.repository;

import com.loanmanagement.model.ChatMessage;
import com.loanmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCustomerOrderBySentAtAsc(User customer);

    List<ChatMessage> findAllByOrderByCustomer_UserIdAscSentAtAsc();

    List<ChatMessage> findByCustomer_UserIdOrderBySentAtAsc(Long customerId);
    
    void deleteAllByCustomer(User customer);
}
