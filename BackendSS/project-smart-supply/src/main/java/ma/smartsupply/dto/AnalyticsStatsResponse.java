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
    private Long totalCommandes;
    private Long totalProduitsEnRupture;
    private Long clientsUniques;
}
