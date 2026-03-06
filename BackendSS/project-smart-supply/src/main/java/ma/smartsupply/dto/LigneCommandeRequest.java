package ma.smartsupply.dto;

import lombok.Data;

@Data
public class LigneCommandeRequest {
    private Long produitId;
    private Integer quantite;
}