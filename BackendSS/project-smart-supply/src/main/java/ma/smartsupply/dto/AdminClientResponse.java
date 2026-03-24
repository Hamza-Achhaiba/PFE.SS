package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;
import ma.smartsupply.enums.ClientStatus;

@Data
@Builder
public class AdminClientResponse {
    private Long id;
    private String nom;
    private String email;
    private String telephone;
    private String nomMagasin;
    private ClientStatus status;
    private String adresse;
    private String ville;
    private String region;
}
