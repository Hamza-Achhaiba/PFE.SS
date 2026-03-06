package ma.smartsupply.service;

import ma.smartsupply.dto.ProduitRequest;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.enums.TypeNotification;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Produit;
import ma.smartsupply.model.Stock;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.ProduitRepository;
import ma.smartsupply.repository.StockRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final StockRepository stockRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;

    @Transactional
    public ProduitResponse ajouterProduit(ProduitRequest request, String emailFournisseur) {

        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailFournisseur)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Fournisseur)) {
            throw new RuntimeException("Seul un fournisseur peut ajouter des produits");
        }
        Fournisseur fournisseur = (Fournisseur) utilisateur;


        Produit produit = Produit.builder()
                .nom(request.getNom())
                .prix(request.getPrix())
                .description(request.getDescription())
                .image(request.getImage())
                .fournisseur(fournisseur)
                .build();
        produit = produitRepository.save(produit);

        Stock stock = Stock.builder()
                .produit(produit)
                .quantiteDisponible(request.getQuantiteInitiale())
                .seuilAlerte(request.getSeuilAlerte())
                .build();

        stockRepository.save(stock);
        produit.setStock(stock);

        return mapToResponse(produit);
    }

    public List<ProduitResponse> getAllProduits() {
        return produitRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProduitResponse> getMesProduits(String emailFournisseur) {
        Utilisateur user = utilisateurRepository.findByEmail(emailFournisseur).orElseThrow();
        return produitRepository.findByFournisseurId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    public ProduitResponse updateStock(Long produitId, Integer nouvelleQuantite, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé à ce produit");
        }

        Stock stock = produit.getStock();
        stock.setQuantiteDisponible(nouvelleQuantite);
        stockRepository.save(stock);


        if (stock.getSeuilAlerte() != null && nouvelleQuantite <= stock.getSeuilAlerte()) {
            String messageAlerte = "⚠️ ALERTE : Votre produit '" + produit.getNom() +
                    "' a atteint son seuil critique. Il ne reste que " +
                    nouvelleQuantite + " unité(s) !";

            notificationService.creer(produit.getFournisseur(), messageAlerte, TypeNotification.ALERTE_STOCK);
        }


        return mapToResponse(produit);
    }

    private ProduitResponse mapToResponse(Produit p) {
        int quantite = 0;
        boolean isAlerte = false;
        String nomFournisseur = "Non assigné";


        if (p.getStock() != null) {

            if (p.getStock().getQuantiteDisponible() != null) {
                quantite = p.getStock().getQuantiteDisponible();
            }


            int seuil = (p.getStock().getSeuilAlerte() != null) ? p.getStock().getSeuilAlerte() : 0;

            isAlerte = quantite <= seuil;
        }

        if (p.getFournisseur() != null && p.getFournisseur().getNomEntreprise() != null) {
            nomFournisseur = p.getFournisseur().getNomEntreprise();
        }

        return ProduitResponse.builder()
                .id(p.getId())
                .nom(p.getNom())
                .prix(p.getPrix())
                .description(p.getDescription())
                .image(p.getImage())
                .nomFournisseur(nomFournisseur)
                .quantiteDisponible(quantite)
                .alerteStock(isAlerte)
                .build();
    }

    @Transactional
    public Stock ajouterStock(Long produitId, int quantiteAjoutee, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé : Ce produit ne vous appartient pas.");
        }

        Stock stock = produit.getStock();
        if (stock == null) {
            throw new RuntimeException("Erreur : Aucun stock n'est associé à ce produit.");
        }

        int nouveauStock = stock.getQuantiteDisponible() + quantiteAjoutee;
        stock.setQuantiteDisponible(nouveauStock);
        stock.setDateDerniereMiseAJour(LocalDateTime.now());

        return stockRepository.save(stock);
    }

    @Transactional
    public void desactiverProduit(Long produitId, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID : " + produitId));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé : Vous ne pouvez modifier que vos propres produits.");
        }
        produit.setActif(false);
        produitRepository.save(produit);
    }

    public List<ProduitResponse> rechercherProduits(String motCle, boolean enStock) {
        return produitRepository.rechercherProduits(motCle, enStock)
                .stream()
                .map(this::mapToProduitResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProduitResponse modifierProduit(Long produitId, ProduitRequest request, String emailFournisseur) {

        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID : " + produitId));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé : Vous ne pouvez modifier que vos propres produits.");
        }

        if (request.getNom() != null) produit.setNom(request.getNom());
        if (request.getPrix() != null) produit.setPrix(request.getPrix());
        if (request.getDescription() != null) produit.setDescription(request.getDescription());
        if (request.getImage() != null) produit.setImage(request.getImage());

        Produit produitMaj = produitRepository.save(produit);

        return mapToResponse(produitMaj);
    }
    private ProduitResponse mapToProduitResponse(Produit produit) {
        Integer quantite = 0;
        boolean enAlerte = false;

        if (produit.getStock() != null) {
            quantite = produit.getStock().getQuantiteDisponible();
            enAlerte = quantite <= produit.getStock().getSeuilAlerte();
        }

        String nomFourn = (produit.getFournisseur() != null) ? produit.getFournisseur().getNomEntreprise() : "Inconnu";

        return ProduitResponse.builder()
                .id(produit.getId())
                .nom(produit.getNom())
                .prix(produit.getPrix())
                .description(produit.getDescription())
                .image(produit.getImage())
                .nomFournisseur(nomFourn)
                .quantiteDisponible(quantite)
                .alerteStock(enAlerte)
                .build();
    }


}