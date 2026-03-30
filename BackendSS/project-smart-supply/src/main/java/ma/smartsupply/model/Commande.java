package ma.smartsupply.model;

import jakarta.persistence.*;
import lombok.*;
import ma.smartsupply.enums.EscrowStatus;
import ma.smartsupply.enums.PaymentStatus;
import ma.smartsupply.enums.RefundRequestStatus;
import ma.smartsupply.enums.RefundType;
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

    @Enumerated(EnumType.STRING)
    private RefundType refundType;

    @Column(columnDefinition = "TEXT")
    private String refundDescription;

    private String refundImagePath;

    @Column(columnDefinition = "TEXT")
    private String refundAffectedItems;

    private Integer refundAffectedQuantity;

    private Double refundRequestedAmount;

    @Column(length = 30)
    private String refundSupplierResponseType;

    @Column(columnDefinition = "TEXT")
    private String refundSupplierMessage;

    private String refundSupplierImagePath;

    private LocalDateTime refundSupplierRespondedAt;

    private Double refundSupplierOfferedAmount;

    private LocalDateTime refundEscalatedToDisputeAt;

    @Column(length = 80)
    private String disputeCategory;
    @Column(columnDefinition = "TEXT")
    private String disputeReason;
    private LocalDateTime disputeRaisedAt;
    private String disputeImagePath;

    // Supplier dispute response
    @Column(columnDefinition = "TEXT")
    private String supplierResponseMessage;
    private String supplierResponseImagePath;
    private LocalDateTime supplierRespondedAt;

    // Admin decision
    @Column(columnDefinition = "TEXT")
    private String adminDecisionReason;
    private LocalDateTime adminDecisionAt;

    private Double amount;
    private Double platformFee;
    private Double supplierNetAmount;

    // Client receipt confirmation & auto-release
    private LocalDateTime clientConfirmedAt;
    private LocalDateTime autoReleaseEligibleAt;

    // Generated Invoice
    private String facturePath;
    private String invoicePath;
}
