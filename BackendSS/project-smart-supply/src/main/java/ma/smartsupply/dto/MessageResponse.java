package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.smartsupply.enums.Role;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private Role senderRole;
    private String content;
    private String imageUrl;
    private LocalDateTime createdAt;
    private boolean isMine;
}
