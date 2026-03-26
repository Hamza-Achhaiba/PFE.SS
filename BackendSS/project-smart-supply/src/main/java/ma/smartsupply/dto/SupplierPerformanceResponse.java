package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupplierPerformanceResponse {
    private Double onTime;
    private Double response;
    private Double quality;
    private long reviewCount;
    private long orderCount;
    private boolean hasEnoughData;
}
