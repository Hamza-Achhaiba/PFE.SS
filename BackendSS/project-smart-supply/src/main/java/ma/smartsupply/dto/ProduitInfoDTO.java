package ma.smartsupply.dto;

import lombok.Data;

@Data
public class ProduitInfoDTO {
    private Long id;
    private String nom;
    private double prix;
}