package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ConversationResponse;
import ma.smartsupply.dto.MessageRequest;
import ma.smartsupply.dto.MessageResponse;
import ma.smartsupply.service.ConversationService;
import ma.smartsupply.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    @PostMapping("/conversations/start")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<ConversationResponse> startConversation(@RequestParam Long targetUserId, Principal principal) {
        return ResponseEntity.ok(conversationService.startConversation(principal.getName(), targetUserId));
    }

    @GetMapping("/conversations")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<List<ConversationResponse>> getMyConversations(Principal principal) {
        return ResponseEntity.ok(conversationService.getMyConversations(principal.getName()));
    }

    @GetMapping("/conversations/{conversationId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long conversationId, Principal principal) {
        return ResponseEntity.ok(messageService.getMessagesByConversation(conversationId, principal.getName()));
    }

    @PostMapping("/conversations/{conversationId}/text")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<MessageResponse> sendTextMessage(
            @PathVariable Long conversationId,
            @RequestBody MessageRequest request,
            Principal principal) {
        return ResponseEntity.ok(messageService.sendTextMessage(conversationId, request, principal.getName()));
    }

    @PostMapping("/conversations/{conversationId}/image")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<MessageResponse> sendImageMessage(
            @PathVariable Long conversationId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        return ResponseEntity.ok(messageService.sendImageMessage(conversationId, file, principal.getName()));
    }

    @PutMapping("/conversations/{conversationId}/pin")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<Void> pinConversation(
            @PathVariable Long conversationId,
            @RequestParam boolean pinned,
            Principal principal) {
        conversationService.pinConversation(conversationId, principal.getName(), pinned);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/conversations/{conversationId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId,
            Principal principal) {
        conversationService.deleteConversation(conversationId, principal.getName());
        return ResponseEntity.ok().build();
    }
}
