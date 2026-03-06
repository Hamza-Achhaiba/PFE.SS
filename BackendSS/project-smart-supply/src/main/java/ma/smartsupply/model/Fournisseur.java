package ma.smartsupply.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import java.util.List;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@SuperBuilder
@Table(name = "fournisseurs")
public class Fournisseur extends Utilisateur {

    private String nomEntreprise;
    private String infoContact;

    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Produit> catalogue;
}