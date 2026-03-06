package ma.smartsupply.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

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

    private Integer quantiteStock;
    private Integer seuilAlerte;

    @Builder.Default
    private boolean actif = true;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;

    @JsonIgnore
    @OneToOne(mappedBy = "produit", cascade = CascadeType.ALL)
    private Stock stock;
}