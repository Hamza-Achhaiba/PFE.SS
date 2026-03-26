package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.*;
import ma.smartsupply.enums.TypeNotification;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private LocalDateTime dateEnvoi;

    @Enumerated(EnumType.STRING)
    private TypeNotification type;

    @Builder.Default
    private boolean lue = false;

    private Long commandeId;
    private String commandeRef;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur destinataire;
}