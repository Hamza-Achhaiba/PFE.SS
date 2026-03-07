package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.AnalyticsStatsResponse;
import ma.smartsupply.model.Commande;
import ma.smartsupply.enums.StatutCommande;
import ma.smartsupply.repository.CommandeRepository;
import ma.smartsupply.repository.ProduitRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import ma.smartsupply.dto.SalesTimelineResponse;
import ma.smartsupply.dto.TopProduitResponse;
import ma.smartsupply.model.LigneCommande;
import ma.smartsupply.model.Produit;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;

    public AnalyticsStatsResponse getFournisseurStats(String emailFournisseur) {
        // Find all orders that contain products from this supplier
        List<Commande> ventesFournisseur = commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_Email(emailFournisseur);

        double caTotal = 0;
        long totalCommandes = ventesFournisseur.size();

        // Calculate revenue only for VALIDEE/EXPEDIEE/LIVREE orders, summing only the
        // supplier's products
        for (Commande commande : ventesFournisseur) {
            if (commande.getStatut() != StatutCommande.ANNULEE) {
                double sousTotalFournisseur = commande.getLignes().stream()
                        .filter(l -> l.getProduit().getFournisseur().getEmail().equals(emailFournisseur))
                        .mapToDouble(l -> l.getSousTotal())
                        .sum();
                caTotal += sousTotalFournisseur;
            }
        }

        // Count unique clients for this supplier
        long clientsUniques = ventesFournisseur.stream()
                .map(c -> c.getClient().getId())
                .distinct()
                .count();

        // Calculate out-of-stock products for this supplier
        long produitsEnRupture = produitRepository.findByFournisseurId(
                ventesFournisseur.isEmpty() ? null
                        : ventesFournisseur.get(0).getLignes().get(0).getProduit().getFournisseur().getId())
                .stream()
                .filter(p -> p.getStock() != null && p.getStock().getQuantiteDisponible() != null
                        && p.getStock().getQuantiteDisponible() <= 0)
                .count();

        return AnalyticsStatsResponse.builder()
                .chiffreAffairesTotal(caTotal)
                .totalCommandes(totalCommandes)
                .clientsUniques(clientsUniques)
                .totalProduitsEnRupture(produitsEnRupture)
                .build();
    }

    public List<SalesTimelineResponse> getSalesTimeline(String emailFournisseur) {
        List<Commande> ventesFournisseur = commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_Email(emailFournisseur);

        Map<String, Double> caParJour = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (Commande commande : ventesFournisseur) {
            if (commande.getStatut() != StatutCommande.ANNULEE) {
                String dateJour = commande.getDateCreation().format(formatter);

                double sousTotalFournisseur = commande.getLignes().stream()
                        .filter(l -> l.getProduit().getFournisseur().getEmail().equals(emailFournisseur))
                        .mapToDouble(l -> l.getSousTotal())
                        .sum();

                caParJour.put(dateJour, caParJour.getOrDefault(dateJour, 0.0) + sousTotalFournisseur);
            }
        }

        return caParJour.entrySet().stream()
                .map(entry -> new SalesTimelineResponse(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(SalesTimelineResponse::getDate))
                .collect(Collectors.toList());
    }

    public List<TopProduitResponse> getTopProduits(String emailFournisseur) {
        List<Commande> ventesFournisseur = commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_Email(emailFournisseur);

        Map<Long, TopProduitResponse> produitStats = new HashMap<>();

        for (Commande commande : ventesFournisseur) {
            if (commande.getStatut() != StatutCommande.ANNULEE) {
                for (LigneCommande ligne : commande.getLignes()) {
                    Produit produit = ligne.getProduit();
                    if (produit.getFournisseur().getEmail().equals(emailFournisseur)) {
                        TopProduitResponse stats = produitStats.getOrDefault(produit.getId(),
                                new TopProduitResponse(produit.getId(), produit.getNom(), 0.0, 0L));

                        stats.setChiffreAffaires(stats.getChiffreAffaires() + ligne.getSousTotal());
                        stats.setQuantiteVendue(stats.getQuantiteVendue() + ligne.getQuantite());

                        produitStats.put(produit.getId(), stats);
                    }
                }
            }
        }

        return produitStats.values().stream()
                .sorted(Comparator.comparing(TopProduitResponse::getChiffreAffaires).reversed())
                .limit(5) // Top 5
                .collect(Collectors.toList());
    }
}
