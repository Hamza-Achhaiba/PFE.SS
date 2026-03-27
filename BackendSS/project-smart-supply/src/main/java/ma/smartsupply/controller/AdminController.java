package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.AdminChartDataDTO;
import ma.smartsupply.dto.AdminDashboardMetricsDTO;
import ma.smartsupply.dto.AdminFournisseurResponse;
import ma.smartsupply.dto.ProduitResponse;
import ma.smartsupply.enums.StatutProduit;
import ma.smartsupply.enums.SupplierStatus;
import ma.smartsupply.model.ActivityLog;
import ma.smartsupply.model.Commande;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.ClientRepository;
import ma.smartsupply.repository.CommandeRepository;
import ma.smartsupply.repository.ConversationRepository;
import ma.smartsupply.repository.FournisseurRepository;
import ma.smartsupply.repository.LigneCommandeRepository;
import ma.smartsupply.repository.LignePanierRepository;
import ma.smartsupply.repository.PanierRepository;
import ma.smartsupply.repository.ProduitRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import ma.smartsupply.service.ActivityLogService;
import ma.smartsupply.service.ProduitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import ma.smartsupply.dto.AdminClientResponse;
import ma.smartsupply.enums.ClientStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ClientRepository clientRepository;
    private final FournisseurRepository fournisseurRepository;
    private final CommandeRepository commandeRepository;
    private final ConversationRepository conversationRepository;
    private final ProduitRepository produitRepository;
    private final LignePanierRepository lignePanierRepository;
    private final PanierRepository panierRepository;
    private final LigneCommandeRepository ligneCommandeRepository;
    private final ProduitService produitService;
    private final ActivityLogService activityLogService;
    private final UtilisateurRepository utilisateurRepository;

    private Utilisateur getCurrentAdmin(Principal principal) {
        return utilisateurRepository.findByEmail(principal.getName()).orElse(null);
    }

    @GetMapping("/metrics")
    public ResponseEntity<AdminDashboardMetricsDTO> getDashboardMetrics() {
        long totalClients = clientRepository.count();
        long totalSuppliers = fournisseurRepository.count();
        long pendingSuppliers = fournisseurRepository.countByStatus(SupplierStatus.PENDING_APPROVAL);
        long totalOrders = commandeRepository.count();
        long openDisputes = commandeRepository.countByDisputeRaisedAtIsNotNull();
        long refundRequests = commandeRepository.countByRefundRequestStatusIsNotNull();

        AdminDashboardMetricsDTO metrics = AdminDashboardMetricsDTO.builder()
                .totalClients(totalClients)
                .totalSuppliers(totalSuppliers)
                .pendingSuppliers(pendingSuppliers)
                .totalOrders(totalOrders)
                .openDisputes(openDisputes)
                .refundRequests(refundRequests)
                .build();

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/chart-data")
    public ResponseEntity<AdminChartDataDTO> getChartData() {
        var allOrders = commandeRepository.findAll();
        var allProducts = produitRepository.findAll();

        // Orders over time — daily counts for last 30 days, zero-filled
        LocalDate today = LocalDate.now();
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        // Build scaffold: every day in [today-29 .. today] initialised to 0
        java.util.TreeMap<String, Long> ordersByDay = new java.util.TreeMap<>();
        for (int i = 29; i >= 0; i--) {
            ordersByDay.put(today.minusDays(i).format(dayFmt), 0L);
        }
        // Merge real counts (inclusive start of the window)
        LocalDateTime startOfWindow = today.minusDays(29).atStartOfDay();
        allOrders.stream()
                .filter(o -> o.getDateCreation() != null && !o.getDateCreation().isBefore(startOfWindow))
                .forEach(o -> ordersByDay.computeIfPresent(o.getDateCreation().format(dayFmt), (k, v) -> v + 1));

        List<AdminChartDataDTO.DailyOrderCount> ordersOverTime = ordersByDay.entrySet().stream()
                .map(e -> AdminChartDataDTO.DailyOrderCount.builder()
                        .day(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        // Orders by status
        Map<String, Long> ordersByStatus = allOrders.stream()
                .filter(o -> o.getStatut() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getStatut().name(),
                        LinkedHashMap::new,
                        Collectors.counting()));

        // Products by approval status
        Map<String, Long> productsByStatus = allProducts.stream()
                .filter(p -> p.getStatutApprobation() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getStatutApprobation().name(),
                        LinkedHashMap::new,
                        Collectors.counting()));

        AdminChartDataDTO chartData = AdminChartDataDTO.builder()
                .ordersOverTime(ordersOverTime)
                .ordersByStatus(ordersByStatus)
                .productsByStatus(productsByStatus)
                .build();

        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/fournisseurs")
    public ResponseEntity<List<AdminFournisseurResponse>> getAllFournisseurs() {
        List<AdminFournisseurResponse> responses = fournisseurRepository.findAll().stream().map(f -> {
            List<String> productCategories = f.getCatalogue().stream()
                    .filter(p -> p.getCategorie() != null)
                    .map(p -> p.getCategorie().getNom())
                    .distinct()
                    .collect(Collectors.toList());

            return AdminFournisseurResponse.builder()
                    .id(f.getId())
                    .nom(f.getNom())
                    .nomEntreprise(f.getNomEntreprise())
                    .email(f.getEmail())
                    .telephone(f.getTelephone())
                    .status(f.getStatus())
                    .categorie(f.getCategorie())
                    .productCategories(productCategories)
                    .adresse(f.getAdresse())
                    .ville(f.getVille())
                    .region(f.getRegion())
                    .description(f.getDescription())
                    .build();
        }).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/fournisseurs/{id}")
    @Transactional
    public ResponseEntity<Void> deleteSupplier(@PathVariable("id") Long id, Principal principal) {
        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                        "Supplier not found"));

        if (ligneCommandeRepository.existsByProduitFournisseurId(id)) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This supplier cannot be deleted because it is linked to existing orders.");
        }

        String supplierName = fournisseur.getNomEntreprise() != null ? fournisseur.getNomEntreprise() : fournisseur.getNom();
        clientRepository.deleteFavoriteLinksBySupplierId(id);
        conversationRepository.deleteByFournisseurId(id);
        lignePanierRepository.deleteByProduitFournisseurId(id);
        produitRepository.deleteAll(produitRepository.findByFournisseurId(id));
        fournisseurRepository.delete(fournisseur);

        Utilisateur admin = getCurrentAdmin(principal);
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                "DELETED_SUPPLIER", "SUPPLIER", String.valueOf(id), supplierName, "Supplier account deleted");

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients")
    public ResponseEntity<List<AdminClientResponse>> getAllClients() {
        List<AdminClientResponse> responses = clientRepository.findAll().stream().map(c -> AdminClientResponse.builder()
                .id(c.getId())
                .nom(c.getNom())
                .email(c.getEmail())
                .telephone(c.getTelephone())
                .nomMagasin(c.getNomMagasin())
                .status(c.getStatus() != null ? c.getStatus() : ma.smartsupply.enums.ClientStatus.ACTIVE)
                .adresse(c.getAdresse())
                .ville(c.getVille())
                .region(c.getRegion())
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/clients/{id}/status")
    public ResponseEntity<Void> updateClientStatus(@PathVariable("id") Long id,
            @RequestParam("status") ClientStatus status, Principal principal) {
        ma.smartsupply.model.Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                        "Client not found"));
        ClientStatus oldStatus = client.getStatus();
        client.setStatus(status);
        clientRepository.save(client);

        Utilisateur admin = getCurrentAdmin(principal);
        String action = switch (status) {
            case ACTIVE -> "APPROVED_CLIENT";
            case SUSPENDED -> "SUSPENDED_CLIENT";
            case REJECTED -> "REJECTED_CLIENT";
            default -> "UPDATED_CLIENT_STATUS";
        };
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                action, "CLIENT", String.valueOf(id), client.getNom(),
                "Status changed from " + oldStatus + " to " + status);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clients/{id}")
    @Transactional
    public ResponseEntity<Void> deleteClient(@PathVariable("id") Long id, Principal principal) {
        ma.smartsupply.model.Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                        "Client not found"));

        if (commandeRepository.existsByClientId(id)) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This client cannot be deleted because it has existing orders.");
        }

        String clientName = client.getNom();
        conversationRepository.deleteByClientId(id);
        panierRepository.deleteByClientId(id);
        clientRepository.delete(client);

        Utilisateur admin = getCurrentAdmin(principal);
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                "DELETED_CLIENT", "CLIENT", String.valueOf(id), clientName, "Client account deleted");

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/commandes")
    public ResponseEntity<List<Commande>> getAllCommandes() {
        // Exclude huge nested structures if necessary, but DTO or entity works.
        return ResponseEntity.ok(commandeRepository.findAll());
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<Commande>> getDisputesAndRefunds() {
        return ResponseEntity.ok(commandeRepository
                .findByRefundRequestStatusIsNotNullOrDisputeRaisedAtIsNotNullOrderByDateCreationDesc());
    }

    @PatchMapping("/commandes/{id}/resolve-dispute")
    public ResponseEntity<Commande> resolveDispute(@PathVariable("id") Long id, Principal principal) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        commande.setDisputeRaisedAt(null);
        commande.setDisputeReason("RESOLVED by Admin. "
                + (commande.getDisputeReason() != null ? "Past reason: " + commande.getDisputeReason() : ""));
        Commande saved = commandeRepository.save(commande);

        Utilisateur admin = getCurrentAdmin(principal);
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                "RESOLVED_DISPUTE", "ORDER", String.valueOf(id), commande.getReference(), "Dispute resolved for order");

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/commandes/{id}/refund-decision")
    public ResponseEntity<Commande> refundDecision(@PathVariable("id") Long id,
            @RequestParam("decision") ma.smartsupply.enums.RefundRequestStatus decision, Principal principal) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        commande.setRefundRequestStatus(decision);
        if (decision == ma.smartsupply.enums.RefundRequestStatus.RESOLVED) {
            commande.setRefundedAt(java.time.LocalDateTime.now());
            commande.setStatut(ma.smartsupply.enums.StatutCommande.ANNULEE);
        }
        Commande saved = commandeRepository.save(commande);

        Utilisateur admin = getCurrentAdmin(principal);
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                "REFUND_DECISION", "ORDER", String.valueOf(id), commande.getReference(),
                "Refund decision: " + decision);

        return ResponseEntity.ok(saved);
    }

    // ── Product Management ────────────────────────────────────────────

    @GetMapping("/produits")
    public ResponseEntity<List<ProduitResponse>> getAllProduitsAdmin() {
        return ResponseEntity.ok(produitService.getAllProduitsAdmin());
    }

    @PatchMapping("/produits/{id}/statut")
    public ResponseEntity<ProduitResponse> updateProduitStatut(
            @PathVariable("id") Long id,
            @RequestParam("statut") StatutProduit statut, Principal principal) {
        ProduitResponse response = produitService.updateStatutApprobation(id, statut);

        Utilisateur admin = getCurrentAdmin(principal);
        String action = switch (statut) {
            case APPROVED -> "APPROVED_PRODUCT";
            case REJECTED -> "REJECTED_PRODUCT";
            default -> "UPDATED_PRODUCT_STATUS";
        };
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                action, "PRODUCT", String.valueOf(id), response.getNom(),
                "Product status set to " + statut);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/produits/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteProduitAdmin(@PathVariable("id") Long id, Principal principal) {
        var produit = produitRepository.findById(id).orElse(null);
        String produitName = produit != null ? produit.getNom() : "Unknown";
        produitService.supprimerProduitParAdmin(id);

        Utilisateur admin = getCurrentAdmin(principal);
        activityLogService.log(admin != null ? admin.getId() : null, admin != null ? admin.getNom() : "Admin", "ADMIN",
                "DELETED_PRODUCT", "PRODUCT", String.valueOf(id), produitName, "Product deleted by admin");

        return ResponseEntity.ok(Map.of("message", "Product deleted successfully."));
    }

    // ── Activity Logs ────────────────────────────────────────────────

    @GetMapping("/activity-logs")
    public ResponseEntity<List<ActivityLog>> getActivityLogs() {
        return ResponseEntity.ok(activityLogService.getAllLogs());
    }
}
