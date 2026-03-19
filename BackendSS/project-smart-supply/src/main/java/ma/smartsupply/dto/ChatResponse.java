package ma.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String reply;
    private boolean error;

    public ChatResponse(String reply) {
        this.reply = reply;
        this.error = false;
    }
}
