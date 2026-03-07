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
}