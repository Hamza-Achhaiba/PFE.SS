package ma.smartsupply.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.smartsupply.service.CommandeService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class EscrowAutoReleaseScheduler {

    private final CommandeService commandeService;

    /**
     * Runs every hour to auto-release escrow for eligible orders.
     * Orders are eligible when:
     * - escrow is HELD_IN_ESCROW
     * - autoReleaseEligibleAt has passed
     * - client has not confirmed receipt
     * - no active dispute, refund request, or cancellation
     */
    @Scheduled(fixedRate = 3600000) // every hour
    public void releaseEligibleEscrows() {
        int released = commandeService.autoReleaseEligibleEscrows();
        if (released > 0) {
            log.info("Escrow auto-release: {} order(s) released", released);
        }
    }
}
