package ma.smartsupply.dto;

import lombok.Data;

@Data
public class RaiseDisputeRequest {
    private String category;
    private String reason;
    private String imagePath;
}
