package ma.smartsupply.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import ma.smartsupply.enums.StatutProduit;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "produits")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private Double prix;
    private String description;
    private String image;

    private Integer quantiteStock; // Keep this just in case, though Stock entity is used
    @Builder.Default
    private Integer quantiteMinimumCommande = 1;
    private Integer seuilAlerte;

    @Builder.Default
    private boolean actif = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutProduit statutApprobation = StatutProduit.PENDING;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;

    @ManyToOne
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @JsonIgnore
    @OneToOne(mappedBy = "produit", cascade = CascadeType.ALL)
    private Stock stock;
}