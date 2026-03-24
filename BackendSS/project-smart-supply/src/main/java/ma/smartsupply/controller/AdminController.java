package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.AdminDashboardMetricsDTO;
import ma.smartsupply.dto.AdminFournisseurResponse;
import ma.smartsupply.enums.SupplierStatus;
import ma.smartsupply.model.Commande;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.repository.ClientRepository;
import ma.smartsupply.repository.CommandeRepository;
import ma.smartsupply.repository.ConversationRepository;
import ma.smartsupply.repository.FournisseurRepository;
import ma.smartsupply.repository.LigneCommandeRepository;
import ma.smartsupply.repository.LignePanierRepository;
import ma.smartsupply.repository.PanierRepository;
import ma.smartsupply.repository.ProduitRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import ma.smartsupply.dto.AdminClientResponse;
import ma.smartsupply.enums.ClientStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
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
    public ResponseEntity<Void> deleteSupplier(@PathVariable("id") Long id) {
        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Supplier not found"));

        if (ligneCommandeRepository.existsByProduitFournisseurId(id)) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This supplier cannot be deleted because it is linked to existing orders."
            );
        }

        clientRepository.deleteFavoriteLinksBySupplierId(id);
        conversationRepository.deleteByFournisseurId(id);
        lignePanierRepository.deleteByProduitFournisseurId(id);
        produitRepository.deleteAll(produitRepository.findByFournisseurId(id));
        fournisseurRepository.delete(fournisseur);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients")
    public ResponseEntity<List<AdminClientResponse>> getAllClients() {
        List<AdminClientResponse> responses = clientRepository.findAll().stream().map(c -> 
            AdminClientResponse.builder()
                .id(c.getId())
                .nom(c.getNom())
                .email(c.getEmail())
                .telephone(c.getTelephone())
                .nomMagasin(c.getNomMagasin())
                .status(c.getStatus() != null ? c.getStatus() : ma.smartsupply.enums.ClientStatus.ACTIVE)
                .adresse(c.getAdresse())
                .ville(c.getVille())
                .region(c.getRegion())
                .build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/clients/{id}/status")
    public ResponseEntity<Void> updateClientStatus(@PathVariable("id") Long id, @RequestParam("status") ClientStatus status) {
        ma.smartsupply.model.Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Client not found"));
        client.setStatus(status);
        clientRepository.save(client);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clients/{id}")
    @Transactional
    public ResponseEntity<Void> deleteClient(@PathVariable("id") Long id) {
        ma.smartsupply.model.Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Client not found"));
        
        // Before deleting a client, we should handle their orders or prevent deletion if they have active orders
        if (commandeRepository.existsByClientId(id)) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This client cannot be deleted because it has existing orders."
            );
        }

        conversationRepository.deleteByClientId(id);
        panierRepository.deleteByClientId(id);
        clientRepository.delete(client);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/commandes")
    public ResponseEntity<List<Commande>> getAllCommandes() {
        // Exclude huge nested structures if necessary, but DTO or entity works.
        return ResponseEntity.ok(commandeRepository.findAll());
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<Commande>> getDisputesAndRefunds() {
        return ResponseEntity.ok(commandeRepository.findByRefundRequestStatusIsNotNullOrDisputeRaisedAtIsNotNullOrderByDateCreationDesc());
    }

    @PatchMapping("/commandes/{id}/resolve-dispute")
    public ResponseEntity<Commande> resolveDispute(@PathVariable("id") Long id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        commande.setDisputeRaisedAt(null);
        commande.setDisputeReason("RESOLVED by Admin. " + (commande.getDisputeReason() != null ? "Past reason: " + commande.getDisputeReason() : ""));
        return ResponseEntity.ok(commandeRepository.save(commande));
    }

    @PatchMapping("/commandes/{id}/refund-decision")
    public ResponseEntity<Commande> refundDecision(@PathVariable("id") Long id, @RequestParam("decision") ma.smartsupply.enums.RefundRequestStatus decision) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        commande.setRefundRequestStatus(decision);
        if (decision == ma.smartsupply.enums.RefundRequestStatus.RESOLVED) {
            commande.setRefundedAt(java.time.LocalDateTime.now());
            commande.setStatut(ma.smartsupply.enums.StatutCommande.ANNULEE);
        }
        return ResponseEntity.ok(commandeRepository.save(commande));
    }
}
