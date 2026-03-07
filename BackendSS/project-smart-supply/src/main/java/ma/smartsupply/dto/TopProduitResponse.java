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
    private Long id;
    private String nom;
    private Double chiffreAffaires;
    private Long quantiteVendue;
}
