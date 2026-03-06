package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.UpdateProfilRequest;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ProfilController {

    private final UtilisateurService utilisateurService;

    @GetMapping("/moi")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Utilisateur> getMonProfil(Principal principal) {
        return ResponseEntity.ok(utilisateurService.mettreAJourProfil(principal.getName(), new UpdateProfilRequest()));
    }

    @PutMapping("/update")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Utilisateur> mettreAJourProfil(
            @RequestBody UpdateProfilRequest request,
            Principal principal
    ) {
        Utilisateur profilMaj = utilisateurService.mettreAJourProfil(principal.getName(), request);
        return ResponseEntity.ok(profilMaj);
    }
}