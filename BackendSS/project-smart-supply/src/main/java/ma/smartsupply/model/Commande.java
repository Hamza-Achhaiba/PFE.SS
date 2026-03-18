package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.*;
import ma.smartsupply.enums.EscrowStatus;
import ma.smartsupply.enums.PaymentStatus;
import ma.smartsupply.enums.RefundRequestStatus;
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

    @Column(unique = true)
    private String reference;

    private LocalDateTime dateCreation;
    private Double montantTotal;

    private String trackingReference;
    private LocalDateTime dateLivraisonEstimee;

    @Enumerated(EnumType.STRING)
    private StatutCommande statut;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LigneCommande> lignes = new ArrayList<>();

    // Checkout Information
    private String nomComplet;
    private String telephone;
    private String adresse;
    private String ville;
    private String region;
    private String codePostal;
    private String methodePaiement;
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    private EscrowStatus escrowStatus;

    private LocalDateTime escrowHeldAt;
    private LocalDateTime escrowReleasedAt;
    private LocalDateTime refundedAt;
    @Enumerated(EnumType.STRING)
    private RefundRequestStatus refundRequestStatus;
    private LocalDateTime refundRequestedAt;
    @Column(length = 1200)
    private String refundRequestMessage;
    @Column(length = 80)
    private String disputeCategory;
    @Column(length = 2000)
    private String disputeReason;
    private LocalDateTime disputeRaisedAt;
    private Double amount;
    private Double platformFee;
    private Double supplierNetAmount;

    // Generated Invoice
    private String facturePath;
    private String invoicePath;
}
