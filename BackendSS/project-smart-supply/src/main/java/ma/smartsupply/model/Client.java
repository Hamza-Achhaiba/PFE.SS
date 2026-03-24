package ma.smartsupply.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;

import ma.smartsupply.enums.ClientStatus;
import java.util.ArrayList; 
import java.util.List;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@SuperBuilder
@Table(name = "clients")
public class Client extends Utilisateur {

    private String nomMagasin;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Commande> commandes;

    @ManyToMany
    @JoinTable(name = "client_fournisseurs_favoris", joinColumns = @JoinColumn(name = "client_id"), inverseJoinColumns = @JoinColumn(name = "fournisseur_id"))
    @Builder.Default
    private List<Fournisseur> fournisseursFavoris = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ClientStatus status = ClientStatus.ACTIVE;
}
