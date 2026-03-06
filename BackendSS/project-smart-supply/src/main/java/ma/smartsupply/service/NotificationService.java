package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.NotificationResponse;
import ma.smartsupply.enums.TypeNotification;
import ma.smartsupply.model.Notification;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.NotificationRepository;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public void creer(Utilisateur destinataire, String message ,TypeNotification type) {
        Notification notif = Notification.builder()
                .destinataire(destinataire)
                .message(message)
                .dateEnvoi(LocalDateTime.now())
                .type(type)
                .build();
        notificationRepository.save(notif);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .dateEnvoi(notification.getDateEnvoi())
                .type(notification.getType())

                .build();
    }

    public List<NotificationResponse> getMesNotifications(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        List<Notification> notifications = notificationRepository.findByDestinataireIdOrderByDateEnvoiDesc(user.getId());

        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

}