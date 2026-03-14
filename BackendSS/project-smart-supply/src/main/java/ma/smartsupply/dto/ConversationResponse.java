package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConversationResponse {
    private Long conversationId;
    private Long participantId;
    private String participantName;
    private String participantRole;
    private String participantImage;
    private String lastMessage;
    private String lastImagePath;
    private LocalDateTime lastMessageAt;
}
