package com.loanmanagement.model;

// Enables ORM annotations like @Entity, @Id, @ManyToOne, etc.
import jakarta.persistence.*;

// Lombok to auto-generate boilerplate code (getters, setters, constructors, etc.)
import lombok.*;

@Entity // Marks this class as a JPA entity mapped to a DB table
@Table(name = "penalties") // Maps this entity to the "penalties" table
@Data // Generates getters, setters, toString, equals, and hashCode
@NoArgsConstructor // Generates a no-argument constructor
@AllArgsConstructor // Generates a constructor with all fields
@Builder // Enables object creation using builder pattern
public class Penalty {

    @Id // Declares this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Auto-generates ID using DB's auto-increment
    private Long id;

    @ManyToOne
    // Many penalties can be linked to one EMI payment
    private EmiPayment emi;

    private double amount; // Penalty amount charged
    private String reason; // Reason for applying the penalty
}
