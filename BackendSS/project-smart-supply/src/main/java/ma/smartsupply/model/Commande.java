package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.*;
import ma.smartsupply.enums.StatutCommande;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "commandes")
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateCreation;
    private Double montantTotal;

    @Enumerated(EnumType.STRING)
    private StatutCommande statut;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LigneCommande> lignes = new ArrayList<>();
}