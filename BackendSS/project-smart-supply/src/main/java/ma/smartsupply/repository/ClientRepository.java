package ma.smartsupply.repository;

import ma.smartsupply.model.Client;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findByNomMagasinContainingIgnoreCase(String motCle);

    @Modifying
    @Query(value = "DELETE FROM client_fournisseurs_favoris WHERE fournisseur_id = :supplierId", nativeQuery = true)
    void deleteFavoriteLinksBySupplierId(@Param("supplierId") Long supplierId);
}
