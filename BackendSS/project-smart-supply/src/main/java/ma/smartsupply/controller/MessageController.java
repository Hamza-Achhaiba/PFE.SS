package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ConversationResponse;
import ma.smartsupply.dto.MessageContactResponse;
import ma.smartsupply.dto.MessageResponse;
import ma.smartsupply.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/contacts")
    public ResponseEntity<List<MessageContactResponse>> getContacts(Principal principal) {
        return ResponseEntity.ok(messageService.getContacts(principal.getName()));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(Principal principal) {
        return ResponseEntity.ok(messageService.getConversations(principal.getName()));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<List<MessageResponse>> getConversationMessages(
            Principal principal,
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(messageService.getMessages(principal.getName(), conversationId));
    }

    @PostMapping(value = "/send", consumes = {"multipart/form-data"})
    public ResponseEntity<MessageResponse> sendMessage(
            Principal principal,
            @RequestParam Long recipientId,
            @RequestParam(required = false) String content,
            @RequestPart(required = false) MultipartFile image
    ) {
        return ResponseEntity.ok(messageService.sendMessage(principal.getName(), recipientId, content, image));
    }
}
