package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.smartsupply.enums.Role;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    private Long senderId;
    
    @Enumerated(EnumType.STRING)
    private Role senderRole;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
