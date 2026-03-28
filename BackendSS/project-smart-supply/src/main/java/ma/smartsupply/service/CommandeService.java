package ma.smartsupply.service;

import lombok.extern.slf4j.Slf4j;
import ma.smartsupply.dto.*;
import ma.smartsupply.dto.LigneCommandeInfoDTO;
import ma.smartsupply.dto.LigneCommandeRequest;
import ma.smartsupply.dto.ProduitInfoDTO;
import ma.smartsupply.enums.EscrowStatus;
import ma.smartsupply.enums.PaymentStatus;
import ma.smartsupply.enums.Role;
import ma.smartsupply.enums.RefundRequestStatus;
import ma.smartsupply.enums.StatutCommande;
import ma.smartsupply.enums.TypeNotification;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockRepository stockRepository;
    private final NotificationService notificationService;

    @Autowired
    private PanierRepository panierRepository;

    public List<Commande> getMesCommandes(String email) {
        return commandeRepository.findAll();
    }

    @Transactional
    public Commande passerCommande(CommandeRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!(utilisateur instanceof Client)) {
            throw new RuntimeException("Seuls les clients peuvent passer des commandes.");
        }
        Client client = (Client) utilisateur;

        Commande commande = new Commande();
        commande.setReference("CMD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        commande.setClient(client);
        commande.setDateCreation(LocalDateTime.now());
        commande.setStatut(StatutCommande.EN_ATTENTE_VALIDATION);
        commande.setLignes(new ArrayList<>());

        double montantTotal = 0;

        List<Runnable> notificationTasks = new ArrayList<>();
        for (LigneCommandeRequest lcr : request.getLignes()) {
            Produit produit = produitRepository.findById(lcr.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit introuvable : " + lcr.getProduitId()));

            Stock stock = stockRepository.findByProduitId(produit.getId())
                    .orElseThrow(
                            () -> new RuntimeException("Le stock n'existe pas pour le produit : " + produit.getNom()));

            int stockDispo = (stock.getQuantiteDisponible() != null) ? stock.getQuantiteDisponible() : 0;

            if (stockDispo < lcr.getQuantite()) {
                throw new RuntimeException("Stock insuffisant for : " + produit.getNom() +
                        " (Dispo: " + stockDispo + ", Demandé: " + lcr.getQuantite() + ")");
            }

            stock.setQuantiteDisponible(stockDispo - lcr.getQuantite());
            stockRepository.save(stock);

            // Store supplier notification task to be run after save
            final Produit fProduct = produit;
            final int fQty = lcr.getQuantite();
            notificationTasks.add(() -> notificationService.creer(
                    fProduct.getFournisseur(),
                    "Nouvelle commande " + commande.getReference() + " pour votre produit : " + fProduct.getNom() + " (Quantité: " + fQty + ")",
                    TypeNotification.NOUVELLE_COMMANDE,
                    commande.getId(),
                    commande.getReference()));

            LigneCommande ligne = new LigneCommande();
            ligne.setCommande(commande);
            ligne.setProduit(produit);
            ligne.setQuantite(lcr.getQuantite());

            double sousTotal = produit.getPrix() * lcr.getQuantite();
            ligne.setSousTotal(sousTotal);

            commande.getLignes().add(ligne);
            montantTotal += sousTotal;
        }

        LocalDateTime now = LocalDateTime.now();
        commande.setMontantTotal(montantTotal);
        commande.setAmount(montantTotal);
        commande.setPlatformFee(0.0);
        commande.setSupplierNetAmount(montantTotal);
        commande.setPaymentMethod("INTERNAL_PLATFORM");
        commande.setMethodePaiement("INTERNAL_PLATFORM");
        commande.setRefundRequestStatus(RefundRequestStatus.NONE);
        applyEscrowHold(commande, now);

        Commande savedCommande = commandeRepository.save(commande);
        
        // Now run notification tasks with saved ID
        notificationTasks.forEach(Runnable::run);
        
        // Also notify client
        notificationService.creer(
            savedCommande.getClient(),
            "Your order #" + savedCommande.getId() + " has been placed successfully. Ref: " + savedCommande.getReference(),
            TypeNotification.NOUVELLE_COMMANDE,
            savedCommande.getId(),
            savedCommande.getReference()
        );

        return savedCommande;
    }

    @Transactional
    public Commande validerCommande(Long commandeId, String emailFournisseur) {

        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (commande.getStatut() != StatutCommande.EN_ATTENTE_VALIDATION) {
            throw new RuntimeException("Cette commande ne peut plus être validée");
        }

        for (LigneCommande ligne : commande.getLignes()) {
            Stock stock = stockRepository.findByProduitId(ligne.getProduit().getId())
                    .orElseThrow(() -> new RuntimeException("Stock introuvable"));

            if (stock.estEnAlerte()) {

                System.out.println("️ ALERTE STOCK : " + ligne.getProduit().getNom());
            }
        }
        commande.setStatut(StatutCommande.VALIDEE);
        Commande commandeMaj = commandeRepository.save(commande);

        notificationService.creer(
                commande.getClient(),
                "Your order #" + commande.getId() + " has been validated. Ref: " + commande.getReference(),
                TypeNotification.VALIDATION_COMMANDE,
                commande.getId(),
                commande.getReference());
        return commandeMaj;
    }

    @Transactional
    public CommandeResponse annulerCommande(Long commandeId, String emailClient) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (!commande.getClient().getEmail().equals(emailClient)) {
            throw new RuntimeException("Accès refusé : Vous n'êtes pas autorisé à annuler cette commande.");
        }

        if (commande.getStatut() != StatutCommande.EN_ATTENTE_VALIDATION) {
            throw new RuntimeException(
                    "Impossible d'annuler : La commande est déjà en cours de traitement ou expédiée.");
        }

        LocalDateTime maintenant = LocalDateTime.now();

        LocalDateTime dateCommande = commande.getDateCreation();

        long heuresEcoulees = ChronoUnit.HOURS.between(dateCommande, maintenant);
        if (heuresEcoulees > 24) {
            throw new RuntimeException("Le délai de 24h pour annuler la commande est dépassé.");
        }

        commande.setStatut(StatutCommande.ANNULEE);
        applyRefundIfNeeded(commande, LocalDateTime.now());

        for (LigneCommande ligne : commande.getLignes()) {
            Stock stock = stockRepository.findByProduitId(ligne.getProduit().getId())
                    .orElseThrow(() -> new RuntimeException("Stock introuvable"));
            stock.setQuantiteDisponible(stock.getQuantiteDisponible() + ligne.getQuantite());
            stockRepository.save(stock);
        }

        commandeRepository.save(commande);
        return mapToDTO(commande);
    }

    @Transactional
    public Commande changerStatutCommande(Long commandeId, StatutCommande nouveauStatut, String emailFournisseur) {

        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable avec l'ID : " + commandeId));

        // Supplier must check if they have products in this order
        boolean hasSupplierProducts = commande.getLignes().stream()
                .anyMatch(l -> l.getProduit().getFournisseur().getEmail().equals(emailFournisseur));

        if (!hasSupplierProducts) {
            throw new RuntimeException("Accès refusé. Cette commande ne contient pas de produits de ce fournisseur.");
        }

        if (nouveauStatut == StatutCommande.ANNULEE && commande.getStatut() != StatutCommande.ANNULEE) {
            for (LigneCommande ligne : commande.getLignes()) {
                Stock stock = stockRepository.findByProduitId(ligne.getProduit().getId())
                        .orElseThrow(() -> new RuntimeException("Stock introuvable"));

                stock.setQuantiteDisponible(stock.getQuantiteDisponible() + ligne.getQuantite());
                stockRepository.save(stock);
            }
        }

        commande.setStatut(nouveauStatut);
        Commande commandeMiseAJour = commandeRepository.save(commande);

        String message = "Order Update: Your order #" + commande.getId() + " is now "
                + nouveauStatut.name() + ". Ref: " + commande.getReference();
        notificationService.creer(commande.getClient(), message, TypeNotification.VALIDATION_COMMANDE, commande.getId(), commande.getReference());
        return commandeMiseAJour;
    }

    @Transactional(readOnly = true)
    public List<CommandeResponse> getMesAchats(String emailClient, StatutCommande statut) {
        List<Commande> commandes;

        if (statut == null) {
            commandes = commandeRepository.findByClientEmailOrderByDateCreationDesc(emailClient);
        } else {
            commandes = commandeRepository.findByClientEmailAndStatutOrderByDateCreationDesc(emailClient, statut);
        }

        return commandes.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommandeResponse> getMesVentes(String emailFournisseur) {
        return commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(emailFournisseur)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientEngagementDTO> getMesClientsEngages(String emailFournisseur) {
        List<Commande> orders = commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(emailFournisseur);

        Map<Long, ClientEngagementDTO> clientMap = new LinkedHashMap<>();
        for (Commande order : orders) {
            Client client = order.getClient();
            clientMap.computeIfAbsent(client.getId(), id -> {
                ClientEngagementDTO dto = new ClientEngagementDTO();
                dto.setId(client.getId());
                dto.setNom(client.getNom());
                dto.setEmail(client.getEmail());
                dto.setTelephone(client.getTelephone());
                dto.setNomMagasin(client.getNomMagasin());
                dto.setAdresse(client.getAdresse());
                dto.setOrderCount(0);
                dto.setTotalSpent(0.0);
                return dto;
            });
            ClientEngagementDTO dto = clientMap.get(client.getId());
            dto.setOrderCount(dto.getOrderCount() + 1);
            double amount = order.getMontantTotal() != null ? order.getMontantTotal() : 0.0;
            dto.setTotalSpent(dto.getTotalSpent() + amount);
            if (dto.getLastOrderDate() == null || order.getDateCreation().isAfter(dto.getLastOrderDate())) {
                dto.setLastOrderDate(order.getDateCreation());
            }
        }
        return new ArrayList<>(clientMap.values());
    }

    @Transactional(readOnly = true)
    public List<CommandeResponse> getOrdersByClientForSupplier(Long clientId, String supplierEmail) {
        return commandeRepository
                .findDistinctByClientIdAndLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(clientId, supplierEmail)
                .stream()
                .map(c -> mapToDTOFilteredBySupplier(c, supplierEmail))
                .collect(Collectors.toList());
    }

    private CommandeResponse mapToDTOFilteredBySupplier(Commande commande, String supplierEmail) {
        CommandeResponse dto = new CommandeResponse();
        dto.setId(commande.getId());
        dto.setReference(commande.getReference());
        dto.setDateCreation(commande.getDateCreation());
        dto.setStatut(commande.getStatut().name());
        dto.setPaymentStatus(commande.getPaymentStatus() != null ? commande.getPaymentStatus().name() : null);

        UtilisateurInfoDTO clientDto = new UtilisateurInfoDTO();
        clientDto.setId(commande.getClient().getId());
        clientDto.setNom(commande.getClient().getNom());
        clientDto.setEmail(commande.getClient().getEmail());
        clientDto.setTelephone(commande.getClient().getTelephone());
        dto.setClient(clientDto);

        List<LigneCommandeInfoDTO> lignesDto = commande.getLignes().stream()
                .filter(l -> l.getProduit().getFournisseur().getEmail().equals(supplierEmail))
                .map(ligne -> {
                    LigneCommandeInfoDTO lDto = new LigneCommandeInfoDTO();
                    lDto.setId(ligne.getId());
                    lDto.setQuantite(ligne.getQuantite());
                    lDto.setSousTotal(ligne.getSousTotal() != null ? ligne.getSousTotal() : 0.0);
                    ProduitInfoDTO pDto = new ProduitInfoDTO();
                    pDto.setId(ligne.getProduit().getId());
                    pDto.setNom(ligne.getProduit().getNom());
                    pDto.setPrix(ligne.getProduit().getPrix());
                    lDto.setProduit(pDto);
                    return lDto;
                })
                .collect(Collectors.toList());
        dto.setLignes(lignesDto);

        double total = lignesDto.stream().mapToDouble(LigneCommandeInfoDTO::getSousTotal).sum();
        dto.setMontantTotal(total);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<ClientEngagementDTO> getMesClientsUniques(String emailFournisseur) {
        return getMesClientsEngages(emailFournisseur).stream()
                .filter(c -> c.getOrderCount() >= 10)
                .collect(Collectors.toList());
    }

    private CommandeResponse mapToDTO(Commande commande) {
        CommandeResponse dto = new CommandeResponse();
        dto.setId(commande.getId());
        dto.setReference(commande.getReference());
        dto.setDateCreation(commande.getDateCreation());
        dto.setMontantTotal(commande.getMontantTotal());
        dto.setStatut(commande.getStatut().name());
        dto.setTrackingReference(commande.getTrackingReference());
        dto.setDateLivraisonEstimee(commande.getDateLivraisonEstimee());

        UtilisateurInfoDTO clientDto = new UtilisateurInfoDTO();
        clientDto.setId(commande.getClient().getId());
        clientDto.setNom(commande.getClient().getNom());
        clientDto.setEmail(commande.getClient().getEmail());
        clientDto.setTelephone(commande.getClient().getTelephone());
        dto.setClient(clientDto);

        List<LigneCommandeInfoDTO> lignesDto = commande.getLignes().stream().map(ligne -> {
            LigneCommandeInfoDTO lDto = new LigneCommandeInfoDTO();
            lDto.setId(ligne.getId());
            lDto.setQuantite(ligne.getQuantite());
            lDto.setSousTotal(ligne.getSousTotal());

            ProduitInfoDTO pDto = new ProduitInfoDTO();
            pDto.setId(ligne.getProduit().getId());
            pDto.setNom(ligne.getProduit().getNom());
            pDto.setPrix(ligne.getProduit().getPrix());
            lDto.setProduit(pDto);

            return lDto;
        }).collect(Collectors.toList());

        dto.setLignes(lignesDto);

        // Checkout Details
        dto.setNomComplet(commande.getNomComplet());
        dto.setTelephone(commande.getTelephone());
        dto.setAdresse(commande.getAdresse());
        dto.setVille(commande.getVille());
        dto.setRegion(commande.getRegion());
        dto.setCodePostal(commande.getCodePostal());
        dto.setMethodePaiement(commande.getMethodePaiement());
        dto.setPaymentMethod(commande.getPaymentMethod() != null ? commande.getPaymentMethod() : commande.getMethodePaiement());
        dto.setPaymentStatus(commande.getPaymentStatus() != null ? commande.getPaymentStatus().name() : null);
        dto.setEscrowStatus(commande.getEscrowStatus() != null ? commande.getEscrowStatus().name() : null);
        dto.setEscrowHeldAt(commande.getEscrowHeldAt());
        dto.setEscrowReleasedAt(commande.getEscrowReleasedAt());
        dto.setRefundedAt(commande.getRefundedAt());
        dto.setRefundRequestStatus(commande.getRefundRequestStatus() != null ? commande.getRefundRequestStatus().name() : RefundRequestStatus.NONE.name());
        dto.setRefundRequestedAt(commande.getRefundRequestedAt());
        dto.setRefundRequestMessage(commande.getRefundRequestMessage());
        dto.setDisputeCategory(commande.getDisputeCategory());
        dto.setDisputeReason(commande.getDisputeReason());
        dto.setDisputeRaisedAt(commande.getDisputeRaisedAt());
        dto.setAmount(commande.getAmount());
        dto.setPlatformFee(commande.getPlatformFee());
        dto.setSupplierNetAmount(commande.getSupplierNetAmount());
        dto.setFacturePath(commande.getFacturePath());
        dto.setInvoicePath(commande.getInvoicePath() != null ? commande.getInvoicePath() : commande.getFacturePath());

        List<Fournisseur> suppliers = commande.getLignes().stream()
                .map(ligne -> ligne.getProduit() != null ? ligne.getProduit().getFournisseur() : null)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(Fournisseur::getId))
                .collect(Collectors.toList());
        if (!suppliers.isEmpty()) {
            Fournisseur supportSupplier = suppliers.get(0);
            dto.setSupportSupplierId(supportSupplier.getId());
            dto.setSupportSupplierName(supportSupplier.getNom());
            dto.setSupportSupplierCompany(supportSupplier.getNomEntreprise());
            dto.setSupportSupplierImage(supportSupplier.getImage());
            dto.setMultipleSuppliersInOrder(suppliers.size() > 1);
        }

        return dto;
    }

    @Autowired
    private FactureService factureService;

    @Transactional
    public CommandeResponse validerPanier(String emailClient, CheckoutRequest checkoutRequest) {

        Panier panier = panierRepository.findByClientEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Panier introuvable"));

        if (panier.getLignes().isEmpty()) {
            throw new RuntimeException("Impossible de valider un panier vide !");
        }

        Commande commande = new Commande();
        commande.setReference("CMD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        commande.setClient((Client) panier.getClient());
        commande.setDateCreation(LocalDateTime.now());
        commande.setMontantTotal(panier.getMontantTotal());
        commande.setAmount(panier.getMontantTotal());
        commande.setPlatformFee(0.0);
        commande.setSupplierNetAmount(panier.getMontantTotal());
        
        // Checkout info
        commande.setNomComplet(checkoutRequest.getNomComplet());
        commande.setTelephone(checkoutRequest.getTelephone());
        commande.setAdresse(checkoutRequest.getAdresse());
        commande.setVille(checkoutRequest.getVille());
        commande.setRegion(checkoutRequest.getRegion());
        commande.setCodePostal(checkoutRequest.getCodePostal());
        commande.setMethodePaiement(checkoutRequest.getMethodePaiement());
        commande.setPaymentMethod(checkoutRequest.getMethodePaiement());

        // Initial status
        commande.setStatut(StatutCommande.EN_ATTENTE_VALIDATION);
        commande.setRefundRequestStatus(RefundRequestStatus.NONE);
        applyEscrowHold(commande, LocalDateTime.now());

        List<LigneCommande> lignesCommande = new ArrayList<>();

        List<Runnable> notificationTasks = new ArrayList<>();
        for (LignePanier lignePanier : panier.getLignes()) {
            Produit produit = lignePanier.getProduit();

            Stock stock = stockRepository.findByProduitId(produit.getId())
                    .orElseThrow(() -> new RuntimeException("Stock introuvable pour le produit : " + produit.getNom()));

            if (stock.getQuantiteDisponible() < lignePanier.getQuantite()) {
                throw new RuntimeException("Stock insuffisant pour : " + produit.getNom() + 
                    " (Dispo: " + stock.getQuantiteDisponible() + ")");
            }

            stock.setQuantiteDisponible(stock.getQuantiteDisponible() - lignePanier.getQuantite());
            stockRepository.save(stock);

            final Produit fProduct = produit;
            final int fQty = lignePanier.getQuantite();
            notificationTasks.add(() -> notificationService.creer(
                    fProduct.getFournisseur(),
                    "Nouvelle commande " + commande.getReference() + " pour votre produit : " + fProduct.getNom() + " (Quantité: "
                            + fQty + ")",
                    TypeNotification.NOUVELLE_COMMANDE,
                    commande.getId(),
                    commande.getReference()));

            LigneCommande lc = new LigneCommande();
            lc.setCommande(commande);
            lc.setProduit(produit);
            lc.setQuantite(lignePanier.getQuantite());
            lc.setSousTotal(lignePanier.getSousTotal());
            lignesCommande.add(lc);
        }
        commande.setLignes(lignesCommande);
        
        // Save first to get ID/Reference for invoice and notifications
        Commande savedCommande = commandeRepository.save(commande);

        // Run notification tasks
        notificationTasks.forEach(Runnable::run);

        // Notify client
        notificationService.creer(
            savedCommande.getClient(),
            "Your order #" + savedCommande.getId() + " has been placed successfully. Ref: " + savedCommande.getReference(),
            TypeNotification.NOUVELLE_COMMANDE,
            savedCommande.getId(),
            savedCommande.getReference()
        );

        // Generate PDF
        try {
            String facturePath = factureService.genererFacturePDF(savedCommande);
            savedCommande.setFacturePath(facturePath);
            savedCommande.setInvoicePath(facturePath);
            savedCommande = commandeRepository.save(savedCommande);
        } catch (IOException e) {
            log.error("Failed to generate invoice PDF", e);
            // We continue anyway, the order is created
        }

        panier.getLignes().clear();
        panier.setMontantTotal(0.0);
        panierRepository.save(panier);
        return mapToDTO(savedCommande);
    }

    @Transactional
    public CommandeResponse mettreAJourStatut(Long commandeId, String nouveauStatut, String emailFournisseur) {
        StatutCommande statut = StatutCommande.valueOf(nouveauStatut.toUpperCase());
        Commande commandeMiseAJour = applyManagedStatusUpdate(commandeId, statut, emailFournisseur);
        return mapToDTO(commandeMiseAJour);
    }

    @Transactional
    public CommandeResponse updateTracking(Long commandeId, UpdateTrackingRequest request, String emailFournisseur) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        // Supplier must check if they have products in this order
        boolean hasSupplierProducts = commande.getLignes().stream()
                .anyMatch(l -> l.getProduit().getFournisseur().getEmail().equals(emailFournisseur));

        if (!hasSupplierProducts) {
            throw new RuntimeException("Accès refusé. Cette commande ne contient pas de produits de ce fournisseur.");
        }

        commande.setTrackingReference(request.getTrackingReference());
        commande.setDateLivraisonEstimee(request.getDateLivraisonEstimee());

        Commande savedCommande = commandeRepository.save(commande);

        notificationService.creer(
                commande.getClient(),
                "Shipping Update: Your order " + commande.getReference() + " has a new tracking reference: "
                        + request.getTrackingReference(),
                TypeNotification.VALIDATION_COMMANDE,
                commande.getId(),
                commande.getReference());

        return mapToDTO(savedCommande);
    }

    @Transactional
    public CommandeResponse marquerEscrowEnLitige(Long commandeId, RaiseDisputeRequest request, String emailUtilisateur) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        boolean isClientOwner = commande.getClient() != null && commande.getClient().getEmail().equals(emailUtilisateur);
        if (!isClientOwner && !isAdmin(emailUtilisateur)) {
            throw new RuntimeException("AccÃ¨s refusÃ© : seul le client concernÃ© ou un admin peut signaler un litige.");
        }

        if (commande.getEscrowStatus() == EscrowStatus.RELEASED || commande.getEscrowStatus() == EscrowStatus.REFUNDED) {
            throw new RuntimeException("Impossible d'ouvrir un litige aprÃ¨s libÃ©ration ou remboursement des fonds.");
        }

        if (commande.getRefundRequestStatus() == null || commande.getRefundRequestStatus() == RefundRequestStatus.NONE) {
            throw new RuntimeException("Veuillez d'abord demander un remboursement via le support avant d'ouvrir un litige.");
        }

        String disputeReason = request != null && request.getReason() != null ? request.getReason().trim() : "";
        if (disputeReason.isEmpty()) {
            throw new RuntimeException("La raison du litige est obligatoire.");
        }

        commande.setEscrowStatus(EscrowStatus.DISPUTED);
        commande.setPaymentStatus(PaymentStatus.DISPUTED);
        commande.setDisputeCategory(request != null && request.getCategory() != null && !request.getCategory().trim().isEmpty()
                ? request.getCategory().trim()
                : null);
        commande.setDisputeReason(disputeReason);
        commande.setDisputeRaisedAt(LocalDateTime.now());

        return mapToDTO(commandeRepository.save(commande));
    }

    @Transactional
    public CommandeResponse ouvrirDemandeRemboursement(Long commandeId, String emailClient) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (commande.getClient() == null || !commande.getClient().getEmail().equals(emailClient)) {
            throw new RuntimeException("AccÃ¨s refusÃ© : vous ne pouvez pas demander un remboursement pour cette commande.");
        }

        if (commande.getEscrowStatus() == EscrowStatus.RELEASED || commande.getEscrowStatus() == EscrowStatus.REFUNDED) {
            throw new RuntimeException("Cette commande n'est plus Ã©ligible Ã  une demande de remboursement.");
        }

        if (commande.getRefundRequestStatus() == null || commande.getRefundRequestStatus() == RefundRequestStatus.NONE) {
            commande.setRefundRequestStatus(RefundRequestStatus.OPEN);
            commande.setRefundRequestedAt(LocalDateTime.now());
        }

        if (commande.getRefundRequestMessage() == null || commande.getRefundRequestMessage().isBlank()) {
            commande.setRefundRequestMessage(buildRefundDraft(commande));
        }

        return mapToDTO(commandeRepository.save(commande));
    }

    public ResponseEntity<Resource> telechargerFacture(Long id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (commande.getFacturePath() == null) {
            throw new RuntimeException("La facture n'est pas encore prête");
        }

        try {
            // Remove the leading "/" if it exists in the stored path
            String facturePathStr = commande.getFacturePath();
            if (facturePathStr.startsWith("/")) {
                facturePathStr = facturePathStr.substring(1);
            }
            Path filePath = Paths.get(facturePathStr).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Le fichier n'existe pas sur le serveur : " + filePath.toAbsolutePath());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Erreur lors de la récupération du fichier", e);
        }
    }

    private Commande applyManagedStatusUpdate(Long commandeId, StatutCommande nouveauStatut, String emailFournisseur) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable avec l'ID : " + commandeId));

        if (!canManageOrder(commande, emailFournisseur)) {
            throw new RuntimeException("AccÃ¨s refusÃ©. Cette commande ne contient pas de produits de ce fournisseur.");
        }

        validateStatusTransition(commande.getStatut(), nouveauStatut);

        if (nouveauStatut == StatutCommande.ANNULEE && commande.getStatut() != StatutCommande.ANNULEE) {
            for (LigneCommande ligne : commande.getLignes()) {
                Stock stock = stockRepository.findByProduitId(ligne.getProduit().getId())
                        .orElseThrow(() -> new RuntimeException("Stock introuvable"));

                stock.setQuantiteDisponible(stock.getQuantiteDisponible() + ligne.getQuantite());
                stockRepository.save(stock);
            }
            applyRefundIfNeeded(commande, LocalDateTime.now());
        }

        commande.setStatut(nouveauStatut);
        if (nouveauStatut == StatutCommande.LIVREE) {
            applyEscrowReleaseIfEligible(commande, LocalDateTime.now());
        }

        Commande commandeMiseAJour = commandeRepository.save(commande);
        String message = "Order Update: Your order #" + commande.getId() + " is now " + nouveauStatut.name() + ". Ref: " + commande.getReference();
        notificationService.creer(commande.getClient(), message, TypeNotification.VALIDATION_COMMANDE, commande.getId(), commande.getReference());
        return commandeMiseAJour;
    }

    private void validateStatusTransition(StatutCommande statutActuel, StatutCommande nouveauStatut) {
        if (statutActuel == nouveauStatut) {
            return;
        }

        // Definissons l'ordre logique
        // 1. EN_ATTENTE_VALIDATION
        // 2. VALIDEE
        // 3. EN_PREPARATION
        // 4. EXPEDIEE
        // 5. LIVREE
        // Special: ANNULEE (peut arriver depuis n'importe quel statut sauf LIVREE)

        if (statutActuel == StatutCommande.LIVREE || statutActuel == StatutCommande.ANNULEE) {
            throw new RuntimeException("Impossible de modifier une commande déjà livrée ou annulée.");
        }

        if (nouveauStatut == StatutCommande.ANNULEE) {
            return; // Annulation toujours possible
        }

        boolean isValid = switch (statutActuel) {
            case EN_ATTENTE_VALIDATION -> 
                nouveauStatut == StatutCommande.VALIDEE || 
                nouveauStatut == StatutCommande.EN_PREPARATION || 
                nouveauStatut == StatutCommande.EXPEDIEE || 
                nouveauStatut == StatutCommande.LIVREE;
            case VALIDEE -> 
                nouveauStatut == StatutCommande.EN_PREPARATION || 
                nouveauStatut == StatutCommande.EXPEDIEE || 
                nouveauStatut == StatutCommande.LIVREE;
            case EN_PREPARATION -> 
                nouveauStatut == StatutCommande.EXPEDIEE || 
                nouveauStatut == StatutCommande.LIVREE;
            case EXPEDIEE -> 
                nouveauStatut == StatutCommande.LIVREE;
            default -> false;
        };

        if (!isValid) {
            throw new RuntimeException("Transition de statut invalide : " + statutActuel + " -> " + nouveauStatut);
        }
    }

    private boolean canManageOrder(Commande commande, String emailUtilisateur) {
        if (isAdmin(emailUtilisateur)) {
            return true;
        }

        return commande.getLignes().stream()
                .anyMatch(l -> l.getProduit().getFournisseur().getEmail().equals(emailUtilisateur));
    }

    private boolean isAdmin(String emailUtilisateur) {
        return utilisateurRepository.findByEmail(emailUtilisateur)
                .map(Utilisateur::getRole)
                .filter(role -> role == Role.ADMIN)
                .isPresent();
    }

    private void applyEscrowHold(Commande commande, LocalDateTime now) {
        commande.setEscrowStatus(EscrowStatus.HELD_IN_ESCROW);
        commande.setPaymentStatus(PaymentStatus.HELD_IN_ESCROW);
        commande.setEscrowHeldAt(now);
        commande.setEscrowReleasedAt(null);
        commande.setRefundedAt(null);
    }

    private void applyEscrowReleaseIfEligible(Commande commande, LocalDateTime now) {
        if (commande.getEscrowStatus() != EscrowStatus.HELD_IN_ESCROW) {
            return;
        }

        commande.setEscrowStatus(EscrowStatus.RELEASED);
        commande.setPaymentStatus(PaymentStatus.RELEASED);
        commande.setEscrowReleasedAt(now);
    }

    private void applyRefundIfNeeded(Commande commande, LocalDateTime now) {
        if (commande.getEscrowStatus() == EscrowStatus.RELEASED) {
            return;
        }

        commande.setEscrowStatus(EscrowStatus.REFUNDED);
        commande.setPaymentStatus(PaymentStatus.REFUNDED);
        commande.setRefundedAt(now);
        commande.setEscrowReleasedAt(null);
        commande.setRefundRequestStatus(RefundRequestStatus.RESOLVED);
    }

    private String buildRefundDraft(Commande commande) {
        String orderReference = commande.getReference() != null ? commande.getReference() : "#" + commande.getId();
        List<Fournisseur> suppliers = commande.getLignes().stream()
                .map(ligne -> ligne.getProduit() != null ? ligne.getProduit().getFournisseur() : null)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(Fournisseur::getId))
                .collect(Collectors.toList());
        String supplierLabel = suppliers.isEmpty()
                ? "Unknown supplier"
                : suppliers.get(0).getNomEntreprise();
        String paymentLabel = commande.getPaymentStatus() != null
                ? commande.getPaymentStatus().name()
                : (commande.getEscrowStatus() != null ? commande.getEscrowStatus().name() : "UNKNOWN");

        StringBuilder draft = new StringBuilder();
        draft.append("Hello Support, I want to request a refund for order ")
                .append(orderReference)
                .append(" because there is an issue with this order.\n\n")
                .append("Order number: ").append(orderReference).append("\n")
                .append("Supplier: ").append(supplierLabel).append("\n")
                .append("Payment/Escrow status: ").append(paymentLabel).append("\n");
        if (suppliers.size() > 1) {
            draft.append("Note: this order contains items from multiple suppliers.\n");
        }
        draft.append("Issue: Please describe the problem here.");
        return draft.toString();
    }
}
