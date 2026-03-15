package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.MessageRequest;
import ma.smartsupply.dto.MessageResponse;
import ma.smartsupply.model.Conversation;
import ma.smartsupply.model.Message;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.ConversationRepository;
import ma.smartsupply.repository.MessageRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ConversationService conversationService;

    public List<MessageResponse> getMessagesByConversation(Long conversationId, String userEmail) {
        Utilisateur currentUser = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Authorization check
        conversationService.getConversationEntity(conversationId, userEmail);

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(m -> mapToResponse(m, currentUser.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendTextMessage(Long conversationId, MessageRequest request, String userEmail) {
        Utilisateur currentUser = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        Conversation conversation = conversationService.getConversationEntity(conversationId, userEmail);

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(currentUser.getId())
                .senderRole(currentUser.getRole())
                .content(request.getContent())
                .build();

        message = messageRepository.save(message);
        
        conversation.setLastUpdateAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToResponse(message, currentUser.getId());
    }

    @Transactional
    public MessageResponse sendImageMessage(Long conversationId, MultipartFile file, String userEmail) {
        Utilisateur currentUser = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        Conversation conversation = conversationService.getConversationEntity(conversationId, userEmail);

        String imageUrl = saveImage(file);

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(currentUser.getId())
                .senderRole(currentUser.getRole())
                .imageUrl(imageUrl)
                .build();

        message = messageRepository.save(message);

        conversation.setLastUpdateAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToResponse(message, currentUser.getId());
    }

    private String saveImage(MultipartFile file) {
        try {
            Path uploadPath = Paths.get("uploads/messages");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName != null && originalFileName.contains(".")
                    ? originalFileName.substring(originalFileName.lastIndexOf("."))
                    : ".jpg";
            String fileName = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath);

            // Using relative path for the URL, matching existing patterns
            return "/uploads/messages/" + fileName;
        } catch (Exception e) {
            throw new RuntimeException("Could not save image: " + e.getMessage());
        }
    }

    private MessageResponse mapToResponse(Message m, Long currentUserId) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSenderId())
                .senderRole(m.getSenderRole())
                .content(m.getContent())
                .imageUrl(m.getImageUrl())
                .createdAt(m.getCreatedAt())
                .isMine(m.getSenderId().equals(currentUserId))
                .build();
    }
}
