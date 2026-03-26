package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs", indexes = {
    @Index(name = "idx_activity_log_created_at", columnList = "createdAt"),
    @Index(name = "idx_activity_log_actor_role", columnList = "actorRole"),
    @Index(name = "idx_activity_log_action", columnList = "action")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long actorId;
    private String actorName;
    private String actorRole;

    private String action;

    private String targetType;
    private String targetId;
    private String targetName;

    @Column(length = 1000)
    private String details;

    private String status;

    private String ipAddress;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
