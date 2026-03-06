package ma.smartsupply.dto;

import lombok.Data;
import java.util.List;

@Data
public class CommandeRequest {

    private List<LigneCommandeRequest> lignes;
}