package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.dto.UpdateProfilRequest;
import ma.smartsupply.model.Client;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public Utilisateur mettreAJourProfil(String emailConnexion, UpdateProfilRequest request) {

        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailConnexion)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (request.getNom() != null) utilisateur.setNom(request.getNom());
        if (request.getTelephone() != null) utilisateur.setTelephone(request.getTelephone());
        if (request.getAdresse() != null) utilisateur.setAdresse(request.getAdresse());

        if (utilisateur instanceof Client) {
            Client client = (Client) utilisateur;
            if (request.getNomMagasin() != null) client.setNomMagasin(request.getNomMagasin());

        } else if (utilisateur instanceof Fournisseur) {
            Fournisseur fournisseur = (Fournisseur) utilisateur;
            if (request.getNomEntreprise() != null) fournisseur.setNomEntreprise(request.getNomEntreprise());
            if (request.getInfoContact() != null) fournisseur.setInfoContact(request.getInfoContact());
        }

        return utilisateurRepository.save(utilisateur);
    }
}