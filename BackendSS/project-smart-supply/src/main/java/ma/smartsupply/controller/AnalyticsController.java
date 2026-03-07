package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.AnalyticsStatsResponse;
import ma.smartsupply.dto.SalesTimelineResponse;
import ma.smartsupply.dto.TopProduitResponse;
import ma.smartsupply.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/fournisseur/stats")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<AnalyticsStatsResponse> getFournisseurStats(Principal principal) {
        AnalyticsStatsResponse stats = analyticsService.getFournisseurStats(principal.getName());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/fournisseur/sales-timeline")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<java.util.List<SalesTimelineResponse>> getSalesTimeline(Principal principal) {
        return ResponseEntity.ok(analyticsService.getSalesTimeline(principal.getName()));
    }

    @GetMapping("/fournisseur/top-products")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<java.util.List<TopProduitResponse>> getTopProduits(Principal principal) {
        return ResponseEntity.ok(analyticsService.getTopProduits(principal.getName()));
    }
}
