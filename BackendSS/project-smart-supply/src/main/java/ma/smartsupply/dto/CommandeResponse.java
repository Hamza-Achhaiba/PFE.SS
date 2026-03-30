package ma.smartsupply.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommandeResponse {
    private Long id;
    private LocalDateTime dateCreation;
    private double montantTotal;
    private String statut;
    private String reference;
    private String trackingReference;
    private LocalDateTime dateLivraisonEstimee;
    private UtilisateurInfoDTO client;
    private List<LigneCommandeInfoDTO> lignes;

    // Checkout Details
    private String nomComplet;
    private String telephone;
    private String adresse;
    private String ville;
    private String region;
    private String codePostal;
    private String methodePaiement;
    private String paymentMethod;
    private String paymentStatus;
    private String escrowStatus;
    private LocalDateTime escrowHeldAt;
    private LocalDateTime escrowReleasedAt;
    private LocalDateTime refundedAt;
    private String refundRequestStatus;
    private LocalDateTime refundRequestedAt;
    private String refundRequestMessage;
    private String refundType;
    private String refundDescription;
    private String refundImagePath;
    private String refundAffectedItems;
    private Integer refundAffectedQuantity;
    private Double refundRequestedAmount;
    private String refundSupplierResponseType;
    private String refundSupplierMessage;
    private String refundSupplierImagePath;
    private LocalDateTime refundSupplierRespondedAt;
    private Double refundSupplierOfferedAmount;
    private LocalDateTime refundEscalatedToDisputeAt;
    private String disputeCategory;
    private String disputeReason;
    private LocalDateTime disputeRaisedAt;
    private String disputeImagePath;
    private String supplierResponseMessage;
    private String supplierResponseImagePath;
    private LocalDateTime supplierRespondedAt;
    private Long supportSupplierId;
    private String supportSupplierName;
    private String supportSupplierCompany;
    private String supportSupplierImage;
    private boolean multipleSuppliersInOrder;
    private Double amount;
    private Double platformFee;
    private Double supplierNetAmount;
    private String facturePath;
    private String invoicePath;
    private LocalDateTime clientConfirmedAt;
    private LocalDateTime autoReleaseEligibleAt;
}
