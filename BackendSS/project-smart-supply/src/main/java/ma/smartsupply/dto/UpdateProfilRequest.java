package ma.smartsupply.dto;

import lombok.Data;

@Data
public class UpdateProfilRequest {
    private String nom;
    private String telephone;
    private String adresse;
    private String nomMagasin;
    private String nomEntreprise;
    private String infoContact;
}