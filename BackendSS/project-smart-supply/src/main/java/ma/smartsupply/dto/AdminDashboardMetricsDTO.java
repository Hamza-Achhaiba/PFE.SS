package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardMetricsDTO {
    private long totalClients;
    private long totalSuppliers;
    private long pendingSuppliers;
    private long totalOrders;
    private long openDisputes;
    private long refundRequests;
}
