package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;
import ma.smartsupply.enums.TypeNotification;
import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private LocalDateTime dateCreation;
    private TypeNotification type;
    private boolean lue;

}