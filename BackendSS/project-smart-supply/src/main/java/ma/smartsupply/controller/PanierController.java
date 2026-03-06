package ma.smartsupply.controller;

import ma.smartsupply.dto.AjoutPanierRequest;
import ma.smartsupply.dto.PanierResponse;
import ma.smartsupply.model.Panier;
import ma.smartsupply.service.PanierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/panier")
public class PanierController {

    @Autowired
    private PanierService panierService;

    @PostMapping("/ajouter")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<String> ajouterAuPanier(
            @RequestBody AjoutPanierRequest request,
            Principal principal
    ) {
        panierService.ajouterAuPanier(principal.getName(), request.getProduitId(), request.getQuantite());
        return ResponseEntity.ok("Produit ajouté au panier avec succès !");
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<PanierResponse> getMonPanier(Principal principal) {
        PanierResponse panier = panierService.getMonPanier(principal.getName());
        return ResponseEntity.ok(panier);
    }
}