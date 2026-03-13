package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.UpdateProfilRequest;
import ma.smartsupply.dto.ChangePasswordRequest;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ProfilController {

    private final UtilisateurService utilisateurService;

    @GetMapping("/moi")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Utilisateur> getMonProfil(Principal principal) {
        return ResponseEntity.ok(utilisateurService.mettreAJourProfil(principal.getName(), new UpdateProfilRequest()));
    }

    @PutMapping("/update")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Utilisateur> mettreAJourProfil(
            @RequestBody UpdateProfilRequest request,
            Principal principal) {
        Utilisateur profilMaj = utilisateurService.mettreAJourProfil(principal.getName(), request);
        return ResponseEntity.ok(profilMaj);
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changerMotDePasse(
            @RequestBody ChangePasswordRequest request,
            Principal principal) {
        utilisateurService.changerMotDePasse(principal.getName(), request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload-image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<java.util.Map<String, String>> uploadImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Le fichier est vide."));
            }

            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads/profils");
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName != null && originalFileName.contains(".")
                    ? originalFileName.substring(originalFileName.lastIndexOf("."))
                    : ".jpg";
            String fileName = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path filePath = uploadPath.resolve(fileName);

            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileDownloadUri = org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/profils/")
                    .path(fileName)
                    .toUriString();

            return ResponseEntity.ok(java.util.Map.of("url", fileDownloadUri));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Erreur lors de l'upload de l'image"));
        }
    }
}