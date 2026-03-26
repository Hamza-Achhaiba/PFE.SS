package ma.smartsupply.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import ma.smartsupply.enums.SupplierStatus;
import java.util.ArrayList;
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
    @Column(columnDefinition = "TEXT")
    private String description;
    private String categorie;
    
    @JsonIgnore
    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean verified = false;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SupplierStatus status = SupplierStatus.PENDING_APPROVAL;

    private Integer yearEstablished;

    // Legacy columns kept for schema compatibility. Profile performance is now
    // computed dynamically from orders, reviews, and conversation activity.
    private Double onTimeDelivery;
    private Double responseTime;
    private Double qualityAcceptance;

    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Produit> catalogue = new ArrayList<>();

    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    public SupplierStatus getStatus() {
        return status == null ? SupplierStatus.ACTIVE : status;
    }
}
