package ma.smartsupply.dto;

import lombok.Data;

@Data
public class CheckoutRequest {
    private String nomComplet;
    private String telephone;
    private String adresse;
    private String ville;
    private String region;
    private String codePostal;
    private String methodePaiement;
}
