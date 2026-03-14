package ma.smartsupply.repository;

import ma.smartsupply.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByClientIdOrderByUpdatedAtDesc(Long clientId);

    List<Conversation> findByFournisseurIdOrderByUpdatedAtDesc(Long fournisseurId);

    Optional<Conversation> findByClientIdAndFournisseurId(Long clientId, Long fournisseurId);
}
