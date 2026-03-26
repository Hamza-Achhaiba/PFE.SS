package ma.smartsupply.util;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import ma.smartsupply.enums.Role;
import ma.smartsupply.enums.StatutProduit;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final CategorieRepository categorieRepository;
        private final UtilisateurRepository utilisateurRepository;
        private final ProduitRepository produitRepository;
        private final StockRepository stockRepository;
        private final PasswordEncoder passwordEncoder;
        private final FileStorageUtil fileStorageUtil;

        private static final String UPLOAD_DIR = "uploads/produits";
        private static final String SUPPLIER_PROFILE_DIR = "uploads/profils";

        /**
         * Copies a seed image from classpath to the uploads directory.
         * Returns the relative URL path (e.g. /uploads/profils/filename.png).
         * Skips if the file already exists (idempotent).
         */
        private String copySeedImage(String classpathFile, String targetFileName) {
                try {
                        Path targetDir = Paths.get(SUPPLIER_PROFILE_DIR);
                        Files.createDirectories(targetDir);
                        Path targetPath = targetDir.resolve(targetFileName);

                        if (!Files.exists(targetPath) || Files.size(targetPath) == 0) {
                                ClassPathResource resource = new ClassPathResource("seed-images/suppliers/" + classpathFile);
                                try (InputStream in = resource.getInputStream()) {
                                        Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                                }
                        }
                        return "/" + SUPPLIER_PROFILE_DIR + "/" + targetFileName;
                } catch (Exception e) {
                        System.err.println("  ⚠️ Failed to copy seed image " + classpathFile + ": " + e.getMessage());
                        return null;
                }
        }

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                try {
                        // Ensure upload directory exists
                        Files.createDirectories(Paths.get(UPLOAD_DIR));

                        seedCategories();
                        seedUsers();
                        seedProducts();
                        System.out.println("🚀 Data Initialization completed successfully!");
                } catch (Exception e) {
                        System.err.println("❌ ERROR during Data Initialization: " + e.getMessage());
                        e.printStackTrace();
                }
        }

        // ──────────────────────────────────────────────────────────────
        // CATEGORIES
        // ──────────────────────────────────────────────────────────────
        private void seedCategories() {
                System.out.println("🌱 Seeding Categories...");

                // Clean up malformed (mojibake) duplicate categories from previous bad-encoding seeds.
                // Malformed names contain "Ã" (UTF-8 bytes misread as Latin-1). We match them to
                // the correct category by checking common suffixes.
                cleanupMalformedCategories();

                // name -> {description, image_url}
                Map<String, String[]> categories = new LinkedHashMap<>();
                categories.put("Épicerie", new String[] {
                                "Produits d'épicerie du quotidien : farine, sucre, couscous, conserves.",
                                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                });
                categories.put("Boissons", new String[] {
                                "Toutes sortes de boissons rafraîchissantes, eaux et jus.",
                                "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80"
                });
                categories.put("Produits laitiers", new String[] {
                                "Lait, yaourts, fromages, beurre et produits dérivés.",
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWZaATysUMEIsT8LNVKauBw5tJHSx0HksgJQ&s"
                });
                categories.put("Thé Café & Infusions", new String[] {
                                "Thés verts, cafés, infusions et herbes aromatiques.",
                                "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80"
                });
                categories.put("Huiles & Olives", new String[] {
                                "Huiles de table, huiles d'olive et olives préparées.",
                                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"
                });
                categories.put("Produits de Nettoyage", new String[] {
                                "Produits d'entretien et de nettoyage pour la maison.",
                                "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
                });
                categories.put("Hygiène Corporelle", new String[] {
                                "Savons, shampoings, dentifrices et soins du corps.",
                                "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80"
                });
                categories.put("Papier & Fournitures", new String[] {
                                "Papier, mouchoirs, stylos et fournitures de bureau.",
                                "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=800&q=80"
                });
                categories.put("Électronique", new String[] {
                                "Câbles, clés USB, imprimantes et équipements tech pour commerces.",
                                "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80"
                });

                int added = 0;
                List<Categorie> allCategories = categorieRepository.findAll();

                for (Map.Entry<String, String[]> entry : categories.entrySet()) {
                        String name = entry.getKey();
                        String description = entry.getValue()[0];
                        String imageUrl = entry.getValue()[1];

                        try {
                                // Find all categories that might match (exact or fuzzy)
                                List<Categorie> matches = allCategories.stream()
                                                .filter(c -> c.getNom().equalsIgnoreCase(name) ||
                                                                c.getNom().replace(",", "")
                                                                                .equalsIgnoreCase(name.replace(",", ""))
                                                                ||
                                                                c.getNom().replace("&", "and").equalsIgnoreCase(
                                                                                name.replace("&", "and")))
                                                .toList();

                                Categorie canonical = null;
                                if (!matches.isEmpty()) {
                                        // Pick the best match (exact if possible)
                                        canonical = matches.stream()
                                                        .filter(c -> c.getNom().equals(name))
                                                        .findFirst()
                                                        .orElse(matches.get(0));

                                        // Merge others into canonical
                                        for (Categorie other : matches) {
                                                if (other.getId().equals(canonical.getId()))
                                                        continue;

                                                System.out.println("  🧹 Merging duplicate '" + other.getNom()
                                                                + "' (ID " + other.getId() + ") into '" + name + "'");
                                                List<Produit> productsToMove = produitRepository.findByCategorie(other);
                                                for (Produit p : productsToMove) {
                                                        p.setCategorie(canonical);
                                                        produitRepository.save(p);
                                                }
                                                categorieRepository.delete(other);
                                                allCategories.remove(other);
                                        }
                                }

                                // Download image locally
                                String localImagePath = null;
                                try {
                                        String fileName = fileStorageUtil.sanitize(name) + ".jpg";
                                        localImagePath = fileStorageUtil.downloadImage(imageUrl, fileName,
                                                        "categories");
                                } catch (Exception e) {
                                        System.err.println("  ⚠️ Category image download failed for " + name + ": "
                                                        + e.getMessage());
                                }

                                if (canonical == null) {
                                        Categorie newCat = Categorie.builder()
                                                        .nom(name)
                                                        .description(description)
                                                        .image(localImagePath != null ? localImagePath : imageUrl)
                                                        .build();
                                        canonical = categorieRepository.save(newCat);
                                        allCategories.add(canonical);
                                        System.out.println("  ➕ Catégorie créée: " + name);
                                        added++;
                                } else {
                                        boolean updated = false;
                                        if (!canonical.getNom().equals(name)) {
                                                canonical.setNom(name);
                                                updated = true;
                                        }
                                        if (canonical.getImage() == null
                                                        || !canonical.getImage().equals(localImagePath)) {
                                                canonical.setImage(localImagePath != null ? localImagePath : imageUrl);
                                                updated = true;
                                        }
                                        if (updated) {
                                                categorieRepository.save(canonical);
                                                System.out.println("  🆙 Catégorie mise à jour: " + name);
                                        }
                                }
                        } catch (Exception e) {
                                System.err.println("  ⚠️ Catégorie error (" + name + "): " + e.getMessage());
                        }
                }
                System.out.println("✅ Catégories: " + added + " créées, " + (categories.size() - added)
                                + " existaient déjà.");
        }

        /**
         * Removes mojibake duplicate categories. A category is considered malformed if its name
         * contains "Ã" (the telltale sign of UTF-8 bytes misread as Latin-1/Windows-1252).
         * For each malformed category we find the correct version by matching the ASCII suffix
         * (e.g. "picerie" matches "Épicerie"), move any linked products, then delete it.
         */
        private void cleanupMalformedCategories() {
                List<Categorie> allCategories = new ArrayList<>(categorieRepository.findAll());
                // Separate into good and malformed
                List<Categorie> malformed = allCategories.stream()
                                .filter(c -> c.getNom().contains("\u00C3"))  // "Ã" in Latin-1
                                .toList();
                if (malformed.isEmpty())
                        return;

                List<Categorie> good = allCategories.stream()
                                .filter(c -> !c.getNom().contains("\u00C3"))
                                .toList();

                for (Categorie bad : malformed) {
                        // Extract ASCII-only suffix for matching (e.g. "Ãƒâ€°picerie" -> "picerie")
                        String suffix = bad.getNom().replaceAll("[^a-zA-Z ]", "").trim().toLowerCase();

                        Categorie match = good.stream()
                                        .filter(g -> {
                                                String gs = g.getNom().replaceAll("[^a-zA-Z ]", "").trim().toLowerCase();
                                                return gs.equals(suffix) || gs.endsWith(suffix) || suffix.endsWith(gs);
                                        })
                                        .findFirst().orElse(null);

                        if (match != null) {
                                // Move products from malformed to correct category
                                List<Produit> products = produitRepository.findByCategorie(bad);
                                for (Produit p : products) {
                                        p.setCategorie(match);
                                        produitRepository.save(p);
                                }
                                categorieRepository.delete(bad);
                                System.out.println("  🧹 Removed malformed category '" + bad.getNom()
                                                + "' (ID " + bad.getId() + "), merged into '" + match.getNom() + "'");
                        } else {
                                // No correct version yet — fix the name by stripping mojibake
                                // This maps known suffixes to correct names
                                String corrected = guessCorrectedName(suffix);
                                if (corrected != null) {
                                        bad.setNom(corrected);
                                        categorieRepository.save(bad);
                                        System.out.println("  🔧 Renamed malformed category ID " + bad.getId()
                                                        + " to '" + corrected + "'");
                                }
                        }
                }
        }

        private String guessCorrectedName(String asciiSuffix) {
                Map<String, String> suffixToName = Map.of(
                                "picerie", "Épicerie",
                                "th caf  infusions", "Thé Café & Infusions",
                                "hygine corporelle", "Hygiène Corporelle",
                                "lectronique", "Électronique");
                for (Map.Entry<String, String> e : suffixToName.entrySet()) {
                        if (asciiSuffix.contains(e.getKey()))
                                return e.getValue();
                }
                return null;
        }

        // ──────────────────────────────────────────────────────────────
        // FOURNISSEURS + CLIENTS
        // ──────────────────────────────────────────────────────────────
        private void seedUsers() {
                seedAdmin();
                seedFournisseurs();
                seedClients();
        }

        private void seedAdmin() {
                System.out.println("🌱 Seeding Admin...");
                String adminEmail = "admin.smart.supply@gmail.com";
                if (!utilisateurRepository.existsByEmail(adminEmail)) {
                        Admin admin = Admin.builder()
                                        .nom("System Admin")
                                        .email(adminEmail)
                                        .motDePasse(passwordEncoder.encode("password123"))
                                        .telephone("+212 6 00 00 00 00")
                                        .adresse("Siege Smart Supply")
                                        .role(Role.ADMIN)
                                        .build();
                        utilisateurRepository.save(admin);
                        System.out.println("  ➕ Admin créé: " + adminEmail);
                } else {
                        System.out.println("  ✅ Admin existe déjà: " + adminEmail);
                }
        }

        private void seedFournisseurs() {
                System.out.println("🌱 Seeding Fournisseurs...");
                String encodedPassword = passwordEncoder.encode("password123");

                // Each map now includes an "image" key with the seed image filename
                List<Map<String, String>> fournisseurs = List.of(
                                Map.of("nom", "Karim El Amrani", "entreprise", "Distribution Al Baraka",
                                                "email", "karim.elamrani@gmail.com", "telephone", "+212 6 12 34 56 01",
                                                "adresse", "12 Avenue Saada, Casablanca",
                                                "image", "distribution-al-baraka.png",
                                                "description", "Spécialiste de l'épicerie fine et des produits de base au Maroc depuis plus de 15 ans. Nous garantissons une qualité irréprochable et une livraison rapide."),
                                Map.of("nom", "Youssef Bennani", "entreprise", "Atlas Boissons Pro",
                                                "email", "youssef.bennani@gmail.com", "telephone", "+212 6 12 34 56 02",
                                                "adresse", "24 Avenue Saada, Rabat",
                                                "image", "atlas-boissons-pro.png",
                                                "description", "Le partenaire privilégié pour tous vos besoins en boissons rafraîchissantes et eaux minérales filtrées."),
                                Map.of("nom", "Fatima-Zahra Chraibi", "entreprise", "Laiterie du Nord",
                                                "email", "fatimazahra.chraibi@gmail.com", "telephone",
                                                "+212 6 12 34 56 03",
                                                "adresse", "8 Avenue Saada, Tanger",
                                                "image", "laiterie-du-nord.png",
                                                "description", "Produits laitiers frais issus des meilleures fermes du nord du pays. Tradition et fraîcheur garanties."),
                                Map.of("nom", "Omar Lahlou", "entreprise", "Saveurs d'Orient Négoc",
                                                "email", "omar.lahlou@gmail.com", "telephone", "+212 6 12 34 56 04",
                                                "adresse", "31 Avenue Saada, Fès",
                                                "image", "saveurs-dorient-negoc.png",
                                                "description", "Expert en thés et cafés de haute qualité. Nous importons les meilleures saveurs pour le plaisir de vos clients."),
                                Map.of("nom", "Mehdi El Idrissi", "entreprise", "Zitounia Express",
                                                "email", "mehdi.elidrissi@gmail.com", "telephone", "+212 6 12 34 56 05",
                                                "adresse", "17 Avenue Saada, Marrakech",
                                                "image", "zitounia-express.png",
                                                "description", "Le meilleur des huiles et olives du terroir marocain, livré directement à votre magasin."),
                                Map.of("nom", "Khadija Tazi", "entreprise", "Propreté Maghreb",
                                                "email", "khadija.tazi@gmail.com", "telephone", "+212 6 12 34 56 06",
                                                "adresse", "5 Avenue Saada, Agadir",
                                                "image", "proprete-maghreb.png",
                                                "description", "Solutions professionnelles de nettoyage et d'entretien pour tous types d'établissements."),
                                Map.of("nom", "Imane Alaoui", "entreprise", "Beauté & Soins Casa",
                                                "email", "imane.alaoui@gmail.com", "telephone", "+212 6 12 34 56 07",
                                                "adresse", "19 Avenue Saada, Casablanca",
                                                "image", "beaute-soins-casa.png",
                                                "description", "Large gamme de produits d'hygiène et de soins corporels pour toute la famille."),
                                Map.of("nom", "Amine Bennis", "entreprise", "Papeterie Al Wifaq",
                                                "email", "amine.bennis@gmail.com", "telephone", "+212 6 12 34 56 08",
                                                "adresse", "43 Avenue Saada, Meknès",
                                                "image", "papeterie-al-wifaq.png",
                                                "description", "Fournitures de bureau et produits papier indispensables pour votre commerce."),
                                Map.of("nom", "Hamza El Fassi", "entreprise", "Tech Maroc Solutions",
                                                "email", "hamza.elfassi@gmail.com", "telephone", "+212 6 12 34 56 09",
                                                "adresse", "27 Avenue Saada, Casablanca",
                                                "image", "tech-maroc-solutions.png",
                                                "description", "Équipements électroniques et solutions technologiques modernes pour le commerce de détail."));

                int added = 0;
                for (Map<String, String> f : fournisseurs) {
                        try {
                                String imageFileName = f.get("image");
                                String imagePath = copySeedImage(imageFileName, imageFileName);

                                if (!utilisateurRepository.existsByEmail(f.get("email"))) {
                                        Fournisseur fournisseur = Fournisseur.builder()
                                                        .nom(f.get("nom"))
                                                        .email(f.get("email"))
                                                        .motDePasse(encodedPassword)
                                                        .telephone(f.get("telephone"))
                                                        .adresse(f.get("adresse"))
                                                        .role(Role.FOURNISSEUR)
                                                        .nomEntreprise(f.get("entreprise"))
                                                        .infoContact(f.get("telephone"))
                                                        .description(f.get("description"))
                                                        .image(imagePath)
                                                        .status(f.get("nom").contains("El Amrani") || f.get("nom").contains("Bennani")
                                                                ? ma.smartsupply.enums.SupplierStatus.VERIFIED
                                                                : ma.smartsupply.enums.SupplierStatus.PENDING_APPROVAL)
                                                        .build();
                                        utilisateurRepository.save(fournisseur);
                                        System.out.println("  ➕ Fournisseur créé: " + f.get("email") + " (image: " + imagePath + ")");
                                        added++;
                                } else {
                                        // Update image for existing suppliers that have no image yet
                                        utilisateurRepository.findByEmail(f.get("email")).ifPresent(u -> {
                                                if (u.getImage() == null || u.getImage().isBlank()) {
                                                        u.setImage(imagePath);
                                                        utilisateurRepository.save(u);
                                                        System.out.println("  🖼️ Image set for existing supplier: " + f.get("email"));
                                                }
                                        });
                                }
                        } catch (Exception e) {
                                System.err.println("  ⚠️ Fournisseur skip (" + f.get("email") + "): " + e.getMessage());
                        }
                }
                System.out
                                .println("✅ Fournisseurs: " + added + " créés, " + (fournisseurs.size() - added)
                                                + " existaient déjà.");
        }

        private void seedClients() {
                System.out.println("🌱 Seeding Clients...");
                String encodedPassword = passwordEncoder.encode("password123");

                List<Client> clientsToSeed = List.of(
                                Client.builder().nom("Hamza Achhaiba").nomMagasin("Hanout Al Amal")
                                                .email("hamza.achhaiba@gmail.com")
                                                .telephone("+212 6 12 34 56 01").adresse("Avenue El Farah, Casablanca")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Ahmed Oukhchine").nomMagasin("Mini Market Bennani")
                                                .email("ahmed.oukhchine@gmail.com").telephone("+212 6 12 34 56 02")
                                                .adresse("Rue Al Andalous, Rabat").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Khadija Aitbella").nomMagasin("Épicerie Yassine")
                                                .email("khadija.aitbella@gmail.com").telephone("+212 6 12 34 56 03")
                                                .adresse("Avenue Hassan II, Fès").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Hala Arbani").nomMagasin("Chraibi Express")
                                                .email("hala.arbani@gmail.com")
                                                .telephone("+212 6 12 34 56 04").adresse("Rue Ibn Sina, Marrakech")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Bilal Othmani").nomMagasin("Othmani Shop")
                                                .email("bilal.othmani.store@gmail.com")
                                                .telephone("+212 6 12 34 56 05").adresse("Avenue Mohammed V, Tanger")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Bader Tikert").nomMagasin("Tazi Al Baraka")
                                                .email("bader.tikert@gmail.com")
                                                .telephone("+212 6 12 34 56 06").adresse("Rue Al Amal, Meknès")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Oussama El Fassi").nomMagasin("Mini Store El Fassi")
                                                .email("oussama.elfassi.shop@gmail.com").telephone("+212 6 12 34 56 07")
                                                .adresse("Avenue Al Massira, Agadir").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Imad Berrada").nomMagasin("Berrada Market")
                                                .email("imad.berrada.store@gmail.com")
                                                .telephone("+212 6 12 34 56 08").adresse("Rue Al Qods, Oujda")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Reda Ait Taleb").nomMagasin("Ait Taleb Services")
                                                .email("reda.aittaleb.shop@gmail.com").telephone("+212 6 12 34 56 09")
                                                .adresse("Avenue Moulay Ismail, Tétouan").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Nabil Amrani").nomMagasin("Amrani Market")
                                                .email("nabil.amrani.store@gmail.com")
                                                .telephone("+212 6 12 34 56 10").adresse("Rue Al Wifaq, Kénitra")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Hamza El Mansouri").nomMagasin("Hanout El Mansouri")
                                                .email("hamza.almansouri.shop@gmail.com")
                                                .telephone("+212 6 12 34 56 11")
                                                .adresse("Avenue Al Jadida, El Jadida").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Karim Boulahya").nomMagasin("Boulahya Mini Store")
                                                .email("karim.boulahya.store@gmail.com").telephone("+212 6 12 34 56 12")
                                                .adresse("Rue Al Bahr, Safi").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Soufiane Azzouzi").nomMagasin("Azzouzi Market")
                                                .email("soufiane.azzouzi.shop@gmail.com")
                                                .telephone("+212 6 12 34 56 13")
                                                .adresse("Avenue Al Qods, Nador").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Rachid El Fassi").nomMagasin("Al Wifaq Store")
                                                .email("rachid.elfassi.store@gmail.com").telephone("+212 6 12 34 56 14")
                                                .adresse("Rue Al Farah, Mohammedia").role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build(),
                                Client.builder().nom("Omar Alaoui").nomMagasin("Alaoui Commerce")
                                                .email("omar.alaoui.shop@gmail.com")
                                                .telephone("+212 6 12 34 56 15").adresse("Avenue Atlas, Béni Mellal")
                                                .role(Role.CLIENT)
                                                .motDePasse(encodedPassword).build());

                int added = 0;
                for (Client client : clientsToSeed) {
                        if (!utilisateurRepository.existsByEmail(client.getEmail())) {
                                utilisateurRepository.save(client);
                                System.out.println("  ➕ Client créé: " + client.getEmail());
                                added++;
                        }
                }
                System.out.println("✅ Clients: " + added + " créés, " + (clientsToSeed.size() - added)
                                + " existaient déjà.");
        }

        // ──────────────────────────────────────────────────────────────
        // PRODUCTS + IMAGES + STOCK
        // ──────────────────────────────────────────────────────────────
        private void seedProducts() {
                System.out.println("🌱 Seeding Products...");

                // Each entry: { productName, supplierEmail, categoryName, imageUrl, price,
                // description }
                List<String[]> products = List.of(
                                // ── Épicerie (Karim El Amrani) ──
                                new String[] { "Couscous Dari", "karim.elamrani@gmail.com", "Épicerie",
                                                "https://www.couscousdari.com/sites/default/files/couscous_dari_ble_dur_moyen_2kg.png",
                                                "18.50", "Couscous de blé dur moyen 2kg, qualité premium marocaine." },
                                new String[] { "Farine MayMouna", "karim.elamrani@gmail.com", "Épicerie",
                                                "https://images.openfoodfacts.org/images/products/611/124/571/0334/front_fr.13.full.jpg",
                                                "12.00", "Farine de blé tendre pour pâtisserie et boulangerie." },
                                new String[] { "Sucre en morceaux Cosumar", "karim.elamrani@gmail.com", "Épicerie",
                                                "https://smarket.ma/wp-content/uploads/2023/01/0011_COSUMAR-Sucre-Morceaux-1Kg0A.jpg",
                                                "14.00", "Sucre blanc en morceaux 1kg, marque Cosumar." },
                                new String[] { "Levure Alsa", "karim.elamrani@gmail.com", "Épicerie",
                                                "https://m.media-amazon.com/images/I/71y0AB2hN3L._SL1000_.jpg",
                                                "3.50", "Levure chimique Alsa, sachet individuel." },
                                new String[] { "Concentré de tomate Aïcha", "karim.elamrani@gmail.com", "Épicerie",
                                                "https://api.allonaya.ma/assets/files/Media/7M7dZ8MvtS3Ef6579/large/Concentre-de-tomates-720g-AICHA.jpg",
                                                "22.00", "Concentré de tomates double 720g, marque Aïcha." },

                                // ── Boissons (Youssef Bennani) ──
                                new String[] { "Eau minérale Sidi Ali", "youssef.bennani@gmail.com", "Boissons",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/d8/ca/f7041abd1dbce3f80bbe309fbd89.jpg",
                                                "5.00", "Eau minérale naturelle Sidi Ali 1.5L." },
                                new String[] { "Eau gazeuse Oulmès", "youssef.bennani@gmail.com", "Boissons",
                                                "https://www.venizia.ca/wp-content/uploads/2017/08/1002.jpg",
                                                "7.00", "Eau gazeuse naturelle Oulmès 1L." },
                                new String[] { "Limonade Pom's", "youssef.bennani@gmail.com", "Boissons",
                                                "https://www.venizia.ca/wp-content/uploads/2017/08/1004.jpg",
                                                "8.00", "Limonade gazeuse Pom's, goût pomme." },
                                new String[] { "Jus d'orange Jaouda", "youssef.bennani@gmail.com", "Boissons",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/7c/2a/e3a8519e650e763d1e3e2caf5475.jpg",
                                                "12.00", "Jus d'orange 100% pur jus Jaouda 1L." },
                                new String[] { "Hawaï", "youssef.bennani@gmail.com", "Boissons",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/f8/fa/21a5b24f9a730952cb74a9830b53.jpg",
                                                "6.00", "Boisson aux fruits tropicaux Hawaï." },

                                // ── Produits laitiers (Fatima-Zahra Chraibi) ──
                                new String[] { "Lait UHT Centrale", "fatimazahra.chraibi@gmail.com",
                                                "Produits laitiers",
                                                "https://lh4.googleusercontent.com/proxy/UCB5Bx5xjZNBEHQJorG3K74O_J4d0z4TLDT-l8mPYtq8CqbuwUCqyxH2nTfAdxuibi-imHt7yX_9X-Ed4JOrpbRuM0Zn5UE3kKOQjwQuyWvH1sUMvAQ",
                                                "8.50", "Lait UHT entier Centrale Danone 1L." },
                                new String[] { "Lben Chergui", "fatimazahra.chraibi@gmail.com", "Produits laitiers",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/29/1d/5e4c8a972c58b3f680c22073436b.jpg",
                                                "5.00", "Lben traditionnel Chergui 1L." },
                                new String[] { "Yaourt Danone (Assil)", "fatimazahra.chraibi@gmail.com",
                                                "Produits laitiers",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/17/8f/775c635fd25772c87ff3fc038f0a.jpg",
                                                "3.00", "Yaourt brassé nature Danone Assil." },
                                new String[] { "Le beurre Président", "fatimazahra.chraibi@gmail.com",
                                                "Produits laitiers",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/89/da/f237969353ee23cae16d59c6b43b.jpg",
                                                "25.00", "Beurre doux Président 200g." },
                                new String[] { "Fromage La Vache qui Rit", "fatimazahra.chraibi@gmail.com",
                                                "Produits laitiers",
                                                "https://liya.ma/wp-content/uploads/2024/04/10P-49-2.png",
                                                "18.00", "Fromage fondu La Vache qui Rit, boîte de 24 portions." },

                                // ── Thé Café & Infusions (Omar Lahlou) ──
                                new String[] { "Thé vert Sultan", "omar.lahlou@gmail.com", "Thé Café & Infusions",
                                                "https://www.mymarket.ma/cdn/shop/products/the-vert-en-grain_2_f9ec16bb-a802-4e23-b200-d739517ed605.png?v=1652697601",
                                                "15.00", "Thé vert en vrac Sultan, qualité supérieure 200g." },
                                new String[] { "Café Dubois", "omar.lahlou@gmail.com", "Thé Café & Infusions",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/69/09/d35743b2647b2fa5430a63172aed.jpg",
                                                "35.00", "Café moulu Dubois, torréfaction artisanale 250g." },
                                new String[] { "Nescafé classique", "omar.lahlou@gmail.com", "Thé Café & Infusions",
                                                "https://www.mymarket.ma/cdn/shop/products/10578.jpg?v=1654261219",
                                                "45.00", "Nescafé classique soluble 200g." },
                                new String[] { "Infusion de Verveine", "omar.lahlou@gmail.com", "Thé Café & Infusions",
                                                "https://theorientalherborist.com/cdn/shop/products/il_fullxfull.3811747564_h7ul.jpg?v=1743357640",
                                                "20.00", "Verveine séchée naturelle pour infusion, sachet 50g." },
                                new String[] { "Menthe fraîche", "omar.lahlou@gmail.com", "Thé Café & Infusions",
                                                "https://www.clorofila.ma/wp-content/uploads/2023/03/Mint-leaves-2007.jpg",
                                                "5.00", "Botte de menthe fraîche pour thé marocain." },

                                // ── Huiles & Olives (Mehdi El Idrissi) ──
                                new String[] { "Huile de table Lesieur", "mehdi.elidrissi@gmail.com", "Huiles & Olives",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/d9/e9/4d49ed5ea3dfc780f2023f887e46.jpg",
                                                "32.00", "Huile de table végétale Lesieur 1L." },
                                new String[] { "Huile d'olive Oued Souss", "mehdi.elidrissi@gmail.com",
                                                "Huiles & Olives",
                                                "https://www.hsbmaroc.com/content/uploads/2020/03/HSB_Catalogue_Oued-Souss_Huile-olive_2.jpg",
                                                "55.00", "Huile d'olive extra vierge Oued Souss 1L." },
                                new String[] { "Olives rouges pimentées", "mehdi.elidrissi@gmail.com",
                                                "Huiles & Olives",
                                                "https://static.wixstatic.com/media/4ae7b8_06ba2ebe74104310a37ebe8f552ea80b~mv2.png/v1/fill/w_480,h_480,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/4ae7b8_06ba2ebe74104310a37ebe8f552ea80b~mv2.png",
                                                "15.00", "Olives rouges marinées aux piments, pot 500g." },
                                new String[] { "Olives noires", "mehdi.elidrissi@gmail.com", "Huiles & Olives",
                                                "https://img-3.journaldesfemmes.fr/HuxQM_CO8ldFhOnNHzJqv-70HGI=/1500x/smart/c6864b1261b74a47b14128a351bf6da2/ccmcms-jdf/17540051.jpg",
                                                "14.00", "Olives noires confites à l'huile d'olive, pot 500g." },
                                new String[] { "Huilor", "mehdi.elidrissi@gmail.com", "Huiles & Olives",
                                                "https://aswakassalam.com/wp-content/uploads/2026/03/33790-600x600.jpg",
                                                "28.00", "Huile de friture Huilor 5L, spéciale restauration." },

                                // ── Produits de Nettoyage (Khadija Tazi) ──
                                new String[] { "Eau de Javel Magix", "khadija.tazi@gmail.com", "Produits de Nettoyage",
                                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyzquT6Hoi2Y4oNL9Inqo10JJQ8P_wIYC4A&s",
                                                "8.00", "Eau de Javel désinfectante Magix 1L." },
                                new String[] { "Nettoyant multi-usages Sanicroix Maxis'", "khadija.tazi@gmail.com",
                                                "Produits de Nettoyage",
                                                "https://i0.wp.com/www.aswakdelivery.com/kenitra/wp-content/uploads/sites/13/2024/11/0918517.jpg?fit=1200%2C1200&ssl=1",
                                                "22.00", "Nettoyant multi-surfaces Sanicroix Maxis 1.25L." },
                                new String[] { "Pâte à laver Onyx", "khadija.tazi@gmail.com", "Produits de Nettoyage",
                                                "https://liya.ma/wp-content/uploads/2022/02/headshoulders-men-4.jpg",
                                                "10.00", "Pâte nettoyante multi-usages Onyx 500g." },
                                new String[] { "Lessive Omo", "khadija.tazi@gmail.com", "Produits de Nettoyage",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/57/33/3630c9c9b74879a16843a3ebc5b6.jpg",
                                                "42.00", "Lessive en poudre Omo 3kg, action active." },
                                new String[] { "Savon El Kef", "khadija.tazi@gmail.com", "Produits de Nettoyage",
                                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsibK-Pc3-IWaiP7UluAJzAWOc_QFwHbqUGA&s",
                                                "6.00", "Savon de ménage El Kef, barre 250g." },

                                // ── Hygiène Corporelle (Imane Alaoui) ──
                                new String[] { "Savon parfumé Taous", "imane.alaoui@gmail.com", "Hygiène Corporelle",
                                                "https://cdnprd.marjanemall.ma/cn0picture0products0mm/d2b93fdd-3b1c-4c40-824a-cb7e53b9d19d.webp",
                                                "5.00", "Savon de toilette parfumé Taous, 125g." },
                                new String[] { "Shampoing Cadum", "imane.alaoui@gmail.com", "Hygiène Corporelle",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/fc/49/1b33c6b301d5ebc200f5852d674a.jpg",
                                                "25.00", "Shampoing doux Cadum pour toute la famille 400ml." },
                                new String[] { "Dentifrice Signal", "imane.alaoui@gmail.com", "Hygiène Corporelle",
                                                "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/be/4b/0b37e7d3a0d92d1d2225d9a2e922.jpg",
                                                "15.00", "Dentifrice Signal protection caries 75ml." },
                                new String[] { "Savon noir (Beldi)", "imane.alaoui@gmail.com", "Hygiène Corporelle",
                                                "https://group-oriental.com/wp-content/uploads/2017/04/SAVONNOIR-3.jpg",
                                                "30.00", "Savon noir marocain Beldi pour hammam, pot 250g." },
                                new String[] { "Ghassoul en poudre", "imane.alaoui@gmail.com", "Hygiène Corporelle",
                                                "https://www.epices.com/1003-large_default/rhassoul.jpg",
                                                "20.00", "Ghassoul (Rhassoul) en poudre naturel, sachet 200g." },

                                // ── Papier & Fournitures (Amine Bennis) ──
                                new String[] { "Papier toilette Dalia", "amine.bennis@gmail.com",
                                                "Papier & Fournitures",
                                                "https://m.media-amazon.com/images/I/81vwMu7pK6S.jpg",
                                                "28.00", "Papier toilette Dalia double épaisseur, pack 12 rouleaux." },
                                new String[] { "Mouchoirs en papier Dalaa", "amine.bennis@gmail.com",
                                                "Papier & Fournitures",
                                                "https://liya.ma/wp-content/uploads/2022/02/1-41-1.jpg",
                                                "8.00", "Mouchoirs en papier Dalaa, boîte de 200 feuilles." },
                                new String[] { "Carnets de crédit (Karni)", "amine.bennis@gmail.com",
                                                "Papier & Fournitures",
                                                "https://onlineprint.ma/image/cache/catalog/papetrie/impression-carnet-A5-ncr-onlineprint-550x550.png",
                                                "10.00", "Carnets de crédit Karni A5, lot de 5 carnets." },
                                new String[] { "Stylos Bic", "amine.bennis@gmail.com", "Papier & Fournitures",
                                                "https://m.media-amazon.com/images/I/71ErHviYVwL._AC_SL1500_.jpg",
                                                "2.00", "Stylo à bille Bic Cristal bleu, unité." },
                                new String[] { "Sacs plastiques", "amine.bennis@gmail.com", "Papier & Fournitures",
                                                "https://raja.scene7.com/is/image/Raja/products/sac-plastique-bretelles_OFF_FR_1434.jpg?image=M_RSPB45BL_PACKSHOT_01$default$&hei=600&wid=600&fmt=jpg&qlt=85,0&resMode=sharp2&op_usm=1.75,0.3,2,0",
                                                "15.00", "Sacs plastiques à bretelles, lot de 100 unités." },

                                // ── Électronique (Hamza El Fassi) ──
                                new String[] { "Rouleaux de caisse thermique", "hamza.elfassi@gmail.com",
                                                "Électronique",
                                                "https://disismaroc.com/storage/products/163/485/disismaroc-rouleau-papier-ticket-de-caisse--1741869690-3831.png",
                                                "35.00", "Rouleaux de papier thermique 80mm, lot de 10 rouleaux." },
                                new String[] { "Lecteurs de codes-barres", "hamza.elfassi@gmail.com", "Électronique",
                                                "https://i0.wp.com/protechtogo.com/wp-content/uploads/2023/09/Douchette-lecteur-de-code-barre.jpg?fit=1000%2C1000&ssl=1",
                                                "350.00",
                                                "Lecteur de codes-barres USB filaire, compatible tous systèmes." },
                                new String[] { "Câbles réseau RJ45", "hamza.elfassi@gmail.com", "Électronique",
                                                "https://ma.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/18/216546/1.jpg?2849",
                                                "25.00", "Câble réseau Ethernet RJ45 Cat6, 5 mètres." },
                                new String[] { "Clés USB", "hamza.elfassi@gmail.com", "Électronique",
                                                "https://maxfor.ma/wp-content/uploads/2024/08/cle-usb-sandisk-32gb-ultra-sdcz73-032g-g46-usb-3-0-bon-prix-maroc-casa-rabat-tanger-maxfor-systeme.webp",
                                                "45.00", "Clé USB SanDisk Ultra 32GB USB 3.0." },
                                new String[] { "Onduleurs (UPS)", "hamza.elfassi@gmail.com", "Électronique",
                                                "https://ups-technology.com/wp-content/uploads/2024/04/POWER-TECHNOLOGY-UPSIN-1000-2000.jpg",
                                                "850.00",
                                                "Onduleur UPS 1000VA, protection contre les coupures de courant." });

                int added = 0;
                int imageSuccess = 0;
                int imageFailed = 0;

                for (String[] p : products) {
                        String productName = p[0];
                        String supplierEmail = p[1];
                        String categoryName = p[2];
                        String imageUrl = p[3];
                        double price = Double.parseDouble(p[4]);
                        String description = p[5];

                        try {
                                // Resolve supplier
                                Utilisateur user = utilisateurRepository.findByEmail(supplierEmail).orElse(null);
                                if (user == null || !(user instanceof Fournisseur)) {
                                        System.err.println(
                                                        "  ⚠️ Fournisseur non trouvé: " + supplierEmail
                                                                        + " — produit ignoré: " + productName);
                                        continue;
                                }
                                Fournisseur fournisseur = (Fournisseur) user;

                                // Check duplicate
                                Produit existingProduct = produitRepository
                                                .findByNomAndFournisseurId(productName, fournisseur.getId())
                                                .orElse(null);

                                if (existingProduct != null) {
                                        // Check if the image file exists on disk
                                        boolean fileExists = false;
                                        if (existingProduct.getImage() != null
                                                        && existingProduct.getImage().startsWith("/uploads/")) {
                                                Path imagePath = Paths.get(existingProduct.getImage().substring(1)); // Remove
                                                                                                                     // leading
                                                                                                                     // /
                                                fileExists = Files.exists(imagePath) && Files.size(imagePath) > 0;
                                        }

                                        if (fileExists) {
                                                continue; // Everything is OK
                                        } else {
                                                System.out.println("  🔄 Image manquante pour " + productName
                                                                + ", tentative de re-téléchargement...");
                                        }
                                }

                                // Resolve category
                                Categorie categorie = categorieRepository.findByNom(categoryName).orElse(null);
                                if (categorie == null) {
                                        System.err.println(
                                                        "  ⚠️ Catégorie non trouvée: " + categoryName
                                                                        + " — produit ignoré: " + productName);
                                        continue;
                                }

                                // Download image locally
                                String localImagePath = null;
                                try {
                                        String fileName = fileStorageUtil.generateUniqueFileName(categoryName,
                                                        fournisseur.getNomEntreprise(), productName, imageUrl);
                                        localImagePath = fileStorageUtil.downloadImage(imageUrl, fileName);
                                        if (localImagePath != null) {
                                                imageSuccess++;
                                        }
                                } catch (Exception imgEx) {
                                        System.err.println("  ⚠️ Image download failed for " + productName + ": "
                                                        + imgEx.getMessage());
                                }

                                // If image download failed, use the remote URL as fallback if no current image
                                if (localImagePath == null) {
                                        if (existingProduct != null && existingProduct.getImage() != null) {
                                                localImagePath = existingProduct.getImage(); // Keep old one even if
                                                                                             // broken
                                        } else {
                                                localImagePath = imageUrl;
                                                imageFailed++;
                                        }
                                }

                                if (existingProduct != null) {
                                        existingProduct.setImage(localImagePath);
                                        produitRepository.save(existingProduct);
                                        added++;
                                } else {
                                        // Create product
                                        Produit produit = Produit.builder()
                                                        .nom(productName)
                                                        .prix(price)
                                                        .description(description)
                                                        .image(localImagePath)
                                                        .quantiteMinimumCommande(1)
                                                        .fournisseur(fournisseur)
                                                        .categorie(categorie)
                                                        .actif(true)
                                                        .statutApprobation(StatutProduit.APPROVED)
                                                        .build();
                                        produit = produitRepository.save(produit);

                                        // Create stock
                                        Stock stock = Stock.builder()
                                                        .produit(produit)
                                                        .quantiteDisponible(100)
                                                        .seuilAlerte(10)
                                                        .dateDerniereMiseAJour(LocalDateTime.now())
                                                        .build();
                                        stockRepository.save(stock);
                                        added++;
                                        System.out.println("  ➕ Produit créé: " + productName + " → "
                                                        + fournisseur.getNomEntreprise());
                                }
                        } catch (Exception e) {
                                System.err.println("  ⚠️ Produit skip (" + productName + "): " + e.getMessage());
                        }
                }

                System.out.println(
                                "✅ Produits: " + added + " créés, " + (products.size() - added) + " existaient déjà.");
                System.out
                                .println("📸 Images: " + imageSuccess + " téléchargées, " + imageFailed
                                                + " en fallback URL distante.");
        }
}
