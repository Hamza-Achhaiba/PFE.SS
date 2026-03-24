package ma.smartsupply.repository;

import ma.smartsupply.model.LignePanier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LignePanierRepository extends JpaRepository<LignePanier, Long> {
    void deleteByProduitId(Long produitId);
    void deleteByProduitFournisseurId(Long fournisseurId);
}
