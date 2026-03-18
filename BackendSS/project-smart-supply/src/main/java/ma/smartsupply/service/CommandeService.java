package ma.smartsupply.service;

import lombok.extern.slf4j.Slf4j;
import ma.smartsupply.dto.*;
import ma.smartsupply.dto.LigneCommandeInfoDTO;
import ma.smartsupply.dto.LigneCommandeRequest;
import ma.smartsupply.dto.ProduitInfoDTO;
import ma.smartsupply.enums.EscrowStatus;
import ma.smartsupply.enums.PaymentStatus;
import ma.smartsupply.enums.Role;
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
import java.util.List;
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

        for (LigneCommandeRequest lcr : request.getLignes()) {
            Produit produit = produitRepository.findById(lcr.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit introuvable : " + lcr.getProduitId()));

            Stock stock = stockRepository.findByProduitId(produit.getId())
                    .orElseThrow(
                            () -> new RuntimeException("Le stock n'existe pas pour le produit : " + produit.getNom()));

            int stockDispo = (stock.getQuantiteDisponible() != null) ? stock.getQuantiteDisponible() : 0;

            if (stockDispo < lcr.getQuantite()) {
                throw new RuntimeException("Stock insuffisant pour : " + produit.getNom() +
                        " (Dispo: " + stockDispo + ", Demandé: " + lcr.getQuantite() + ")");
            }

            stock.setQuantiteDisponible(stockDispo - lcr.getQuantite());
            stockRepository.save(stock);

            notificationService.creer(
                    produit.getFournisseur(),
                    "Nouvelle commande pour votre produit : " + produit.getNom() + " (Quantité: " + lcr.getQuantite()
                            + ")",
                    TypeNotification.NOUVELLE_COMMANDE);

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
        applyEscrowHold(commande, now);

        return commandeRepository.save(commande);
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
                " Votre commande n°" + commande.getId() + " a été validée.",
                TypeNotification.VALIDATION_COMMANDE);
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

        String message = "Mise à jour : Votre commande #" + commande.getId() + " est maintenant "
                + nouveauStatut.name();
        notificationService.creer(commande.getClient(), message, TypeNotification.VALIDATION_COMMANDE);
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
        dto.setAmount(commande.getAmount());
        dto.setPlatformFee(commande.getPlatformFee());
        dto.setSupplierNetAmount(commande.getSupplierNetAmount());
        dto.setFacturePath(commande.getFacturePath());
        dto.setInvoicePath(commande.getInvoicePath() != null ? commande.getInvoicePath() : commande.getFacturePath());

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
        applyEscrowHold(commande, LocalDateTime.now());

        List<LigneCommande> lignesCommande = new ArrayList<>();

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

            notificationService.creer(
                    produit.getFournisseur(),
                    "Nouvelle commande pour votre produit : " + produit.getNom() + " (Quantité: "
                            + lignePanier.getQuantite() + ")",
                    TypeNotification.NOUVELLE_COMMANDE);

            LigneCommande lc = new LigneCommande();
            lc.setCommande(commande);
            lc.setProduit(produit);
            lc.setQuantite(lignePanier.getQuantite());
            lc.setSousTotal(lignePanier.getSousTotal());
            lignesCommande.add(lc);
        }
        commande.setLignes(lignesCommande);
        
        // Save first to get ID/Reference for invoice
        Commande savedCommande = commandeRepository.save(commande);

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
                "Mise à jour logistique : Votre commande " + commande.getReference() + " a un nouveau suivi: "
                        + request.getTrackingReference(),
                TypeNotification.VALIDATION_COMMANDE);

        return mapToDTO(savedCommande);
    }

    @Transactional
    public CommandeResponse marquerEscrowEnLitige(Long commandeId, String emailUtilisateur) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        boolean isClientOwner = commande.getClient() != null && commande.getClient().getEmail().equals(emailUtilisateur);
        if (!isClientOwner && !isAdmin(emailUtilisateur)) {
            throw new RuntimeException("AccÃ¨s refusÃ© : seul le client concernÃ© ou un admin peut signaler un litige.");
        }

        if (commande.getEscrowStatus() == EscrowStatus.RELEASED || commande.getEscrowStatus() == EscrowStatus.REFUNDED) {
            throw new RuntimeException("Impossible d'ouvrir un litige aprÃ¨s libÃ©ration ou remboursement des fonds.");
        }

        commande.setEscrowStatus(EscrowStatus.DISPUTED);
        commande.setPaymentStatus(PaymentStatus.DISPUTED);

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
        String message = "Mise Ã  jour : Votre commande #" + commande.getId() + " est maintenant " + nouveauStatut.name();
        notificationService.creer(commande.getClient(), message, TypeNotification.VALIDATION_COMMANDE);
        return commandeMiseAJour;
    }

    private void validateStatusTransition(StatutCommande statutActuel, StatutCommande nouveauStatut) {
        if (statutActuel == nouveauStatut) {
            return;
        }

        boolean isValid = switch (statutActuel) {
            case EN_ATTENTE_VALIDATION -> nouveauStatut == StatutCommande.VALIDEE || nouveauStatut == StatutCommande.ANNULEE;
            case VALIDEE -> nouveauStatut == StatutCommande.EN_PREPARATION || nouveauStatut == StatutCommande.ANNULEE;
            case EN_PREPARATION -> nouveauStatut == StatutCommande.EXPEDIEE || nouveauStatut == StatutCommande.ANNULEE;
            case EXPEDIEE -> nouveauStatut == StatutCommande.LIVREE;
            case LIVREE, ANNULEE -> false;
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
    }
}
