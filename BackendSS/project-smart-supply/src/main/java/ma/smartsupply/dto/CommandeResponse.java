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
    private Double amount;
    private Double platformFee;
    private Double supplierNetAmount;
    private String facturePath;
    private String invoicePath;
}
