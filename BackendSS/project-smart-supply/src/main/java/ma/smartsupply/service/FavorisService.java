package ma.smartsupply.service;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.model.Client;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.model.Utilisateur;
import ma.smartsupply.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavorisService {

    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public void ajouterFavori(String emailClient, Long idFournisseur) {
        Client client = (Client) utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        Utilisateur utilisateur = utilisateurRepository.findById(idFournisseur)
                .orElseThrow(() -> new RuntimeException("Fournisseur introuvable"));

        if (!(utilisateur instanceof Fournisseur)) {
            throw new RuntimeException("L'ID fourni ne correspond pas à un fournisseur.");
        }

        Fournisseur fournisseur = (Fournisseur) utilisateur;

        if (!client.getFournisseursFavoris().contains(fournisseur)) {
            client.getFournisseursFavoris().add(fournisseur);
            utilisateurRepository.save(client);
        }
    }

    @Transactional
    public void retirerFavori(String emailClient, Long idFournisseur) {
        Client client = (Client) utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));
        client.getFournisseursFavoris().removeIf(f -> f.getId().equals(idFournisseur));
        utilisateurRepository.save(client);
    }

    public List<Fournisseur> getMesFavoris(String emailClient) {
        Client client = (Client) utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        return client.getFournisseursFavoris();
    }
}