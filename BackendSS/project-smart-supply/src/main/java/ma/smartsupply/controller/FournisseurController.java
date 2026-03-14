package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.FournisseurResponse;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.repository.FournisseurRepository;
import ma.smartsupply.service.ProduitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
public class FournisseurController {

    private final FournisseurRepository fournisseurRepository;
    private final ProduitService produitService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR', 'ADMIN')")
    public ResponseEntity<FournisseurResponse> getFournisseurById(@PathVariable Long id) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        
        Double avgRating = 0.0;
        if (f.getReviews() != null && !f.getReviews().isEmpty()) {
            avgRating = f.getReviews().stream()
                    .mapToInt(r -> r.getRating())
                    .average()
                    .orElse(0.0);
        }

        return ResponseEntity.ok(FournisseurResponse.builder()
                .id(f.getId())
                .nom(f.getNom())
                .email(f.getEmail())
                .telephone(f.getTelephone())
                .adresse(f.getAdresse())
                .nomEntreprise(f.getNomEntreprise())
                .infoContact(f.getInfoContact())
                .image(f.getImage())
                .description(f.getDescription())
                .categorie(f.getCategorie())
                .status(f.getStatus())
                .yearEstablished(f.getYearEstablished())
                .onTimeDelivery(f.getOnTimeDelivery())
                .responseTime(f.getResponseTime())
                .qualityAcceptance(f.getQualityAcceptance())
                .averageRating(avgRating)
                .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Fournisseur> updateStatus(@PathVariable Long id, @RequestParam ma.smartsupply.enums.SupplierStatus status) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        f.setStatus(status);
        return ResponseEntity.ok(fournisseurRepository.save(f));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<Fournisseur> updateProfile(@RequestBody ma.smartsupply.dto.UpdateProfilRequest request, java.security.Principal principal) {
        Fournisseur f = (Fournisseur) fournisseurRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        
        f.setNom(request.getNom());
        f.setTelephone(request.getTelephone());
        f.setAdresse(request.getAdresse());
        f.setInfoContact(request.getInfoContact());
        f.setNomEntreprise(request.getNomEntreprise());
        f.setDescription(request.getDescription());
        f.setYearEstablished(request.getYearEstablished());
        f.setCategorie(request.getCategorie());
        
        return ResponseEntity.ok(fournisseurRepository.save(f));
    }

    @GetMapping("/{id}/produits")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<List<ProduitResponse>> getProduitsByFournisseur(@PathVariable Long id) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        
        return ResponseEntity.ok(produitService.getMesProduits(f.getEmail()));
    }
}
