package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ReviewRequest;
import ma.smartsupply.dto.ReviewResponse;
import ma.smartsupply.model.Client;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Review;
import ma.smartsupply.repository.ReviewRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public ReviewResponse submitReview(String clientEmail, ReviewRequest request) {
        Client client = (Client) utilisateurRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Fournisseur fournisseur = (Fournisseur) utilisateurRepository.findById(request.getFournisseurId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        boolean alreadyReviewed = reviewRepository
                .findByClientIdAndFournisseurId(client.getId(), fournisseur.getId())
                .isPresent();

        if (alreadyReviewed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You have already reviewed this supplier. Please edit your existing review.");
        }

        Review review = Review.builder()
                .client(client)
                .fournisseur(fournisseur)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Transactional
    public ReviewResponse updateReview(String clientEmail, Long reviewId, ReviewRequest request) {
        Client client = (Client) utilisateurRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getClient().getId().equals(client.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own reviews");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    public Optional<ReviewResponse> getMyReview(String clientEmail, Long fournisseurId) {
        Client client = (Client) utilisateurRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        return reviewRepository.findByClientIdAndFournisseurId(client.getId(), fournisseurId)
                .map(this::mapToResponse);
    }

    public List<ReviewResponse> getSupplierReviews(Long fournisseurId) {
        return reviewRepository.findByFournisseurIdOrderByCreatedAtDesc(fournisseurId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .clientId(review.getClient().getId())
                .clientName(review.getClient().getNom())
                .build();
    }
}
