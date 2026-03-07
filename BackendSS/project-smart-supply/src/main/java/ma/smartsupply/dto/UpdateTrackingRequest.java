package ma.smartsupply.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateTrackingRequest {
    private String trackingReference;
    private LocalDateTime dateLivraisonEstimee;
}
