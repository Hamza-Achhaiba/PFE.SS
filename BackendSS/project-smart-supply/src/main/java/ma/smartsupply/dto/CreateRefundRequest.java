package ma.smartsupply.dto;

import lombok.Data;

@Data
public class CreateRefundRequest {
    private String type;
    private String description;
    private String imagePath;
    private String affectedItems;
    private Integer affectedQuantity;
    private Double requestedAmount;
}
