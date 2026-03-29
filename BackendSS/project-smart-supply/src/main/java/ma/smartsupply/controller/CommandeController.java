package ma.smartsupply.controller;

import ma.smartsupply.dto.CheckoutRequest;
import ma.smartsupply.dto.ClientEngagementDTO;
import ma.smartsupply.dto.CommandeRequest;
import ma.smartsupply.dto.CommandeResponse;
import ma.smartsupply.dto.RaiseDisputeRequest;
import ma.smartsupply.dto.SupplierDisputeResponseRequest;
import ma.smartsupply.dto.UpdateStatutRequest;
import ma.smartsupply.dto.UpdateTrackingRequest;
import ma.smartsupply.enums.StatutCommande;
import ma.smartsupply.model.Commande;
import ma.smartsupply.service.ActivityLogService;
import ma.smartsupply.service.CommandeService;
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
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;
    private final ActivityLogService activityLogService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Commande> passerCommande(@RequestBody CommandeRequest request) {
        Commande commande = commandeService.passerCommande(request);
        activityLogService.logByEmail(commande.getClient().getEmail(), "ORDER_PLACED", "ORDER",
                String.valueOf(commande.getId()), commande.getReference(),
                "Order placed, total: " + commande.getMontantTotal());
        return ResponseEntity.ok(commande);
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<CommandeResponse> validerCommande(
            @PathVariable("id") Long id,
            Principal principal) {
        CommandeResponse resp = commandeService.mettreAJourStatut(id, StatutCommande.VALIDEE.name(), principal.getName());
        activityLogService.logByEmail(principal.getName(), "ORDER_VALIDATED", "ORDER",
                String.valueOf(id), resp.getReference(), "Order validated by supplier");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> annulerCommande(
            @PathVariable("id") Long id,
            Principal principal) {
        try {
            CommandeResponse commandeAnnulee = commandeService.annulerCommande(id, principal.getName());
            activityLogService.logByEmail(principal.getName(), "ORDER_CANCELLED", "ORDER",
                    String.valueOf(id), commandeAnnulee.getReference(), "Order cancelled by client");
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
    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'ADMIN')")
    public ResponseEntity<CommandeResponse> changerStatut(
            @PathVariable("id") Long id,
            @RequestParam("statut") StatutCommande statut,
            Principal principal) {
        CommandeResponse commandeMaj = commandeService.mettreAJourStatut(id, statut.name(), principal.getName());
        activityLogService.logByEmail(principal.getName(), "ORDER_STATUS_CHANGED", "ORDER",
                String.valueOf(id), commandeMaj.getReference(), "Status changed to " + statut.name());
        return ResponseEntity.ok(commandeMaj);
    }

    @GetMapping("/mes-achats")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<CommandeResponse>> getMesAchats(
            @RequestParam(name = "statut", required = false) StatutCommande statut,
            Principal principal) {
        return ResponseEntity.ok(commandeService.getMesAchats(principal.getName(), statut));
    }

    @GetMapping("/mes-ventes")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<List<CommandeResponse>> getMesVentes(Principal principal) {
        return ResponseEntity.ok(commandeService.getMesVentes(principal.getName()));
    }

    @GetMapping("/mes-clients")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<List<ClientEngagementDTO>> getMesClients(Principal principal) {
        return ResponseEntity.ok(commandeService.getMesClientsEngages(principal.getName()));
    }

    @GetMapping("/mes-clients-uniques")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<List<ClientEngagementDTO>> getMesClientsUniques(Principal principal) {
        return ResponseEntity.ok(commandeService.getMesClientsUniques(principal.getName()));
    }

    @GetMapping("/mes-ventes/client/{clientId}")
    @PreAuthorize("hasRole('FOURNISSEUR')")
    public ResponseEntity<List<CommandeResponse>> getOrdersByClient(
            @PathVariable Long clientId,
            Principal principal) {
        return ResponseEntity.ok(commandeService.getOrdersByClientForSupplier(clientId, principal.getName()));
    }

    @PostMapping("/valider-panier")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<CommandeResponse> validerPanier(
            @RequestBody CheckoutRequest checkoutRequest,
            Principal principal) {
        CommandeResponse commande = commandeService.validerPanier(principal.getName(), checkoutRequest);
        activityLogService.logByEmail(principal.getName(), "ORDER_PLACED", "ORDER",
                String.valueOf(commande.getId()), commande.getReference(),
                "Checkout completed, total: " + commande.getMontantTotal());
        return ResponseEntity.ok(commande);
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'ADMIN')")
    public ResponseEntity<CommandeResponse> changerStatut(
            @PathVariable("id") Long id,
            @RequestBody UpdateStatutRequest request,
            Principal principal) {
        CommandeResponse commandeMaj = commandeService.mettreAJourStatut(id, request.getNouveauStatut(),
                principal.getName());
        activityLogService.logByEmail(principal.getName(), "ORDER_STATUS_CHANGED", "ORDER",
                String.valueOf(id), commandeMaj.getReference(), "Status changed to " + request.getNouveauStatut());
        return ResponseEntity.ok(commandeMaj);
    }

    @PatchMapping("/{id}/tracking")
    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'ADMIN')")
    public ResponseEntity<CommandeResponse> updateTracking(
            @PathVariable("id") Long id,
            @RequestBody UpdateTrackingRequest request,
            Principal principal) {
        CommandeResponse commandeMaj = commandeService.updateTracking(id, request, principal.getName());
        activityLogService.logByEmail(principal.getName(), "ORDER_TRACKING_UPDATED", "ORDER",
                String.valueOf(id), commandeMaj.getReference(),
                "Tracking updated: " + request.getTrackingReference());
        return ResponseEntity.ok(commandeMaj);
    }

    @PatchMapping("/{id}/escrow/dispute")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<CommandeResponse> markEscrowDisputed(
            @PathVariable("id") Long id,
            @RequestBody RaiseDisputeRequest request,
            Principal principal) {
        CommandeResponse resp = commandeService.marquerEscrowEnLitige(id, request, principal.getName());
        activityLogService.logByEmail(principal.getName(), "DISPUTE_RAISED", "ORDER",
                String.valueOf(id), resp.getReference(),
                "Dispute raised: " + (request != null ? request.getReason() : ""));
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/{id}/confirm-reception")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<CommandeResponse> confirmReception(
            @PathVariable("id") Long id,
            Principal principal) {
        CommandeResponse resp = commandeService.confirmReception(id, principal.getName());
        activityLogService.logByEmail(principal.getName(), "RECEIPT_CONFIRMED", "ORDER",
                String.valueOf(id), resp.getReference(), "Client confirmed receipt, escrow released");
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/{id}/refund-request")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<CommandeResponse> openRefundRequest(
            @PathVariable("id") Long id,
            Principal principal) {
        CommandeResponse resp = commandeService.ouvrirDemandeRemboursement(id, principal.getName());
        activityLogService.logByEmail(principal.getName(), "REFUND_REQUESTED", "ORDER",
                String.valueOf(id), resp.getReference(), "Refund request opened by client");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/facture")
    public ResponseEntity<?> telechargerFacture(@PathVariable("id") Long id) {
        return commandeService.telechargerFacture(id);
    }

    @PatchMapping("/{id}/dispute-response")
    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'ADMIN')")
    public ResponseEntity<CommandeResponse> submitDisputeResponse(
            @PathVariable("id") Long id,
            @RequestBody SupplierDisputeResponseRequest request,
            Principal principal) {
        CommandeResponse resp = commandeService.submitSupplierDisputeResponse(id, request, principal.getName());
        activityLogService.logByEmail(principal.getName(), "DISPUTE_RESPONSE", "ORDER",
                String.valueOf(id), resp.getReference(),
                "Supplier responded to dispute");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/upload-dispute-image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> uploadDisputeImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
            }
            Path uploadPath = Paths.get("uploads/disputes");
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
                    .path("/uploads/disputes/")
                    .path(fileName)
                    .toUriString();
            return ResponseEntity.ok(Map.of("url", fileDownloadUri));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload image"));
        }
    }
}
