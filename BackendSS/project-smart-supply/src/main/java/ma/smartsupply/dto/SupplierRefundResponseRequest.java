package ma.smartsupply.dto;

import lombok.Data;

@Data
public class SupplierRefundResponseRequest {
    private String responseType;
    private String message;
    private String imagePath;
    private Double offeredAmount;
}
