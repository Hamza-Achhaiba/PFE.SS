package ma.smartsupply.controller;

import ma.smartsupply.dto.ProduitRequest;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.model.Stock;
import ma.smartsupply.service.ProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    @PostMapping
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<ProduitResponse> ajouterProduit(
            @RequestBody ProduitRequest request,
            Principal principal) {
        return ResponseEntity.ok(produitService.ajouterProduit(request, principal.getName()));
    }

    @GetMapping
    public ResponseEntity<List<ProduitResponse>> getAllProduits() {
        return ResponseEntity.ok(produitService.getAllProduits());
    }

    @GetMapping("/mes-produits")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<List<ProduitResponse>> getMesProduits(Principal principal) {
        return ResponseEntity.ok(produitService.getMesProduits(principal.getName()));
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<ProduitResponse> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantite,
            Principal principal) {
        return ResponseEntity.ok(produitService.updateStock(id, quantite, principal.getName()));
    }

    @PutMapping("/{id}/ajouter-stock")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<Stock> ajouterStock(
            @PathVariable Long id,
            @RequestParam int quantite,
            Principal principal) {
        if (quantite <= 0) {
            throw new IllegalArgumentException("La quantité à ajouter doit être supérieure à 0.");
        }

        Stock stockMisAJour = produitService.ajouterStock(id, quantite, principal.getName());
        return ResponseEntity.ok(stockMisAJour);
    }

    @PutMapping("/{id}/toggle-statut")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<String> toggleStatutProduit(
            @PathVariable Long id,
            Principal principal) {
        produitService.toggleStatutProduit(id, principal.getName());
        return ResponseEntity.ok("Le statut du produit a été mis à jour avec succès.");
    }

    @GetMapping("/recherche")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<List<ProduitResponse>> rechercherProduits(
            @RequestParam(required = false) String motCle,
            @RequestParam(defaultValue = "false") boolean enStock) {
        List<ProduitResponse> resultats = produitService.rechercherProduits(motCle, enStock);
        return ResponseEntity.ok(resultats);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<ProduitResponse> modifierProduit(
            @PathVariable Long id,
            @RequestBody ProduitRequest request,
            Principal principal) {
        ProduitResponse produitMaj = produitService.modifierProduit(id, request, principal.getName());
        return ResponseEntity.ok(produitMaj);
    }

    @GetMapping("/suggestions-reapprovisionnement")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<List<ProduitResponse>> getRestockSuggestions(Principal principal) {
        return ResponseEntity.ok(produitService.getRestockSuggestions(principal.getName()));
    }
}