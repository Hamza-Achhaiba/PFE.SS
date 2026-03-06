package ma.smartsupply.service;

import ma.smartsupply.dto.*;
import ma.smartsupply.enums.Role;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import ma.smartsupply.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UtilisateurRepository utilisateurRepository;
    private final ClientRepository clientRepository;
    private final FournisseurRepository fournisseurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;


    public AuthenticationResponse register(RegisterRequest request) {
        Utilisateur user;

        if ("FOURNISSEUR".equalsIgnoreCase(request.getRole())) {
            user = Fournisseur.builder()
                    .nom(request.getNom())
                    .email(request.getEmail())
                    .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                    .role(Role.FOURNISSEUR)
                    .telephone(request.getTelephone())
                    .nomEntreprise(request.getNomEntreprise())
                    .build();
            fournisseurRepository.save((Fournisseur) user);
        } else {
            user = Client.builder()
                    .nom(request.getNom())
                    .email(request.getEmail())
                    .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                    .role(Role.CLIENT)
                    .telephone(request.getTelephone())
                    .adresse(request.getAdresse())
                    .nomMagasin(request.getNomMagasin())
                    .build();
            clientRepository.save((Client) user);
        }

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder().token(jwtToken).build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
        );
        var user = utilisateurRepository.findByEmail(request.getEmail()).orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder().token(jwtToken).build();
    }
}