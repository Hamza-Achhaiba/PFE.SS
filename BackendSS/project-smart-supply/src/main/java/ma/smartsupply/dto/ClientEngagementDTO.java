package ma.smartsupply.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClientEngagementDTO {
    private Long id;
    private String nom;
    private String email;
    private String telephone;
    private String nomMagasin;
    private String adresse;
    private int orderCount;
    private double totalSpent;
    private LocalDateTime lastOrderDate;
}
