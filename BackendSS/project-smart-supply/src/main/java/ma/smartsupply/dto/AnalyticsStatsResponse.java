package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsStatsResponse {
    private Double chiffreAffairesTotal;
    private Long nombreCommandes; // matched to frontend 'nombreCommandes'
    private Long produitsEnRupture; // matched to frontend 'produitsEnRupture'
    private Long nombreClients; // matched to frontend 'nombreClients'
}
