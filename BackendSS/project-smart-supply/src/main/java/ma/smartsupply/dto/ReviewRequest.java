package ma.smartsupply.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long fournisseurId;
    private Integer rating;
    private String comment;
}
