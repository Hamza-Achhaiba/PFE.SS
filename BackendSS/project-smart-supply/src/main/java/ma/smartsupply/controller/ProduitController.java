package ma.smartsupply.controller;

import ma.smartsupply.dto.ProduitRequest;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.model.Stock;
import ma.smartsupply.service.ProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.security.Principal;
import java.util.List;
import java.util.Map;

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
            @PathVariable("id") Long id,
            @RequestParam("quantite") Integer quantite,
            Principal principal) {
        return ResponseEntity.ok(produitService.updateStock(id, quantite, principal.getName()));
    }

    @PutMapping("/{id}/ajouter-stock")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<Stock> ajouterStock(
            @PathVariable("id") Long id,
            @RequestParam("quantite") int quantite,
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
            @PathVariable("id") Long id,
            Principal principal) {
        produitService.toggleStatutProduit(id, principal.getName());
        return ResponseEntity.ok("Le statut du produit a été mis à jour avec succès.");
    }

    @GetMapping("/recherche")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<List<ProduitResponse>> rechercherProduits(
            @RequestParam(name = "motCle", required = false) String motCle,
            @RequestParam(name = "enStock", defaultValue = "false") boolean enStock) {
        List<ProduitResponse> resultats = produitService.rechercherProduits(motCle, enStock);
        return ResponseEntity.ok(resultats);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<ProduitResponse> modifierProduit(
            @PathVariable("id") Long id,
            @RequestBody ProduitRequest request,
            Principal principal) {
        ProduitResponse produitMaj = produitService.modifierProduit(id, request, principal.getName());
        return ResponseEntity.ok(produitMaj);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<Map<String, String>> supprimerProduit(
            @PathVariable("id") Long id,
            Principal principal) {
        produitService.supprimerProduit(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Produit supprimé avec succès."));
    }

    @GetMapping("/suggestions-reapprovisionnement")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<List<ProduitResponse>> getRestockSuggestions(Principal principal) {
        return ResponseEntity.ok(produitService.getRestockSuggestions(principal.getName()));
    }

    @PostMapping("/upload-image")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le fichier est vide."));
            }

            Path uploadPath = Paths.get("uploads/produits");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName != null && originalFileName.contains(".")
                    ? originalFileName.substring(originalFileName.lastIndexOf("."))
                    : ".jpg";
            String fileName = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/produits/")
                    .path(fileName)
                    .toUriString();

            return ResponseEntity.ok(Map.of("url", fileDownloadUri));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de l'upload de l'image"));
        }
    }
}