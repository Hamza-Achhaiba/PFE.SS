package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;
import ma.smartsupply.enums.SupplierStatus;

@Data
@Builder
public class FournisseurResponse {
    private Long id;
    private String nom;
    private String email;
    private String telephone;
    private String adresse;
    private String nomEntreprise;
    private String infoContact;
    private String image;
    private String description;
    private SupplierStatus status;
    private Integer yearEstablished;
    private Double onTimeDelivery;
    private Double responseTime;
    private Double qualityAcceptance;
    private Double averageRating;
}
