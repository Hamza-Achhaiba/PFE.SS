package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.UpdateProfilRequest;
import ma.smartsupply.model.Client;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.UtilisateurRepository;
import ma.smartsupply.dto.ChangePasswordRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Utilisateur mettreAJourProfil(String emailConnexion, UpdateProfilRequest request) {

        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailConnexion)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (request.getNom() != null)
            utilisateur.setNom(request.getNom());
        if (request.getEmail() != null) {
            // Check if email already exists for another user
            utilisateurRepository.findByEmail(request.getEmail())
                    .ifPresent(u -> {
                        if (!u.getId().equals(utilisateur.getId())) {
                            throw new RuntimeException("Email déjà utilisé");
                        }
                    });
            utilisateur.setEmail(request.getEmail());
        }
        if (request.getTelephone() != null)
            utilisateur.setTelephone(request.getTelephone());
        if (request.getAdresse() != null)
            utilisateur.setAdresse(request.getAdresse());
        if (request.getImage() != null)
            utilisateur.setImage(request.getImage());

        if (utilisateur instanceof Client) {
            Client client = (Client) utilisateur;
            if (request.getNomMagasin() != null)
                client.setNomMagasin(request.getNomMagasin());

        } else if (utilisateur instanceof Fournisseur) {
            Fournisseur fournisseur = (Fournisseur) utilisateur;
            if (request.getNomEntreprise() != null)
                fournisseur.setNomEntreprise(request.getNomEntreprise());
            if (request.getInfoContact() != null)
                fournisseur.setInfoContact(request.getInfoContact());
        }

        return utilisateurRepository.save(utilisateur);
    }

    @Transactional
    public void changerMotDePasse(String emailConnexion, ChangePasswordRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailConnexion)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), utilisateur.getMotDePasse())) {
            throw new RuntimeException("Mot de passe actuel incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Les nouveaux mots de passe ne correspondent pas");
        }

        utilisateur.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
        utilisateurRepository.save(utilisateur);
    }
}