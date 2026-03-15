package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ConversationResponse;
import ma.smartsupply.model.Client;
import ma.smartsupply.model.Conversation;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.ConversationRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public ConversationResponse startConversation(String userEmail, Long targetUserId) {
        Utilisateur currentUser = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Utilisateur targetUser = utilisateurRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Client client;
        Fournisseur fournisseur;

        if (currentUser instanceof Client && targetUser instanceof Fournisseur) {
            client = (Client) currentUser;
            fournisseur = (Fournisseur) targetUser;
        } else if (currentUser instanceof Fournisseur && targetUser instanceof Client) {
            fournisseur = (Fournisseur) currentUser;
            client = (Client) targetUser;
        } else {
            throw new RuntimeException("A conversation must be between a client and a supplier.");
        }

        Optional<Conversation> existing = conversationRepository.findExistingConversation(client.getId(), fournisseur.getId());
        if (existing.isPresent()) {
            return mapToResponse(existing.get(), currentUser.getId());
        }

        Conversation conversation = Conversation.builder()
                .client(client)
                .fournisseur(fournisseur)
                .lastUpdateAt(LocalDateTime.now())
                .build();

        return mapToResponse(conversationRepository.save(conversation), currentUser.getId());
    }

    public List<ConversationResponse> getMyConversations(String userEmail) {
        Utilisateur currentUser = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return conversationRepository.findAllByUserId(currentUser.getId())
                .stream()
                .map(c -> mapToResponse(c, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public Conversation getConversationEntity(Long id, String userEmail) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getClient().getEmail().equalsIgnoreCase(userEmail) && 
            !conversation.getFournisseur().getEmail().equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Access denied to this conversation");
        }
        return conversation;
    }

    public ConversationResponse mapToResponse(Conversation c, Long currentUserId) {
        boolean isCurrentClient = c.getClient().getId().equals(currentUserId);
        
        String otherName = isCurrentClient ? c.getFournisseur().getNom() : c.getClient().getNom();
        String otherSubtitle = isCurrentClient ? c.getFournisseur().getNomEntreprise() : c.getClient().getNomMagasin();

        String lastMsg = "Démarrer une conversation";
        if (c.getMessages() != null && !c.getMessages().isEmpty()) {
            ma.smartsupply.model.Message m = c.getMessages().get(c.getMessages().size() - 1);
            lastMsg = m.getContent() != null ? m.getContent() : "[Image]";
        }

        boolean isPinned = isCurrentClient ? c.getPinnedByClientId() != null : c.getPinnedByFournisseurId() != null;

        return ConversationResponse.builder()
                .id(c.getId())
                .clientId(c.getClient().getId())
                .clientName(c.getClient().getNom())
                .clientMagasin(c.getClient().getNomMagasin())
                .fournisseurId(c.getFournisseur().getId())
                .fournisseurName(c.getFournisseur().getNom())
                .fournisseurEntreprise(c.getFournisseur().getNomEntreprise())
                .otherPartyName(otherName)
                .otherPartySubtitle(otherSubtitle)
                .lastMessage(lastMsg)
                .lastMessageAt(c.getLastUpdateAt())
                .isPinned(isPinned)
                .build();
    }

    @Transactional
    public void pinConversation(Long id, String email, boolean pinned) {
        Conversation c = getConversationEntity(id, email);
        Utilisateur currentUser = utilisateurRepository.findByEmail(email).get();

        if (c.getClient().getId().equals(currentUser.getId())) {
            c.setPinnedByClientId(pinned ? LocalDateTime.now() : null);
        } else {
            c.setPinnedByFournisseurId(pinned ? LocalDateTime.now() : null);
        }
        conversationRepository.save(c);
    }

    @Transactional
    public void deleteConversation(Long id, String email) {
        Conversation c = getConversationEntity(id, email);
        Utilisateur currentUser = utilisateurRepository.findByEmail(email).get();

        if (c.getClient().getId().equals(currentUser.getId())) {
            c.setDeletedByClient(true);
        } else {
            c.setDeletedByFournisseur(true);
        }
        conversationRepository.save(c);
    }
}
