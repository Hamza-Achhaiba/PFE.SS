package ma.smartsupply.repository;

import ma.smartsupply.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByProduitId(Long produitId);
}