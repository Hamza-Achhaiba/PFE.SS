package ma.smartsupply.repository;

import ma.smartsupply.model.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {
    List<Fournisseur> findByNomEntrepriseContainingIgnoreCase(String motCle);
}