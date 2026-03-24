package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;
import ma.smartsupply.enums.SupplierStatus;
import java.util.List;

@Data
@Builder
public class AdminFournisseurResponse {
    private Long id;
    private String nom;
    private String nomEntreprise;
    private String email;
    private String telephone;
    private SupplierStatus status;
    private String categorie;
    private List<String> productCategories;
    private String adresse;
    private String ville;
    private String region;
    private String description;
}
