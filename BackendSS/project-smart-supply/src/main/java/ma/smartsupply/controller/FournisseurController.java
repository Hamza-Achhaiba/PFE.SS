package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.FournisseurResponse;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.dto.SupplierPerformanceResponse;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.FournisseurRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import ma.smartsupply.service.ActivityLogService;
import ma.smartsupply.service.ProduitService;
import ma.smartsupply.service.SupplierPerformanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
public class FournisseurController {

    private final FournisseurRepository fournisseurRepository;
    private final ProduitService produitService;
    private final SupplierPerformanceService supplierPerformanceService;
    private final ActivityLogService activityLogService;
    private final UtilisateurRepository utilisateurRepository;

    @GetMapping("/me")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<FournisseurResponse> getMyProfile(java.security.Principal principal) {
        Fournisseur f = (Fournisseur) fournisseurRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        return ResponseEntity.ok(mapToResponse(f));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR', 'ADMIN')")
    public ResponseEntity<FournisseurResponse> getFournisseurById(@PathVariable("id") Long id) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        
        return ResponseEntity.ok(mapToResponse(f));
    }

    private FournisseurResponse mapToResponse(Fournisseur f) {
        SupplierPerformanceResponse performance = supplierPerformanceService.getPerformance(f);
        Double avgRating = performance.getQuality() == null
                ? 0.0
                : Math.round((performance.getQuality() / 20.0) * 10.0) / 10.0;

        return FournisseurResponse.builder()
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
                .averageRating(avgRating)
                .performance(performance)
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Fournisseur> updateStatus(@PathVariable("id") Long id, @RequestParam("status") ma.smartsupply.enums.SupplierStatus status, Principal principal) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        ma.smartsupply.enums.SupplierStatus oldStatus = f.getStatus();
        f.setStatus(status);
        Fournisseur saved = fournisseurRepository.save(f);

        Utilisateur admin = utilisateurRepository.findByEmail(principal.getName()).orElse(null);
        String action = switch (status) {
            case ACTIVE, VERIFIED -> "APPROVED_SUPPLIER";
            case SUSPENDED -> "SUSPENDED_SUPPLIER";
            case REJECTED -> "REJECTED_SUPPLIER";
            default -> "UPDATED_SUPPLIER_STATUS";
        };
        String supplierName = f.getNomEntreprise() != null ? f.getNomEntreprise() : f.getNom();
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                action, "SUPPLIER", String.valueOf(id), supplierName,
                "Status changed from " + oldStatus + " to " + status);

        return ResponseEntity.ok(saved);
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
        if (request.getImage() != null) {
            f.setImage(request.getImage());
        }

        Fournisseur saved = fournisseurRepository.save(f);
        activityLogService.logByEmail(principal.getName(), "SUPPLIER_PROFILE_UPDATED", "SUPPLIER",
                String.valueOf(f.getId()), f.getNomEntreprise(), "Supplier profile updated");
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/produits")
    @PreAuthorize("hasAnyRole('CLIENT', 'FOURNISSEUR')")
    public ResponseEntity<List<ProduitResponse>> getProduitsByFournisseur(@PathVariable("id") Long id) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
        
        return ResponseEntity.ok(produitService.getMesProduits(f.getEmail()));
    }
}
