package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminChartDataDTO {

    private List<DailyOrderCount> ordersOverTime;
    private Map<String, Long> ordersByStatus;
    private Map<String, Long> productsByStatus;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyOrderCount {
        private String day;
        private long count;
    }
}
