package com.loanmanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "emi_payment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmiPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    @JsonIgnore // prevent circular/lazy-serialization issues in responses
    private Loan loan;

    // money -> BigDecimal with scale(2)
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmiStatus status; // PENDING, PAID, LATE

    private LocalDate paymentDate;

    @Column(length = 100)
    private String transactionRef;

    @Column(name = "remaining_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal remainingBalance;

    @Column(nullable = false, updatable = false)
    private LocalDate createdAt;

    @Column(nullable = false)
    private LocalDate updatedAt;

    public enum EmiStatus {
        PENDING, PAID, LATE
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDate.now();
        this.updatedAt = LocalDate.now();
        // safety: normalize scales
        if (this.amount != null) this.amount = this.amount.setScale(2);
        if (this.remainingBalance != null) this.remainingBalance = this.remainingBalance.setScale(2);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDate.now();
        if (this.amount != null) this.amount = this.amount.setScale(2);
        if (this.remainingBalance != null) this.remainingBalance = this.remainingBalance.setScale(2);
    }
}
