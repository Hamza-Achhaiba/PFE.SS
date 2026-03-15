package ma.smartsupply.repository;

import ma.smartsupply.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE c.client.id = :clientId AND c.fournisseur.id = :fournisseurId")
    Optional<Conversation> findExistingConversation(@Param("clientId") Long clientId, @Param("fournisseurId") Long fournisseurId);

    @Query("SELECT c FROM Conversation c " +
           "WHERE (:userId = c.client.id AND c.deletedByClient = false) " +
           "OR (:userId = c.fournisseur.id AND c.deletedByFournisseur = false) " +
           "ORDER BY " +
           "CASE WHEN :userId = c.client.id THEN c.pinnedByClientId ELSE c.pinnedByFournisseurId END DESC NULLS LAST, " +
           "c.lastUpdateAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") Long userId);
}
