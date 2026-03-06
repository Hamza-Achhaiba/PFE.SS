package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.NotificationResponse;
import ma.smartsupply.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMesNotifications(Principal principal) {
        return ResponseEntity.ok(notificationService.getMesNotifications(principal.getName()));
    }

}