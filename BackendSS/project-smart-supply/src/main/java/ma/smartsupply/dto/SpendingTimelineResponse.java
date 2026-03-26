package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTimelineResponse {
    private String date; // Format YYYY-MM-DD
    private Double spending; // matched to frontend 'spending'
}
