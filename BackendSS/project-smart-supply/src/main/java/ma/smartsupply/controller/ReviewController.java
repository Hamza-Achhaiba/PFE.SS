package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.ReviewRequest;
import ma.smartsupply.dto.ReviewResponse;
import ma.smartsupply.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<ReviewResponse> submitReview(@RequestBody ReviewRequest request, Principal principal) {
        return ResponseEntity.ok(reviewService.submitReview(principal.getName(), request));
    }

    @GetMapping("/supplier/{id}")
    public ResponseEntity<List<ReviewResponse>> getSupplierReviews(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getSupplierReviews(id));
    }
}
