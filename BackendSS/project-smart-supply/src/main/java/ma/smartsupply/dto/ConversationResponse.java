package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private Long clientId;
    private String clientName;
    private String clientMagasin;
    private Long fournisseurId;
    private String fournisseurName;
    private String fournisseurEntreprise;
    private String otherPartyName;
    private String otherPartySubtitle;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private boolean isPinned;
}
