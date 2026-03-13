package ma.smartsupply.controller;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.model.Client;
import ma.smartsupply.model.Fournisseur;
import ma.smartsupply.repository.ClientRepository;
import ma.smartsupply.repository.FournisseurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recherche")
@RequiredArgsConstructor
public class RechercheController {

    private final ClientRepository clientRepository;
    private final FournisseurRepository fournisseurRepository;

    @GetMapping("/clients")
    @PreAuthorize("hasAuthority('FOURNISSEUR')")
    public ResponseEntity<List<Client>> rechercherClientParMagasin(@RequestParam(value = "magasin", required = false) String magasin) {
        List<Client> clients = clientRepository.findByNomMagasinContainingIgnoreCase(magasin);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/fournisseurs")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<List<Fournisseur>> rechercherFournisseurParEntreprise(
            @RequestParam(value = "entreprise", required = false) String entreprise) {
        List<Fournisseur> fournisseurs = fournisseurRepository.findByNomEntrepriseContainingIgnoreCase(entreprise);
        return ResponseEntity.ok(fournisseurs);
    }
}