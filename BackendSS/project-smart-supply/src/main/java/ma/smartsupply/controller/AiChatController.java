package ma.smartsupply.controller;

import ma.smartsupply.dto.ChatRequest;
import ma.smartsupply.dto.ChatResponse;
import ma.smartsupply.service.AiChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    @Autowired
    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ChatResponse("Message cannot be empty.", true, "Empty message"));
        }
        
        ChatResponse response = aiChatService.processChat(request);
        return ResponseEntity.ok(response);
    }
}
