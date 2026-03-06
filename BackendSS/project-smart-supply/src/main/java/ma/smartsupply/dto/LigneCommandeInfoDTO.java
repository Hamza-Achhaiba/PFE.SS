package ma.smartsupply.dto;

import lombok.Data;

@Data
public class LigneCommandeInfoDTO {
    private Long id;
    private int quantite;
    private double sousTotal;
    private ProduitInfoDTO produit;
}