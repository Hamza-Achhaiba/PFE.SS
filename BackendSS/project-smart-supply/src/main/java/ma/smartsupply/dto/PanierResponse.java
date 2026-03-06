package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PanierResponse {
    private Long id;
    private List<LignePanierResponse> lignes;
    private double montantTotal;
}