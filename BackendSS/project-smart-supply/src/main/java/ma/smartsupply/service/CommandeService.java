package ma.smartsupply.service;

import ma.smartsupply.dto.*;
import ma.smartsupply.dto.LigneCommandeInfoDTO;
import ma.smartsupply.dto.LigneCommandeRequest;
import ma.smartsupply.dto.ProduitInfoDTO;
import ma.smartsupply.enums.StatutCommande;
import ma.smartsupply.enums.TypeNotification;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
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
        commande.setClient(client);
        commande.setDateCreation(LocalDateTime.now());
        commande.setStatut(StatutCommande.EN_ATTENTE_VALIDATION);
        commande.setLignes(new ArrayList<>());

        double montantTotal = 0;


        for (LigneCommandeRequest lcr : request.getLignes()) {
            Produit produit = produitRepository.findById(lcr.getProduitId())
                    .orElseThrow(() -> new RuntimeException("Produit introuvable : " + lcr.getProduitId()));

            Stock stock = stockRepository.findByProduitId(produit.getId())
                    .orElseThrow(() -> new RuntimeException("Le stock n'existe pas pour le produit : " + produit.getNom()));

            int stockDispo = (stock.getQuantiteDisponible() != null) ? stock.getQuantiteDisponible() : 0;

            if (stockDispo < lcr.getQuantite()) {
                throw new RuntimeException("Stock insuffisant pour : " + produit.getNom() +
                        " (Dispo: " + stockDispo + ", Demandé: " + lcr.getQuantite() + ")");
            }

            stock.setQuantiteDisponible(stockDispo - lcr.getQuantite());
            stockRepository.save(stock);

            notificationService.creer(
                    produit.getFournisseur(),
                    "Nouvelle commande pour votre produit : " + produit.getNom() + " (Quantité: " + lcr.getQuantite() + ")",
                    TypeNotification.NOUVELLE_COMMANDE
            );

            LigneCommande ligne = new LigneCommande();
            ligne.setCommande(commande);
            ligne.setProduit(produit);
            ligne.setQuantite(lcr.getQuantite());

            double sousTotal = produit.getPrix() * lcr.getQuantite();
            ligne.setSousTotal(sousTotal);

            commande.getLignes().add(ligne);
            montantTotal += sousTotal;
        }

        commande.setMontantTotal(montantTotal);

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
                TypeNotification.VALIDATION_COMMANDE
        );
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
            throw new RuntimeException("Impossible d'annuler : La commande est déjà en cours de traitement ou expédiée.");
        }

        LocalDateTime maintenant = LocalDateTime.now();

        LocalDateTime dateCommande = commande.getDateCreation();

        long heuresEcoulees = ChronoUnit.HOURS.between(dateCommande, maintenant);
        if (heuresEcoulees > 24) {
            throw new RuntimeException("Le délai de 24h pour annuler la commande est dépassé.");
        }

        commande.setStatut(StatutCommande.ANNULEE);

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
    public Commande changerStatutCommande(Long commandeId, StatutCommande nouveauStatut) {

        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable avec l'ID : " + commandeId));


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

        String message = "Mise à jour : Votre commande #" + commande.getId() + " est maintenant " + nouveauStatut.name();
        notificationService.creer(commande.getClient(), message, TypeNotification.VALIDATION_COMMANDE);
        return commandeMiseAJour;
    }

    public List<CommandeResponse> getMesAchats(String emailClient, StatutCommande statut) {
        List<Commande> commandes;

        if (statut == null) {
            commandes = commandeRepository.findByClientEmail(emailClient);
        } else {
            commandes = commandeRepository.findByClientEmailAndStatut(emailClient, statut);
        }

        return commandes.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> getMesVentes(String emailFournisseur) {
        return commandeRepository.findDistinctByLignes_Produit_Fournisseur_Email(emailFournisseur)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private CommandeResponse mapToDTO(Commande commande) {
        CommandeResponse dto = new CommandeResponse();
        dto.setId(commande.getId());
        dto.setDateCreation(commande.getDateCreation());
        dto.setMontantTotal(commande.getMontantTotal());
        dto.setStatut(commande.getStatut().name());


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
        return dto;
    }

    @Transactional
    public CommandeResponse validerPanier(String emailClient) {

        Panier panier = panierRepository.findByClientEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Panier introuvable"));

        if (panier.getLignes().isEmpty()) {
            throw new RuntimeException("Impossible de valider un panier vide !");
        }

        Commande commande = new Commande();
        commande.setClient((Client) panier.getClient());
        commande.setDateCreation(LocalDateTime.now());
        commande.setMontantTotal(panier.getMontantTotal());
        commande.setStatut(StatutCommande.VALIDEE);

        List<LigneCommande> lignesCommande = new ArrayList<>();

        for (LignePanier lignePanier : panier.getLignes()) {
            Produit produit = lignePanier.getProduit();

            if (produit.getStock() == null || produit.getStock().getQuantiteDisponible() < lignePanier.getQuantite()) {
                throw new RuntimeException("Rupture de stock pour le produit : " + produit.getNom());
            }

            produit.getStock().setQuantiteDisponible(
                    produit.getStock().getQuantiteDisponible() - lignePanier.getQuantite()
            );

            LigneCommande lc = new LigneCommande();
            lc.setCommande(commande);
            lc.setProduit(produit);
            lc.setQuantite(lignePanier.getQuantite());
            lc.setSousTotal(lignePanier.getSousTotal());
            lignesCommande.add(lc);
        }
        commande.setLignes(lignesCommande);
        Commande savedCommande = commandeRepository.save(commande);

        panier.getLignes().clear();
        panier.setMontantTotal(0.0);
        panierRepository.save(panier);
        return mapToDTO(savedCommande);
    }

    @Transactional
    public CommandeResponse mettreAJourStatut(Long commandeId, String nouveauStatut) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
        commande.setStatut(StatutCommande.valueOf(nouveauStatut.toUpperCase()));

        Commande savedCommande = commandeRepository.save(commande);
        return mapToDTO(savedCommande);
    }
}
