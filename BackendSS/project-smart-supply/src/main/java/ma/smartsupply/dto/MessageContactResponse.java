package ma.smartsupply.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageContactResponse {
    private Long id;
    private String name;
    private String role;
    private String image;
}
