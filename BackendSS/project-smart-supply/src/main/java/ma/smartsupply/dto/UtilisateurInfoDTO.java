package ma.smartsupply.dto;

import lombok.Data;

@Data
public class UtilisateurInfoDTO {
    private Long id;
    private String nom;
    private String email;
    private String telephone;
}