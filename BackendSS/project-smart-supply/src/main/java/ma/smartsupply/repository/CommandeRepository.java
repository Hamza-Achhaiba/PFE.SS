package ma.smartsupply.repository;

import ma.smartsupply.model.Commande;
import ma.smartsupply.enums.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByClientId(Long clientId);

    List<Commande> findByStatut(StatutCommande statut);

    List<Commande> findByClientEmailOrderByDateCreationDesc(String email);

    List<Commande> findByClientEmailAndDateCreationBetweenOrderByDateCreationAsc(
            String email,
            LocalDateTime startDate,
            LocalDateTime endDate);

    List<Commande> findDistinctByLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(String email);

    List<Commande> findDistinctByLignes_Produit_Fournisseur_Email(String email);

    List<Commande> findDistinctByClientIdAndLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(Long clientId, String supplierEmail);

    List<Commande> findByClientEmailAndStatutOrderByDateCreationDesc(String email, StatutCommande statut);
    
    long countByRefundRequestStatusIsNotNull();
    long countByDisputeRaisedAtIsNotNull();
    List<Commande> findByRefundRequestStatusIsNotNullOrDisputeRaisedAtIsNotNullOrderByDateCreationDesc();
    boolean existsByClientId(Long clientId);
}
