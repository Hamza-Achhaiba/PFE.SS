package ma.smartsupply.dto;

import lombok.Data;

@Data
public class ProduitRequest {
    private String nom;
    private Double prix;
    private String description;
    private String image;
    private Integer quantiteInitiale;
    private Integer quantiteMinimumCommande;
    private Integer seuilAlerte;
    private Long categorieId;
}