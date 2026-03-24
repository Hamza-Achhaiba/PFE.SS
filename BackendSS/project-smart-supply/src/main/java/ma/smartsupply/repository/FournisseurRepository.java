package ma.smartsupply.repository;

import ma.smartsupply.model.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {
    List<Fournisseur> findByNomEntrepriseContainingIgnoreCase(String motCle);
    Optional<Fournisseur> findByEmail(String email);
    long countByStatus(ma.smartsupply.enums.SupplierStatus status);
}