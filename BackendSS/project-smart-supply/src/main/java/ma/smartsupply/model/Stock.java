package ma.smartsupply.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "stocks")
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer quantiteDisponible;
    private Integer seuilAlerte;
    private LocalDateTime dateDerniereMiseAJour;

    @OneToOne
    @JoinColumn(name = "produit_id")
    @JsonIgnore
    private Produit produit;

    public boolean estEnAlerte() {
        return quantiteDisponible <= seuilAlerte;
    }
}
