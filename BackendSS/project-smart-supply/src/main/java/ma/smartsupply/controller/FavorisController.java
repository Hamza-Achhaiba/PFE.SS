package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.service.FavorisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/favoris")
@RequiredArgsConstructor
public class FavorisController {

    private final FavorisService favorisService;

    @PostMapping("/ajouter/{idFournisseur}")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<String> ajouterFavori(@PathVariable("idFournisseur") Long idFournisseur,
            Principal principal) {
        favorisService.ajouterFavori(principal.getName(), idFournisseur);
        return ResponseEntity.ok("Fournisseur ajouté à votre annuaire avec succès ! ⭐");
    }

    @DeleteMapping("/retirer/{idFournisseur}")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<String> retirerFavori(@PathVariable("idFournisseur") Long idFournisseur,
            Principal principal) {
        favorisService.retirerFavori(principal.getName(), idFournisseur);
        return ResponseEntity.ok("Fournisseur retiré de votre annuaire.");
    }

    @GetMapping("/mes-fournisseurs")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<List<Fournisseur>> getMesFavoris(Principal principal) {
        List<Fournisseur> favoris = favorisService.getMesFavoris(principal.getName());
        return ResponseEntity.ok(favoris);
    }
}