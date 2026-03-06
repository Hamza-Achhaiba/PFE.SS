package ma.smartsupply.dto;

import lombok.Data;

@Data
public class AjoutPanierRequest {
    private Long produitId;
    private int quantite;
}