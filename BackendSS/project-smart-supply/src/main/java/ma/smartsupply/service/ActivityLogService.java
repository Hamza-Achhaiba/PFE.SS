package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.model.ActivityLog;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.ActivityLogRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UtilisateurRepository utilisateurRepository;

    public List<ActivityLog> getAllLogs() {
        return activityLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public void log(Long actorId, String actorName, String actorRole,
                    String action, String targetType, String targetId,
                    String targetName, String details) {
        log(actorId, actorName, actorRole, action, targetType, targetId, targetName, details, null, null);
    }

    public void log(Long actorId, String actorName, String actorRole,
                    String action, String targetType, String targetId,
                    String targetName, String details, String status, String ipAddress) {
        ActivityLog entry = ActivityLog.builder()
                .actorId(actorId)
                .actorName(actorName)
                .actorRole(actorRole)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .targetName(targetName)
                .details(details)
                .status(status)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();
        activityLogRepository.save(entry);
    }

    /**
     * Log an authentication event (login, logout, failed login, registration).
     */
    public void logAuth(String action, String email, String ipAddress, String details, String status) {
        Long actorId = null;
        String actorName = email;
        String actorRole = "UNKNOWN";

        try {
            var userOpt = utilisateurRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                Utilisateur user = userOpt.get();
                actorId = user.getId();
                actorName = user.getNom();
                actorRole = user.getRole() != null ? user.getRole().name() : "UNKNOWN";
            }
        } catch (Exception ignored) {
            // User may not exist (failed login with wrong email)
        }

        log(actorId, actorName, actorRole, action, "AUTH", null, email, details, status, ipAddress);
    }

    /**
     * Log an action by a known user (from Principal).
     */
    public void logByEmail(String email, String action, String targetType, String targetId,
                           String targetName, String details) {
        Long actorId = null;
        String actorName = email;
        String actorRole = "UNKNOWN";

        try {
            var userOpt = utilisateurRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                Utilisateur user = userOpt.get();
                actorId = user.getId();
                actorName = user.getNom();
                actorRole = user.getRole() != null ? user.getRole().name() : "UNKNOWN";
            }
        } catch (Exception ignored) {
        }

        log(actorId, actorName, actorRole, action, targetType, targetId, targetName, details);
    }
}
