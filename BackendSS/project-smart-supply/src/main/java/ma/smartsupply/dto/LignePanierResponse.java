package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LignePanierResponse {
    private Long id;
    private Long produitId;
    private String nomProduit;
    private String image;
    private double prixUnitaire;
    private int quantite;
    private double sousTotal;
}