package ma.smartsupply.service;

import ma.smartsupply.dto.ProduitRequest;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.enums.StatutProduit;
import ma.smartsupply.enums.SupplierStatus;
import ma.smartsupply.enums.TypeNotification;
import ma.smartsupply.model.Categorie;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Produit;
import ma.smartsupply.model.Stock;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.CategorieRepository;
import ma.smartsupply.repository.ProduitRepository;
import ma.smartsupply.repository.StockRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final CategorieRepository categorieRepository;
    private final ma.smartsupply.repository.LignePanierRepository lignePanierRepository;
    private final ma.smartsupply.repository.LigneCommandeRepository ligneCommandeRepository;

    @Transactional
    public ProduitResponse ajouterProduit(ProduitRequest request, String emailFournisseur) {
        Fournisseur fournisseur = getAuthorizedSupplierForProductManagement(emailFournisseur);

        Produit produit = Produit.builder()
                .nom(request.getNom())
                .prix(request.getPrix())
                .description(request.getDescription())
                .image(request.getImage())
                .quantiteMinimumCommande(
                        request.getQuantiteMinimumCommande() != null ? request.getQuantiteMinimumCommande() : 1)
                .fournisseur(fournisseur)
                .build();

        if (request.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findById(request.getCategorieId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            produit.setCategorie(categorie);
        }
        produit = produitRepository.save(produit);

        Stock stock = Stock.builder()
                .produit(produit)
                .quantiteDisponible(request.getQuantiteInitiale())
                .seuilAlerte(request.getSeuilAlerte())
                .build();

        stockRepository.save(stock);
        produit.setStock(stock);

        return mapToProduitResponse(produit);
    }

    public List<ProduitResponse> getAllProduits() {
        return produitRepository.findByStatutApprobation(StatutProduit.APPROVED).stream()
                .map(this::mapToProduitResponse)
                .collect(Collectors.toList());
    }

    public List<ProduitResponse> getAllProduitsAdmin() {
        return produitRepository.findAll().stream()
                .map(this::mapToProduitResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProduitResponse updateStatutApprobation(Long produitId, StatutProduit statut) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit non trouvé"));
        produit.setStatutApprobation(statut);
        produitRepository.save(produit);
        return mapToProduitResponse(produit);
    }

    @Transactional
    public void supprimerProduitParAdmin(Long produitId) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit non trouvé"));

        if (ligneCommandeRepository.existsByProduitId(produitId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This product cannot be deleted because it is linked to existing orders. Consider rejecting it instead.");
        }

        lignePanierRepository.deleteByProduitId(produitId);

        if (produit.getImage() != null && !produit.getImage().isEmpty()) {
            try {
                String fileName = produit.getImage().substring(produit.getImage().lastIndexOf("/") + 1);
                java.nio.file.Path imagePath = java.nio.file.Paths.get("uploads/produits").resolve(fileName);
                java.nio.file.Files.deleteIfExists(imagePath);
            } catch (Exception e) {
                System.err.println("Error deleting product image: " + e.getMessage());
            }
        }

        produitRepository.delete(produit);
    }

    public List<ProduitResponse> getMesProduits(String emailFournisseur) {
        Utilisateur user = utilisateurRepository.findByEmail(emailFournisseur).orElseThrow();
        return produitRepository.findByFournisseurId(user.getId()).stream()
                .map(this::mapToProduitResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProduitResponse updateStock(Long produitId, Integer nouvelleQuantite, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé à ce produit");
        }
        assertSupplierCanManageProducts(produit.getFournisseur());

        Stock stock = produit.getStock();
        stock.setQuantiteDisponible(nouvelleQuantite);
        stockRepository.save(stock);

        if (stock.getSeuilAlerte() != null && nouvelleQuantite <= stock.getSeuilAlerte()) {
            String messageAlerte = "⚠️ ALERT: Your product '" + produit.getNom() +
                    "' has reached its critical threshold. Only " +
                    nouvelleQuantite + " unit(s) left!";

            notificationService.creer(produit.getFournisseur(), messageAlerte, TypeNotification.ALERTE_STOCK);
        }

        return mapToProduitResponse(produit);
    }

    @Transactional
    public Stock ajouterStock(Long produitId, int quantiteAjoutee, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé : Ce produit ne vous appartient pas.");
        }
        assertSupplierCanManageProducts(produit.getFournisseur());

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
    public void toggleStatutProduit(Long produitId, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID : " + produitId));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé : Vous ne pouvez modifier que vos propres produits.");
        }
        assertSupplierCanManageProducts(produit.getFournisseur());

        produit.setActif(!produit.isActif());
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
        assertSupplierCanManageProducts(produit.getFournisseur());

        if (request.getNom() != null) {
            produit.setNom(request.getNom());
        }
        if (request.getPrix() != null) {
            produit.setPrix(request.getPrix());
        }
        if (request.getDescription() != null) {
            produit.setDescription(request.getDescription());
        }
        if (request.getImage() != null) {
            produit.setImage(request.getImage());
        }
        if (request.getQuantiteMinimumCommande() != null) {
            produit.setQuantiteMinimumCommande(request.getQuantiteMinimumCommande());
        }

        if (request.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findById(request.getCategorieId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            produit.setCategorie(categorie);
        }

        Produit produitMaj = produitRepository.save(produit);
        return mapToProduitResponse(produitMaj);
    }

    @Transactional
    public void supprimerProduit(Long produitId, String emailFournisseur) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID : " + produitId));

        if (!produit.getFournisseur().getEmail().equals(emailFournisseur)) {
            throw new RuntimeException("Accès refusé : Vous ne pouvez supprimer que vos propres produits.");
        }
        assertSupplierCanManageProducts(produit.getFournisseur());

        if (ligneCommandeRepository.existsByProduitId(produitId)) {
            throw new IllegalStateException(
                    "Ce produit ne peut pas être supprimé car il est lié à des commandes existantes. Veuillez le désactiver à la place.");
        }

        lignePanierRepository.deleteByProduitId(produitId);

        if (produit.getImage() != null && !produit.getImage().isEmpty()) {
            try {
                String fileName = produit.getImage().substring(produit.getImage().lastIndexOf("/") + 1);
                java.nio.file.Path imagePath = java.nio.file.Paths.get("uploads/produits").resolve(fileName);
                java.nio.file.Files.deleteIfExists(imagePath);
            } catch (Exception e) {
                System.err.println("Erreur lors de la suppression de l'image du produit : " + e.getMessage());
            }
        }

        produitRepository.delete(produit);
    }

    private ProduitResponse mapToProduitResponse(Produit p) {
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
                .fournisseurId(p.getFournisseur() != null ? p.getFournisseur().getId() : null)
                .categorieId(p.getCategorie() != null ? p.getCategorie().getId() : null)
                .categorieNom(p.getCategorie() != null ? p.getCategorie().getNom() : null)
                .quantiteDisponible(quantite)
                .quantiteMinimumCommande(p.getQuantiteMinimumCommande() != null ? p.getQuantiteMinimumCommande() : 1)
                .alerteStock(isAlerte)
                .actif(p.isActif())
                .statutApprobation(p.getStatutApprobation())
                .build();
    }

    public List<ProduitResponse> getRestockSuggestions(String emailFournisseur) {
        Utilisateur user = utilisateurRepository.findByEmail(emailFournisseur).orElseThrow();
        return produitRepository.findByFournisseurId(user.getId()).stream()
                .filter(p -> p.getStock() != null &&
                        p.getStock().getQuantiteDisponible() != null &&
                        p.getStock().getSeuilAlerte() != null &&
                        p.getStock().getQuantiteDisponible() <= (p.getStock().getSeuilAlerte() * 1.5))
                .map(this::mapToProduitResponse)
                .collect(Collectors.toList());
    }

    private Fournisseur getAuthorizedSupplierForProductManagement(String emailFournisseur) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailFournisseur)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Fournisseur fournisseur)) {
            throw new RuntimeException("Seul un fournisseur peut ajouter des produits");
        }

        assertSupplierCanManageProducts(fournisseur);
        return fournisseur;
    }

    private void assertSupplierCanManageProducts(Fournisseur fournisseur) {
        SupplierStatus status = fournisseur.getStatus();
        if (status == null || status == SupplierStatus.ACTIVE || status == SupplierStatus.VERIFIED) {
            return;
        }

        String message = switch (status) {
            case SUSPENDED -> "Your supplier account is suspended. You cannot manage products.";
            case REJECTED -> "Your supplier account has been rejected. You cannot manage products.";
            case PENDING_APPROVAL -> "Your supplier account is pending approval. You cannot manage products yet.";
            default -> "Your supplier account is not active. You cannot manage products.";
        };

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
}
