package ma.smartsupply.controller;

import ma.smartsupply.dto.CommandeRequest;
import ma.smartsupply.dto.CommandeResponse;
import ma.smartsupply.dto.UpdateStatutRequest;
import ma.smartsupply.dto.UpdateTrackingRequest;
import ma.smartsupply.enums.StatutCommande;
import ma.smartsupply.model.Commande;
import ma.smartsupply.service.CommandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;

    @PostMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Commande> passerCommande(@RequestBody CommandeRequest request) {
        return ResponseEntity.ok(commandeService.passerCommande(request));
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<Commande> validerCommande(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(commandeService.validerCommande(id, principal.getName()));
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<?> annulerCommande(
            @PathVariable Long id,
            Principal principal) {
        try {
            CommandeResponse commandeAnnulee = commandeService.annulerCommande(id, principal.getName());
            return ResponseEntity.ok(commandeAnnulee);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Commande>> getMesCommandes(Principal principal) {
        return ResponseEntity.ok(commandeService.getMesCommandes(principal.getName()));
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<Commande> changerStatut(
            @PathVariable Long id,
            @RequestParam StatutCommande statut) {

        Commande commandeMaj = commandeService.changerStatutCommande(id, statut);
        return ResponseEntity.ok(commandeMaj);
    }

    @GetMapping("/mes-achats")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<List<CommandeResponse>> getMesAchats(
            @RequestParam(required = false) StatutCommande statut,
            Principal principal) {
        return ResponseEntity.ok(commandeService.getMesAchats(principal.getName(), statut));
    }

    @GetMapping("/mes-ventes")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<List<CommandeResponse>> getMesVentes(Principal principal) {
        return ResponseEntity.ok(commandeService.getMesVentes(principal.getName()));
    }

    @PostMapping("/valider-panier")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<CommandeResponse> validerPanier(Principal principal) {
        CommandeResponse commande = commandeService.validerPanier(principal.getName());
        return ResponseEntity.ok(commande);
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<CommandeResponse> changerStatut(
            @PathVariable Long id,
            @RequestBody UpdateStatutRequest request) {
        CommandeResponse commandeMaj = commandeService.mettreAJourStatut(id, request.getNouveauStatut());
        return ResponseEntity.ok(commandeMaj);
    }

    @PatchMapping("/{id}/tracking")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<CommandeResponse> updateTracking(
            @PathVariable Long id,
            @RequestBody UpdateTrackingRequest request,
            Principal principal) {
        CommandeResponse commandeMaj = commandeService.updateTracking(id, request, principal.getName());
        return ResponseEntity.ok(commandeMaj);
    }
}