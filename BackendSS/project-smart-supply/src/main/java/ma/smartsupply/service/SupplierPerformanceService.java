package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.SupplierPerformanceResponse;
import ma.smartsupply.enums.Role;
import ma.smartsupply.enums.StatutCommande;
import ma.smartsupply.model.Commande;
import ma.smartsupply.model.Conversation;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Message;
import ma.smartsupply.model.Review;
import ma.smartsupply.repository.CommandeRepository;
import ma.smartsupply.repository.ConversationRepository;
import ma.smartsupply.repository.MessageRepository;
import ma.smartsupply.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupplierPerformanceService {

    private static final Duration RESPONSE_TARGET = Duration.ofHours(24);

    private final CommandeRepository commandeRepository;
    private final ReviewRepository reviewRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public SupplierPerformanceResponse getPerformance(Fournisseur fournisseur) {
        List<Commande> supplierOrders = commandeRepository
                .findDistinctByLignes_Produit_Fournisseur_Email(fournisseur.getEmail());
        List<Review> reviews = reviewRepository.findByFournisseurIdOrderByCreatedAtDesc(fournisseur.getId());
        List<Conversation> conversations = conversationRepository.findByFournisseurId(fournisseur.getId());

        Double onTime = computeOnTime(fournisseur.getId(), supplierOrders);
        Double response = computeResponse(conversations);
        Double quality = computeQuality(reviews);

        return SupplierPerformanceResponse.builder()
                .onTime(onTime)
                .response(response)
                .quality(quality)
                .reviewCount(reviews.size())
                .orderCount(supplierOrders.size())
                .hasEnoughData(onTime != null || response != null || quality != null)
                .build();
    }

    private Double computeOnTime(Long fournisseurId, List<Commande> supplierOrders) {
        // Delivery timing exists only at order level, so we only trust single-supplier
        // orders when attributing on-time performance to one supplier.
        List<Commande> eligibleOrders = supplierOrders.stream()
                .filter(commande -> commande.getStatut() == StatutCommande.LIVREE)
                .filter(commande -> commande.getDateLivraisonEstimee() != null)
                .filter(commande -> commande.getEscrowReleasedAt() != null)
                .filter(commande -> isExclusiveToSupplier(commande, fournisseurId))
                .toList();

        if (eligibleOrders.isEmpty()) {
            return null;
        }

        long onTimeOrders = eligibleOrders.stream()
                .filter(commande -> !commande.getEscrowReleasedAt().isAfter(commande.getDateLivraisonEstimee()))
                .count();

        return toPercentage(onTimeOrders, eligibleOrders.size());
    }

    private Double computeResponse(List<Conversation> conversations) {
        long eligibleConversations = 0;
        long timelyReplies = 0;

        for (Conversation conversation : conversations) {
            List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
            Message firstClientMessage = messages.stream()
                    .filter(this::isEligibleClientMessage)
                    .findFirst()
                    .orElse(null);

            if (firstClientMessage == null) {
                continue;
            }

            eligibleConversations++;
            LocalDateTime deadline = firstClientMessage.getCreatedAt().plus(RESPONSE_TARGET);

            boolean repliedOnTime = messages.stream()
                    .filter(this::isEligibleSupplierMessage)
                    .filter(message -> !message.getCreatedAt().isBefore(firstClientMessage.getCreatedAt()))
                    .anyMatch(message -> !message.getCreatedAt().isAfter(deadline));

            if (repliedOnTime) {
                timelyReplies++;
            }
        }

        if (eligibleConversations == 0) {
            return null;
        }

        return toPercentage(timelyReplies, eligibleConversations);
    }

    private Double computeQuality(List<Review> reviews) {
        double averageRating = reviews.stream()
                .map(Review::getRating)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(Double.NaN);

        if (Double.isNaN(averageRating)) {
            return null;
        }

        return roundToSingleDecimal(averageRating * 20.0);
    }

    private boolean isExclusiveToSupplier(Commande commande, Long fournisseurId) {
        Set<Long> supplierIds = commande.getLignes().stream()
                .map(ligne -> ligne.getProduit() != null ? ligne.getProduit().getFournisseur() : null)
                .filter(Objects::nonNull)
                .map(Fournisseur::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return supplierIds.size() == 1 && supplierIds.contains(fournisseurId);
    }

    private boolean isEligibleClientMessage(Message message) {
        return message.getSenderRole() == Role.CLIENT && message.getCreatedAt() != null;
    }

    private boolean isEligibleSupplierMessage(Message message) {
        return message.getSenderRole() == Role.FOURNISSEUR && message.getCreatedAt() != null;
    }

    private Double toPercentage(long numerator, long denominator) {
        if (denominator == 0) {
            return null;
        }
        return roundToSingleDecimal((numerator * 100.0) / denominator);
    }

    private Double roundToSingleDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
