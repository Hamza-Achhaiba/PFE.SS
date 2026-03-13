package ma.smartsupply.repository;

import ma.smartsupply.model.Commande;
import ma.smartsupply.enums.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByClientId(Long clientId);

    List<Commande> findByStatut(StatutCommande statut);

    List<Commande> findByClientEmailOrderByDateCreationDesc(String email);

    List<Commande> findDistinctByLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(String email);

    List<Commande> findByClientEmailAndStatutOrderByDateCreationDesc(String email, StatutCommande statut);
}