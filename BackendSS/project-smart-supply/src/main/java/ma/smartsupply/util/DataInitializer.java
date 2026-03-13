package ma.smartsupply.util;

import lombok.RequiredArgsConstructor;
import ma.smartsupply.model.*;
import ma.smartsupply.repository.*;
import ma.smartsupply.enums.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
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

    private static final String BASE_URL = "http://localhost:8088";
    private static final String UPLOAD_DIR = "uploads/produits";

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

        Map<String, String> categories = new LinkedHashMap<>();
        categories.put("Épicerie", "Produits d'épicerie du quotidien : farine, sucre, couscous, conserves.");
        categories.put("Boissons", "Toutes sortes de boissons rafraîchissantes, eaux et jus.");
        categories.put("Produits laitiers", "Lait, yaourts, fromages, beurre et produits dérivés.");
        categories.put("Thé Café & Infusions", "Thés verts, cafés, infusions et herbes aromatiques.");
        categories.put("Huiles & Olives", "Huiles de table, huiles d'olive et olives préparées.");
        categories.put("Produits de Nettoyage", "Produits d'entretien et de nettoyage pour la maison.");
        categories.put("Hygiène Corporelle", "Savons, shampoings, dentifrices et soins du corps.");
        categories.put("Papier & Fournitures", "Papier, mouchoirs, stylos et fournitures de bureau.");
        categories.put("Électronique", "Câbles, clés USB, imprimantes et équipements tech pour commerces.");

        int added = 0;
        for (Map.Entry<String, String> entry : categories.entrySet()) {
            try {
                if (categorieRepository.findByNom(entry.getKey()).isEmpty()) {
                    categorieRepository.save(Categorie.builder()
                            .nom(entry.getKey())
                            .description(entry.getValue())
                            .build());
                    System.out.println("  ➕ Catégorie créée: " + entry.getKey());
                    added++;
                }
            } catch (Exception e) {
                System.err.println("  ⚠️ Catégorie skip (" + entry.getKey() + "): " + e.getMessage());
            }
        }
        System.out.println("✅ Catégories: " + added + " créées, " + (categories.size() - added) + " existaient déjà.");
    }

    // ──────────────────────────────────────────────────────────────
    // FOURNISSEURS + CLIENTS
    // ──────────────────────────────────────────────────────────────
    private void seedUsers() {
        seedFournisseurs();
        seedClients();
    }

    private void seedFournisseurs() {
        System.out.println("🌱 Seeding Fournisseurs...");
        String encodedPassword = passwordEncoder.encode("password123");

        List<Map<String, String>> fournisseurs = List.of(
                Map.of("nom", "Karim El Amrani", "entreprise", "Distribution Al Baraka",
                        "email", "karim.elamrani@gmail.com", "telephone", "+212 6 12 34 56 01",
                        "adresse", "12 Avenue Saada, Casablanca"),
                Map.of("nom", "Youssef Bennani", "entreprise", "Atlas Boissons Pro",
                        "email", "youssef.bennani@gmail.com", "telephone", "+212 6 12 34 56 02",
                        "adresse", "24 Avenue Saada, Rabat"),
                Map.of("nom", "Fatima-Zahra Chraibi", "entreprise", "Laiterie du Nord",
                        "email", "fatimazahra.chraibi@gmail.com", "telephone", "+212 6 12 34 56 03",
                        "adresse", "8 Avenue Saada, Tanger"),
                Map.of("nom", "Omar Lahlou", "entreprise", "Saveurs d'Orient Négoc",
                        "email", "omar.lahlou@gmail.com", "telephone", "+212 6 12 34 56 04",
                        "adresse", "31 Avenue Saada, Fès"),
                Map.of("nom", "Mehdi El Idrissi", "entreprise", "Zitounia Express",
                        "email", "mehdi.elidrissi@gmail.com", "telephone", "+212 6 12 34 56 05",
                        "adresse", "17 Avenue Saada, Marrakech"),
                Map.of("nom", "Khadija Tazi", "entreprise", "Propreté Maghreb",
                        "email", "khadija.tazi@gmail.com", "telephone", "+212 6 12 34 56 06",
                        "adresse", "5 Avenue Saada, Agadir"),
                Map.of("nom", "Imane Alaoui", "entreprise", "Beauté & Soins Casa",
                        "email", "imane.alaoui@gmail.com", "telephone", "+212 6 12 34 56 07",
                        "adresse", "19 Avenue Saada, Casablanca"),
                Map.of("nom", "Amine Bennis", "entreprise", "Papeterie Al Wifaq",
                        "email", "amine.bennis@gmail.com", "telephone", "+212 6 12 34 56 08",
                        "adresse", "43 Avenue Saada, Meknès"),
                Map.of("nom", "Hamza El Fassi", "entreprise", "Tech Maroc Solutions",
                        "email", "hamza.elfassi@gmail.com", "telephone", "+212 6 12 34 56 09",
                        "adresse", "27 Avenue Saada, Casablanca"));

        int added = 0;
        for (Map<String, String> f : fournisseurs) {
            try {
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
                            .build();
                    utilisateurRepository.save(fournisseur);
                    System.out.println("  ➕ Fournisseur créé: " + f.get("email"));
                    added++;
                }
            } catch (Exception e) {
                System.err.println("  ⚠️ Fournisseur skip (" + f.get("email") + "): " + e.getMessage());
            }
        }
        System.out
                .println("✅ Fournisseurs: " + added + " créés, " + (fournisseurs.size() - added) + " existaient déjà.");
    }

    private void seedClients() {
        System.out.println("🌱 Seeding Clients...");
        String encodedPassword = passwordEncoder.encode("password123");

        List<Client> clientsToSeed = List.of(
                Client.builder().nom("Hamza Achhaiba").nomMagasin("Hanout Al Amal").email("hamza.achhaiba@gmail.com")
                        .telephone("+212 6 12 34 56 01").adresse("Avenue El Farah, Casablanca").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build(),
                Client.builder().nom("Ahmed Oukhchine").nomMagasin("Mini Market Bennani")
                        .email("ahmed.oukhchine@gmail.com").telephone("+212 6 12 34 56 02")
                        .adresse("Rue Al Andalous, Rabat").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Khadija Aitbella").nomMagasin("Épicerie Yassine")
                        .email("khadija.aitbella@gmail.com").telephone("+212 6 12 34 56 03")
                        .adresse("Avenue Hassan II, Fès").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Hala Arbani").nomMagasin("Chraibi Express").email("hala.arbani@gmail.com")
                        .telephone("+212 6 12 34 56 04").adresse("Rue Ibn Sina, Marrakech").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build(),
                Client.builder().nom("Bilal Othmani").nomMagasin("Othmani Shop").email("bilal.othmani.store@gmail.com")
                        .telephone("+212 6 12 34 56 05").adresse("Avenue Mohammed V, Tanger").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build(),
                Client.builder().nom("Bader Tikert").nomMagasin("Tazi Al Baraka").email("bader.tikert@gmail.com")
                        .telephone("+212 6 12 34 56 06").adresse("Rue Al Amal, Meknès").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build(),
                Client.builder().nom("Oussama El Fassi").nomMagasin("Mini Store El Fassi")
                        .email("oussama.elfassi.shop@gmail.com").telephone("+212 6 12 34 56 07")
                        .adresse("Avenue Al Massira, Agadir").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Imad Berrada").nomMagasin("Berrada Market").email("imad.berrada.store@gmail.com")
                        .telephone("+212 6 12 34 56 08").adresse("Rue Al Qods, Oujda").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build(),
                Client.builder().nom("Reda Ait Taleb").nomMagasin("Ait Taleb Services")
                        .email("reda.aittaleb.shop@gmail.com").telephone("+212 6 12 34 56 09")
                        .adresse("Avenue Moulay Ismail, Tétouan").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Nabil Amrani").nomMagasin("Amrani Market").email("nabil.amrani.store@gmail.com")
                        .telephone("+212 6 12 34 56 10").adresse("Rue Al Wifaq, Kénitra").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build(),
                Client.builder().nom("Hamza El Mansouri").nomMagasin("Hanout El Mansouri")
                        .email("hamza.almansouri.shop@gmail.com").telephone("+212 6 12 34 56 11")
                        .adresse("Avenue Al Jadida, El Jadida").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Karim Boulahya").nomMagasin("Boulahya Mini Store")
                        .email("karim.boulahya.store@gmail.com").telephone("+212 6 12 34 56 12")
                        .adresse("Rue Al Bahr, Safi").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Soufiane Azzouzi").nomMagasin("Azzouzi Market")
                        .email("soufiane.azzouzi.shop@gmail.com").telephone("+212 6 12 34 56 13")
                        .adresse("Avenue Al Qods, Nador").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Rachid El Fassi").nomMagasin("Al Wifaq Store")
                        .email("rachid.elfassi.store@gmail.com").telephone("+212 6 12 34 56 14")
                        .adresse("Rue Al Farah, Mohammedia").role(Role.CLIENT).motDePasse(encodedPassword).build(),
                Client.builder().nom("Omar Alaoui").nomMagasin("Alaoui Commerce").email("omar.alaoui.shop@gmail.com")
                        .telephone("+212 6 12 34 56 15").adresse("Avenue Atlas, Béni Mellal").role(Role.CLIENT)
                        .motDePasse(encodedPassword).build());

        int added = 0;
        for (Client client : clientsToSeed) {
            if (!utilisateurRepository.existsByEmail(client.getEmail())) {
                utilisateurRepository.save(client);
                System.out.println("  ➕ Client créé: " + client.getEmail());
                added++;
            }
        }
        System.out.println("✅ Clients: " + added + " créés, " + (clientsToSeed.size() - added) + " existaient déjà.");
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
                new String[] { "Lait UHT Centrale", "fatimazahra.chraibi@gmail.com", "Produits laitiers",
                        "https://lh4.googleusercontent.com/proxy/UCB5Bx5xjZNBEHQJorG3K74O_J4d0z4TLDT-l8mPYtq8CqbuwUCqyxH2nTfAdxuibi-imHt7yX_9X-Ed4JOrpbRuM0Zn5UE3kKOQjwQuyWvH1sUMvAQ",
                        "8.50", "Lait UHT entier Centrale Danone 1L." },
                new String[] { "Lben Chergui", "fatimazahra.chraibi@gmail.com", "Produits laitiers",
                        "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/29/1d/5e4c8a972c58b3f680c22073436b.jpg",
                        "5.00", "Lben traditionnel Chergui 1L." },
                new String[] { "Yaourt Danone (Assil)", "fatimazahra.chraibi@gmail.com", "Produits laitiers",
                        "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/17/8f/775c635fd25772c87ff3fc038f0a.jpg",
                        "3.00", "Yaourt brassé nature Danone Assil." },
                new String[] { "Le beurre Président", "fatimazahra.chraibi@gmail.com", "Produits laitiers",
                        "https://storage.googleapis.com/sales-img-ma-live/web/cache/sylius_large/89/da/f237969353ee23cae16d59c6b43b.jpg",
                        "25.00", "Beurre doux Président 200g." },
                new String[] { "Fromage La Vache qui Rit", "fatimazahra.chraibi@gmail.com", "Produits laitiers",
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
                new String[] { "Huile d'olive Oued Souss", "mehdi.elidrissi@gmail.com", "Huiles & Olives",
                        "https://www.hsbmaroc.com/content/uploads/2020/03/HSB_Catalogue_Oued-Souss_Huile-olive_2.jpg",
                        "55.00", "Huile d'olive extra vierge Oued Souss 1L." },
                new String[] { "Olives rouges pimentées", "mehdi.elidrissi@gmail.com", "Huiles & Olives",
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
                new String[] { "Papier toilette Dalia", "amine.bennis@gmail.com", "Papier & Fournitures",
                        "https://m.media-amazon.com/images/I/81vwMu7pK6S.jpg",
                        "28.00", "Papier toilette Dalia double épaisseur, pack 12 rouleaux." },
                new String[] { "Mouchoirs en papier Dalaa", "amine.bennis@gmail.com", "Papier & Fournitures",
                        "https://liya.ma/wp-content/uploads/2022/02/1-41-1.jpg",
                        "8.00", "Mouchoirs en papier Dalaa, boîte de 200 feuilles." },
                new String[] { "Carnets de crédit (Karni)", "amine.bennis@gmail.com", "Papier & Fournitures",
                        "https://onlineprint.ma/image/cache/catalog/papetrie/impression-carnet-A5-ncr-onlineprint-550x550.png",
                        "10.00", "Carnets de crédit Karni A5, lot de 5 carnets." },
                new String[] { "Stylos Bic", "amine.bennis@gmail.com", "Papier & Fournitures",
                        "https://m.media-amazon.com/images/I/71ErHviYVwL._AC_SL1500_.jpg",
                        "2.00", "Stylo à bille Bic Cristal bleu, unité." },
                new String[] { "Sacs plastiques", "amine.bennis@gmail.com", "Papier & Fournitures",
                        "https://raja.scene7.com/is/image/Raja/products/sac-plastique-bretelles_OFF_FR_1434.jpg?image=M_RSPB45BL_PACKSHOT_01$default$&hei=600&wid=600&fmt=jpg&qlt=85,0&resMode=sharp2&op_usm=1.75,0.3,2,0",
                        "15.00", "Sacs plastiques à bretelles, lot de 100 unités." },

                // ── Électronique (Hamza El Fassi) ──
                new String[] { "Rouleaux de caisse thermique", "hamza.elfassi@gmail.com", "Électronique",
                        "https://disismaroc.com/storage/products/163/485/disismaroc-rouleau-papier-ticket-de-caisse--1741869690-3831.png",
                        "35.00", "Rouleaux de papier thermique 80mm, lot de 10 rouleaux." },
                new String[] { "Lecteurs de codes-barres", "hamza.elfassi@gmail.com", "Électronique",
                        "https://i0.wp.com/protechtogo.com/wp-content/uploads/2023/09/Douchette-lecteur-de-code-barre.jpg?fit=1000%2C1000&ssl=1",
                        "350.00", "Lecteur de codes-barres USB filaire, compatible tous systèmes." },
                new String[] { "Câbles réseau RJ45", "hamza.elfassi@gmail.com", "Électronique",
                        "https://ma.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/18/216546/1.jpg?2849",
                        "25.00", "Câble réseau Ethernet RJ45 Cat6, 5 mètres." },
                new String[] { "Clés USB", "hamza.elfassi@gmail.com", "Électronique",
                        "https://maxfor.ma/wp-content/uploads/2024/08/cle-usb-sandisk-32gb-ultra-sdcz73-032g-g46-usb-3-0-bon-prix-maroc-casa-rabat-tanger-maxfor-systeme.webp",
                        "45.00", "Clé USB SanDisk Ultra 32GB USB 3.0." },
                new String[] { "Onduleurs (UPS)", "hamza.elfassi@gmail.com", "Électronique",
                        "https://ups-technology.com/wp-content/uploads/2024/04/POWER-TECHNOLOGY-UPSIN-1000-2000.jpg",
                        "850.00", "Onduleur UPS 1000VA, protection contre les coupures de courant." });

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
                            "  ⚠️ Fournisseur non trouvé: " + supplierEmail + " — produit ignoré: " + productName);
                    continue;
                }
                Fournisseur fournisseur = (Fournisseur) user;

                // Check duplicate
                if (produitRepository.existsByNomAndFournisseurId(productName, fournisseur.getId())) {
                    continue; // already seeded
                }

                // Resolve category
                Categorie categorie = categorieRepository.findByNom(categoryName).orElse(null);
                if (categorie == null) {
                    System.err.println(
                            "  ⚠️ Catégorie non trouvée: " + categoryName + " — produit ignoré: " + productName);
                    continue;
                }

                // Download image
                String localImageUrl = null;
                String sanitizedName = sanitizeFileName(productName);
                String extension = guessExtension(imageUrl);
                String fileName = sanitizedName + extension;

                try {
                    Path localPath = downloadImage(imageUrl, fileName);
                    if (localPath != null) {
                        localImageUrl = BASE_URL + "/uploads/produits/" + fileName;
                        imageSuccess++;
                    }
                } catch (Exception imgEx) {
                    System.err.println("  ⚠️ Image download failed for " + productName + ": " + imgEx.getMessage());
                    imageFailed++;
                }

                // If image download failed, use the remote URL as fallback
                if (localImageUrl == null) {
                    localImageUrl = imageUrl;
                    imageFailed++;
                }

                // Create product
                Produit produit = Produit.builder()
                        .nom(productName)
                        .prix(price)
                        .description(description)
                        .image(localImageUrl)
                        .quantiteMinimumCommande(1)
                        .fournisseur(fournisseur)
                        .categorie(categorie)
                        .actif(true)
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

                System.out.println("  ➕ Produit créé: " + productName + " → " + fournisseur.getNomEntreprise());
                added++;

            } catch (Exception e) {
                System.err.println("  ⚠️ Produit skip (" + productName + "): " + e.getMessage());
            }
        }

        System.out.println("✅ Produits: " + added + " créés, " + (products.size() - added) + " existaient déjà.");
        System.out
                .println("📸 Images: " + imageSuccess + " téléchargées, " + imageFailed + " en fallback URL distante.");
    }

    // ──────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Downloads an image from a remote URL and saves it locally.
     * Returns the local Path on success, null on failure.
     * Idempotent: skips download if the file already exists.
     */
    private Path downloadImage(String imageUrl, String targetFileName) {
        try {
            Path targetPath = Paths.get(UPLOAD_DIR, targetFileName);

            // Skip if already downloaded
            if (Files.exists(targetPath) && Files.size(targetPath) > 0) {
                return targetPath;
            }

            URL url = new URL(imageUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 SmartSupply-Seeder/1.0");

            int responseCode = conn.getResponseCode();

            // Handle redirects manually for HTTPS→HTTP and vice versa
            if (responseCode == 301 || responseCode == 302 || responseCode == 303 || responseCode == 307) {
                String redirectUrl = conn.getHeaderField("Location");
                if (redirectUrl != null) {
                    conn.disconnect();
                    url = new URL(redirectUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(15000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 SmartSupply-Seeder/1.0");
                    responseCode = conn.getResponseCode();
                }
            }

            if (responseCode == 200) {
                try (InputStream in = conn.getInputStream()) {
                    Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
                return targetPath;
            } else {
                System.err.println("    HTTP " + responseCode + " for: " + imageUrl);
                return null;
            }
        } catch (Exception e) {
            System.err.println("    Download error: " + e.getMessage());
            return null;
        }
    }

    /**
     * Sanitizes a product name into a safe filesystem-friendly filename.
     */
    private String sanitizeFileName(String name) {
        return name.toLowerCase()
                .replaceAll("[éèêë]", "e")
                .replaceAll("[àâä]", "a")
                .replaceAll("[ùûü]", "u")
                .replaceAll("[îï]", "i")
                .replaceAll("[ôö]", "o")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    /**
     * Guesses the file extension from the image URL.
     */
    private String guessExtension(String url) {
        String lower = url.toLowerCase();
        // Strip query parameters for extension detection
        int queryIdx = lower.indexOf('?');
        if (queryIdx > 0)
            lower = lower.substring(0, queryIdx);

        if (lower.endsWith(".png"))
            return ".png";
        if (lower.endsWith(".webp"))
            return ".webp";
        if (lower.endsWith(".gif"))
            return ".gif";
        if (lower.endsWith(".svg"))
            return ".svg";
        // Default to jpg for most product images
        return ".jpg";
    }
}
