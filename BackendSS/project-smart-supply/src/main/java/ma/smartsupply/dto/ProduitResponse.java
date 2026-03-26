package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;
import ma.smartsupply.enums.StatutProduit;

@Data
@Builder
public class ProduitResponse {
    private Long id;
    private String nom;
    private Double prix;
    private String description;
    private String image;
    private String nomFournisseur;
    private Long fournisseurId;

    private Long categorieId;
    private String categorieNom;

    private Integer quantiteDisponible;
    private Integer quantiteMinimumCommande;
    private boolean alerteStock;
    private boolean actif;
    private StatutProduit statutApprobation;
}