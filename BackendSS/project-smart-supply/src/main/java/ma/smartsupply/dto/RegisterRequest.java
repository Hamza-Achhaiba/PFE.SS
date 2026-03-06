package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String nom;
    private String email;
    private String motDePasse;
    private String role;

    private String nomEntreprise;
    private String nomMagasin;
    private String adresse;
    private String telephone;
}