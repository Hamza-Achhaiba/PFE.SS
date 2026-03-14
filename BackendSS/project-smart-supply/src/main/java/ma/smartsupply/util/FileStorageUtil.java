package ma.smartsupply.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Component
public class FileStorageUtil {

    private static final String BASE_UPLOAD_DIR = "uploads";

    /**
     * Downloads an image from a remote URL and saves it locally in a subdirectory.
     * Returns the relative path on success, null on failure.
     * Idempotent: skips download if the file already exists.
     */
    public String downloadImage(String imageUrl, String targetFileName, String subDir) {
        try {
            Path directoryPath = Paths.get(BASE_UPLOAD_DIR, subDir);
            if (!Files.exists(directoryPath)) {
                Files.createDirectories(directoryPath);
            }

            Path targetPath = directoryPath.resolve(targetFileName);
            String relativePath = "/" + BASE_UPLOAD_DIR + "/" + subDir + "/" + targetFileName;

            // Skip if already downloaded
            if (Files.exists(targetPath) && Files.size(targetPath) > 0) {
                return relativePath;
            }

            log.info("Downloading image from {} to {}", imageUrl, targetPath);

            URL url = new URL(imageUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 SmartSupply-Seeder/1.0");

            int responseCode = conn.getResponseCode();

            // Handle redirects
            if (responseCode >= 300 && responseCode < 400) {
                String redirectUrl = conn.getHeaderField("Location");
                if (redirectUrl != null) {
                    conn.disconnect();
                    return downloadImage(redirectUrl, targetFileName, subDir);
                }
            }

            if (responseCode == 200) {
                try (InputStream in = conn.getInputStream()) {
                    Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
                return relativePath;
            } else {
                log.warn("HTTP {} for: {}", responseCode, imageUrl);
                return null;
            }
        } catch (Exception e) {
            log.error("Download error for {}: {}", imageUrl, e.getMessage());
            return null;
        }
    }

    /**
     * Legacy method for products (compatibility)
     */
    public String downloadImage(String imageUrl, String targetFileName) {
        return downloadImage(imageUrl, targetFileName, "produits");
    }

    /**
     * Generates a unique and stable filename based on product details.
     */
    public String generateUniqueFileName(String category, String supplier, String product, String originalUrl) {
        String base = sanitize(category) + "_" + sanitize(supplier) + "_" + sanitize(product);
        String extension = guessExtension(originalUrl);
        return base + extension;
    }

    public String sanitize(String input) {
        if (input == null) return "unknown";
        return input.toLowerCase()
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

    private String guessExtension(String url) {
        String lower = url.toLowerCase();
        int queryIdx = lower.indexOf('?');
        if (queryIdx > 0) lower = lower.substring(0, queryIdx);

        if (lower.endsWith(".png")) return ".png";
        if (lower.endsWith(".webp")) return ".webp";
        if (lower.endsWith(".gif")) return ".gif";
        if (lower.endsWith(".svg")) return ".svg";
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return ".jpg";
        
        return ".jpg"; // Default
    }
}
