package ma.smartsupply.repository;

import ma.smartsupply.model.Categorie;
import ma.smartsupply.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    List<Produit> findByFournisseurId(Long fournisseurId);

    List<Produit> findByCategorie(Categorie categorie);

    List<Produit> findByNomContainingIgnoreCase(String keyword);

    boolean existsByNomAndFournisseurId(String nom, Long fournisseurId);

    java.util.Optional<Produit> findByNomAndFournisseurId(String nom, Long fournisseurId);

    @Query("SELECT p FROM Produit p JOIN p.stock s WHERE p.actif = true " +
            "AND (:motCle IS NULL OR :motCle = '' OR LOWER(p.nom) LIKE LOWER(CONCAT('%', :motCle, '%'))) " +
            "AND (:enStock = false OR s.quantiteDisponible > 0)")
    List<Produit> rechercherProduits(
            @Param("motCle") String motCle,
            @Param("enStock") boolean enStock
    );
}