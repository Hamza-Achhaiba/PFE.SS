package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LignePanier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "panier_id")
    private Panier panier;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

    private int quantite;

    private double sousTotal;
}