package ma.smartsupply.controller;

import ma.smartsupply.dto.*;
import ma.smartsupply.service.ActivityLogService;
import ma.smartsupply.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final ActivityLogService activityLogService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        AuthenticationResponse response = service.register(request);
        String ip = extractIp(httpRequest);
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "CLIENT";
        activityLogService.logAuth("ACCOUNT_CREATED", request.getEmail(), ip,
                "New " + role + " account registered: " + request.getNom(), "SUCCESS");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request, HttpServletRequest httpRequest) {
        String ip = extractIp(httpRequest);
        try {
            AuthenticationResponse response = service.authenticate(request);
            activityLogService.logAuth("LOGIN", request.getEmail(), ip,
                    "User logged in successfully", "SUCCESS");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            activityLogService.logAuth("LOGIN_FAILED", request.getEmail(), ip,
                    "Failed login attempt: " + e.getMessage(), "FAILURE");
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequest request, HttpServletRequest httpRequest) {
        String ip = extractIp(httpRequest);
        String email = request != null && request.getEmail() != null ? request.getEmail() : "unknown";
        activityLogService.logAuth("LOGOUT", email, ip, "User logged out", "SUCCESS");
        return ResponseEntity.ok().build();
    }

    private String extractIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isEmpty()) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
