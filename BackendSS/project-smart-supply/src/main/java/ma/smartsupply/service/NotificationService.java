package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.NotificationResponse;
import ma.smartsupply.enums.TypeNotification;
import ma.smartsupply.model.Commande;
import ma.smartsupply.model.LigneCommande;
import ma.smartsupply.model.Notification;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.CommandeRepository;
import ma.smartsupply.repository.NotificationRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final Pattern ORDER_ID_PATTERN = Pattern.compile("#\\s*(\\d+)");
    private static final Pattern ORDER_REF_PATTERN = Pattern.compile("CMD-[A-Z0-9]{8}");
    private static final Pattern SUPPLIER_PRODUCT_PATTERN = Pattern.compile(
            "(?i)pour votre produit\\s*:\\s*(.+?)\\s*\\(quant[^:]*:\\s*(\\d+)\\)");

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CommandeRepository commandeRepository;

    public void creer(Utilisateur destinataire, String message, TypeNotification type) {
        creer(destinataire, message, type, null, null);
    }

    public void creer(Utilisateur destinataire, String message, TypeNotification type, Long commandeId) {
        creer(destinataire, message, type, commandeId, null);
    }

    public void creer(Utilisateur destinataire, String message, TypeNotification type, Long commandeId, String commandeRef) {
        Notification notif = Notification.builder()
                .destinataire(destinataire)
                .message(message)
                .dateEnvoi(LocalDateTime.now())
                .type(type)
                .lue(false)
                .commandeId(commandeId)
                .commandeRef(commandeRef)
                .build();
        notificationRepository.save(notif);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .dateCreation(notification.getDateEnvoi())
                .type(notification.getType())
                .lue(notification.isLue())
                .commandeId(notification.getCommandeId())
                .commandeRef(notification.getCommandeRef())
                .build();
    }

    @Transactional
    public List<NotificationResponse> getMesNotifications(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        List<Notification> notifications = notificationRepository
                .findByDestinataireIdOrderByDateEnvoiDesc(user.getId());

        return notifications.stream()
                .map(notification -> enrichOrderTarget(notification, user.getEmail()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Notification enrichOrderTarget(Notification notification, String userEmail) {
        if (notification.getCommandeId() != null || notification.getCommandeRef() != null) {
            return notification;
        }

        Commande commande = resolveNotificationOrder(notification, userEmail);
        if (commande == null) {
            return notification;
        }

        notification.setCommandeId(commande.getId());
        notification.setCommandeRef(commande.getReference());
        return notificationRepository.save(notification);
    }

    private Commande resolveNotificationOrder(Notification notification, String userEmail) {
        String message = notification.getMessage();
        if (message == null || message.isBlank()) {
            return null;
        }

        List<Commande> supplierOrders = commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_EmailOrderByDateCreationDesc(userEmail);
        if (supplierOrders.isEmpty()) {
            return null;
        }

        Long orderId = extractOrderId(message);
        if (orderId != null) {
            return supplierOrders.stream()
                    .filter(order -> orderId.equals(order.getId()))
                    .findFirst()
                    .orElse(null);
        }

        String orderRef = extractOrderRef(message);
        if (orderRef != null) {
            return supplierOrders.stream()
                    .filter(order -> orderRef.equals(order.getReference()))
                    .findFirst()
                    .orElse(null);
        }

        SupplierOrderClue clue = extractSupplierOrderClue(message);
        if (clue == null) {
            return null;
        }

        List<Commande> candidates = supplierOrders.stream()
                .filter(order -> containsMatchingSupplierLine(order, userEmail, clue))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            return null;
        }

        if (notification.getDateEnvoi() == null) {
            return candidates.get(0);
        }

        return candidates.stream()
                .min((left, right) -> Long.compare(
                        distanceInSeconds(left.getDateCreation(), notification.getDateEnvoi()),
                        distanceInSeconds(right.getDateCreation(), notification.getDateEnvoi())))
                .orElse(candidates.get(0));
    }

    private boolean containsMatchingSupplierLine(Commande order, String userEmail, SupplierOrderClue clue) {
        return order.getLignes().stream().anyMatch(line -> matchesSupplierLine(line, userEmail, clue));
    }

    private boolean matchesSupplierLine(LigneCommande line, String userEmail, SupplierOrderClue clue) {
        if (line.getProduit() == null
                || line.getProduit().getFournisseur() == null
                || line.getProduit().getNom() == null) {
            return false;
        }

        boolean sameSupplier = userEmail.equals(line.getProduit().getFournisseur().getEmail());
        boolean sameProduct = clue.productName().equalsIgnoreCase(line.getProduit().getNom().trim());
        boolean sameQuantity = clue.quantity() == null || clue.quantity().equals(line.getQuantite());
        return sameSupplier && sameProduct && sameQuantity;
    }

    private long distanceInSeconds(LocalDateTime orderTime, LocalDateTime notificationTime) {
        if (orderTime == null || notificationTime == null) {
            return Long.MAX_VALUE;
        }
        return Math.abs(ChronoUnit.SECONDS.between(orderTime, notificationTime));
    }

    private Long extractOrderId(String message) {
        Matcher matcher = ORDER_ID_PATTERN.matcher(message);
        if (!matcher.find()) {
            return null;
        }
        return Long.parseLong(matcher.group(1));
    }

    private String extractOrderRef(String message) {
        Matcher matcher = ORDER_REF_PATTERN.matcher(message);
        return matcher.find() ? matcher.group() : null;
    }

    private SupplierOrderClue extractSupplierOrderClue(String message) {
        Matcher matcher = SUPPLIER_PRODUCT_PATTERN.matcher(message);
        if (!matcher.find()) {
            return null;
        }

        String productName = matcher.group(1) != null ? matcher.group(1).trim() : "";
        if (productName.isEmpty()) {
            return null;
        }

        Integer quantity = null;
        if (matcher.group(2) != null && !matcher.group(2).isBlank()) {
            quantity = Integer.parseInt(matcher.group(2));
        }

        return new SupplierOrderClue(productName, quantity);
    }

    private record SupplierOrderClue(String productName, Integer quantity) {
    }
}
