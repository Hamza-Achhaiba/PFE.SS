package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ReviewRequest;
import ma.smartsupply.dto.ReviewResponse;
import ma.smartsupply.service.ActivityLogService;
import ma.smartsupply.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ActivityLogService activityLogService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ReviewResponse> submitReview(@RequestBody ReviewRequest request, Principal principal) {
        ReviewResponse response = reviewService.submitReview(principal.getName(), request);
        activityLogService.logByEmail(principal.getName(), "REVIEW_SUBMITTED", "SUPPLIER",
                String.valueOf(request.getFournisseurId()), null,
                "Review submitted, rating: " + request.getRating());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ReviewResponse> updateReview(@PathVariable("id") Long id,
                                                       @RequestBody ReviewRequest request,
                                                       Principal principal) {
        ReviewResponse response = reviewService.updateReview(principal.getName(), id, request);
        activityLogService.logByEmail(principal.getName(), "REVIEW_UPDATED", "SUPPLIER",
                String.valueOf(request.getFournisseurId()), null,
                "Review updated, rating: " + request.getRating());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my/{supplierId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ReviewResponse> getMyReview(@PathVariable("supplierId") Long supplierId,
                                                      Principal principal) {
        Optional<ReviewResponse> review = reviewService.getMyReview(principal.getName(), supplierId);
        return review.map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/supplier/{id}")
    public ResponseEntity<List<ReviewResponse>> getSupplierReviews(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reviewService.getSupplierReviews(id));
    }
}
