package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProduitResponse {
    private Long id;
    private String nom;
    private Double prix;
    private String description;
    private String image;
    private String nomFournisseur;

    private Integer quantiteDisponible;
    private boolean alerteStock;
    private boolean actif;
}