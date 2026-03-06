package ma.smartsupply.service;

import ma.smartsupply.dto.LignePanierResponse;
import ma.smartsupply.dto.PanierResponse;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PanierService {

    @Autowired
    private PanierRepository panierRepository;
    @Autowired
    private ProduitRepository produitRepository;
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Transactional
    public Panier ajouterAuPanier(String emailClient, Long produitId, int quantite) {

        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable."));

        if (produit.getStock() == null || produit.getStock().getQuantiteDisponible() < quantite) {
            throw new RuntimeException("Stock insuffisant pour ce produit.");
        }

        Panier panier = panierRepository.findByClientEmail(emailClient)
                .orElseGet(() -> {
                    Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                            .orElseThrow(() -> new RuntimeException("Client introuvable."));
                    Panier nouveauPanier = new Panier();
                    nouveauPanier.setClient(client);
                    return panierRepository.save(nouveauPanier);
                });

        Optional<LignePanier> ligneExistante = panier.getLignes().stream()
                .filter(ligne -> ligne.getProduit().getId().equals(produitId))
                .findFirst();

        if (ligneExistante.isPresent()) {

            LignePanier ligne = ligneExistante.get();
            ligne.setQuantite(ligne.getQuantite() + quantite);
            ligne.setSousTotal(ligne.getQuantite() * produit.getPrix());
        } else {
            LignePanier nouvelleLigne = new LignePanier();
            nouvelleLigne.setPanier(panier);
            nouvelleLigne.setProduit(produit);
            nouvelleLigne.setQuantite(quantite);
            nouvelleLigne.setSousTotal(quantite * produit.getPrix());
            panier.getLignes().add(nouvelleLigne);
        }

        double total = panier.getLignes().stream()
                .mapToDouble(LignePanier::getSousTotal)
                .sum();
        panier.setMontantTotal(total);

        return panierRepository.save(panier);

    }

    public PanierResponse getMonPanier(String emailClient) {
        Optional<Panier> panierOpt = panierRepository.findByClientEmail(emailClient);

        if (panierOpt.isEmpty()) {
            return PanierResponse.builder()
                    .montantTotal(0.0)
                    .lignes(new ArrayList<>())
                    .build();
        }

        Panier panier = panierOpt.get();

        List<LignePanierResponse> lignesDto = panier.getLignes().stream().map(ligne ->
                LignePanierResponse.builder()
                        .id(ligne.getId())
                        .produitId(ligne.getProduit().getId())
                        .nomProduit(ligne.getProduit().getNom())
                        .image(ligne.getProduit().getImage())
                        .prixUnitaire(ligne.getProduit().getPrix())
                        .quantite(ligne.getQuantite())
                        .sousTotal(ligne.getSousTotal())
                        .build()
        ).collect(Collectors.toList());

        return PanierResponse.builder()
                .id(panier.getId())
                .lignes(lignesDto)
                .montantTotal(panier.getMontantTotal())
                .build();
    }

}

