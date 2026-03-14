package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ConversationResponse;
import ma.smartsupply.dto.MessageContactResponse;
import ma.smartsupply.dto.MessageResponse;
import ma.smartsupply.enums.Role;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UtilisateurRepository utilisateurRepository;
    private final ClientRepository clientRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public List<MessageContactResponse> getContacts(String email) {
        Utilisateur me = getCurrentUser(email);
        if (me.getRole() == Role.CLIENT) {
            return fournisseurRepository.findAll().stream()
                    .map(f -> MessageContactResponse.builder()
                            .id(f.getId())
                            .name(f.getNomEntreprise() != null ? f.getNomEntreprise() : f.getNom())
                            .role(f.getRole().name())
                            .image(f.getImage())
                            .build())
                    .toList();
        }

        return clientRepository.findAll().stream()
                .map(c -> MessageContactResponse.builder()
                        .id(c.getId())
                        .name(c.getNomMagasin() != null ? c.getNomMagasin() : c.getNom())
                        .role(c.getRole().name())
                        .image(c.getImage())
                        .build())
                .toList();
    }

    public List<ConversationResponse> getConversations(String email) {
        Utilisateur me = getCurrentUser(email);
        List<Conversation> conversations = me.getRole() == Role.CLIENT
                ? conversationRepository.findByClientIdOrderByUpdatedAtDesc(me.getId())
                : conversationRepository.findByFournisseurIdOrderByUpdatedAtDesc(me.getId());

        return conversations.stream()
                .map(c -> mapConversation(c, me.getId()))
                .sorted(Comparator.comparing(ConversationResponse::getLastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<MessageResponse> getMessages(String email, Long conversationId) {
        Utilisateur me = getCurrentUser(email);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation introuvable"));
        ensureMember(conversation, me);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(this::mapMessage)
                .toList();
    }

    @Transactional
    public MessageResponse sendMessage(String email, Long recipientId, String content, MultipartFile image) {
        Utilisateur sender = getCurrentUser(email);
        Utilisateur recipient = utilisateurRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Destinataire introuvable"));

        validateRecipient(sender, recipient);

        String trimmedContent = content == null ? "" : content.trim();
        if (trimmedContent.isEmpty() && (image == null || image.isEmpty())) {
            throw new RuntimeException("Le message doit contenir du texte ou une image");
        }

        String imagePath = (image != null && !image.isEmpty()) ? saveMessageImage(image) : null;

        Client client = sender.getRole() == Role.CLIENT ? (Client) sender : (Client) recipient;
        Fournisseur fournisseur = sender.getRole() == Role.FOURNISSEUR ? (Fournisseur) sender : (Fournisseur) recipient;

        Conversation conversation = conversationRepository.findByClientIdAndFournisseurId(client.getId(), fournisseur.getId())
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .client(client)
                        .fournisseur(fournisseur)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));

        Message saved = messageRepository.save(Message.builder()
                .conversation(conversation)
                .sender(sender)
                .receiver(recipient)
                .content(trimmedContent.isBlank() ? null : trimmedContent)
                .imagePath(imagePath)
                .createdAt(LocalDateTime.now())
                .build());

        conversation.setUpdatedAt(saved.getCreatedAt());
        conversationRepository.save(conversation);

        return mapMessage(saved);
    }

    private String saveMessageImage(MultipartFile file) {
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Type de fichier non supporté. Utilisez JPG, PNG, WEBP ou GIF");
        }

        try {
            Path uploadPath = Paths.get("uploads/messages");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")
                    ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.'))
                    : ".jpg";
            String fileName = UUID.randomUUID() + extension;

            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/messages/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'upload de l'image");
        }
    }

    private ConversationResponse mapConversation(Conversation conversation, Long currentUserId) {
        Utilisateur other = conversation.getClient().getId().equals(currentUserId)
                ? conversation.getFournisseur()
                : conversation.getClient();

        Message lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);

        return ConversationResponse.builder()
                .conversationId(conversation.getId())
                .participantId(other.getId())
                .participantName(other instanceof Fournisseur f ? (f.getNomEntreprise() != null ? f.getNomEntreprise() : f.getNom()) : ((Client) other).getNomMagasin() != null ? ((Client) other).getNomMagasin() : other.getNom())
                .participantRole(other.getRole().name())
                .participantImage(other.getImage())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastImagePath(lastMessage != null ? lastMessage.getImagePath() : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : conversation.getUpdatedAt())
                .build();
    }

    private MessageResponse mapMessage(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getNom())
                .content(message.getContent())
                .imagePath(message.getImagePath())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private Utilisateur getCurrentUser(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    private void validateRecipient(Utilisateur sender, Utilisateur recipient) {
        if (sender.getId().equals(recipient.getId())) {
            throw new RuntimeException("Vous ne pouvez pas vous envoyer de message");
        }
        if (sender.getRole() == recipient.getRole()) {
            throw new AccessDeniedException("Les messages sont autorisés uniquement entre client et fournisseur");
        }
    }

    private void ensureMember(Conversation conversation, Utilisateur user) {
        boolean isMember = conversation.getClient().getId().equals(user.getId())
                || conversation.getFournisseur().getId().equals(user.getId());
        if (!isMember) {
            throw new AccessDeniedException("Accès refusé à cette conversation");
        }
    }
}
