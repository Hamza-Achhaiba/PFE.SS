package ma.smartsupply.repository;

import ma.smartsupply.model.LigneCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {
    boolean existsByProduitId(Long produitId);
    boolean existsByProduitFournisseurId(Long fournisseurId);
}
