package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProduitResponse {
    private Long produitId; // matched to frontend 'produitId'
    private String nomProduit; // matched to frontend 'nomProduit'
    private Double chiffreAffaires;
    private Long totalVendu; // matched to frontend 'totalVendu'
}
