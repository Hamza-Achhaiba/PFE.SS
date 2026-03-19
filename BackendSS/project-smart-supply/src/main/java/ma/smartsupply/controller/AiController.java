package ma.smartsupply.controller;

import ma.smartsupply.dto.ChatRequest;
import ma.smartsupply.dto.ChatResponse;
import ma.smartsupply.service.AiService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ChatResponse("Message cannot be empty.", true));
        }
        ChatResponse response = aiService.processChat(request);
        return ResponseEntity.ok(response);
    }
}
