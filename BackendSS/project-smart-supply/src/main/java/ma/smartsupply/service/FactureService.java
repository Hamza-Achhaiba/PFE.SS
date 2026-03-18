package ma.smartsupply.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.smartsupply.model.Commande;
import ma.smartsupply.model.LigneCommande;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class FactureService {

    private static final String UPLOAD_DIR = "uploads/factures";

    public String genererFacturePDF(Commande commande) throws IOException {
        Path path = Paths.get(UPLOAD_DIR);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }

        String fileName = "facture_" + commande.getReference() + ".pdf";
        Path filePath = path.resolve(fileName);

        Document document = new Document(PageSize.A4);
        try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
            PdfWriter.getInstance(document, fos);
            document.open();

            // Fonts
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new Color(0, 102, 204));
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY);

            // Header Section (Brand & Title)
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setSpacingAfter(20);

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            brandCell.addElement(new Paragraph("SMART SUPPLY", brandFont));
            brandCell.addElement(new Paragraph("Your Supply Chain Partner", footerFont));
            headerTable.addCell(brandCell);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph pTitle = new Paragraph("FACTURE / INVOICE", titleFont);
            pTitle.setAlignment(Element.ALIGN_RIGHT);
            titleCell.addElement(pTitle);
            headerTable.addCell(titleCell);

            document.add(headerTable);

            // Separator
            document.add(new Paragraph("______________________________________________________________________________"));
            document.add(new Paragraph(" "));

            // Info Section
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);

            // Left: Order Details
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph("DÉTAILS DE LA COMMANDE", headerFont));
            leftCell.addElement(new Paragraph("Référence: " + commande.getReference(), normalFont));
            leftCell.addElement(new Paragraph("ID Commande: #" + commande.getId(), normalFont));
            leftCell.addElement(new Paragraph("Date: " + commande.getDateCreation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), normalFont));
            leftCell.addElement(new Paragraph("Mode de paiement: " + (commande.getPaymentMethod() != null ? commande.getPaymentMethod() : commande.getMethodePaiement()), normalFont));
            leftCell.addElement(new Paragraph("Statut: " + commande.getStatut(), normalFont));
            leftCell.addElement(new Paragraph("Statut paiement: " + commande.getPaymentStatus(), normalFont));
            leftCell.addElement(new Paragraph("Statut escrow: " + commande.getEscrowStatus(), normalFont));
            if (commande.getEscrowHeldAt() != null) {
                leftCell.addElement(new Paragraph("Escrow retenu le: " + commande.getEscrowHeldAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), normalFont));
            }
            if (commande.getEscrowReleasedAt() != null) {
                leftCell.addElement(new Paragraph("Escrow libere le: " + commande.getEscrowReleasedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), normalFont));
            }
            if (commande.getRefundedAt() != null) {
                leftCell.addElement(new Paragraph("Rembourse le: " + commande.getRefundedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), normalFont));
            }
            infoTable.addCell(leftCell);

            // Right: Client Details
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            rightCell.addElement(new Paragraph("INFORMATIONS CLIENT", headerFont));
            rightCell.addElement(new Paragraph(commande.getNomComplet(), normalFont));
            rightCell.addElement(new Paragraph("Tél: " + commande.getTelephone(), normalFont));
            rightCell.addElement(new Paragraph(commande.getAdresse(), normalFont));
            rightCell.addElement(new Paragraph(commande.getCodePostal() + " " + commande.getVille().toUpperCase() + ", " + commande.getRegion(), normalFont));
            infoTable.addCell(rightCell);

            document.add(infoTable);

            // Items Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{5f, 1f, 2f, 2f});
            table.setSpacingAfter(30);

            // Headers
            addHeaderCell(table, "Article / Produit", headerFont);
            addHeaderCell(table, "Qté", headerFont);
            addHeaderCell(table, "Prix Unit.", headerFont);
            addHeaderCell(table, "Sous-total", headerFont);

            // Rows
            for (LigneCommande ligne : commande.getLignes()) {
                PdfPCell nameCell = new PdfPCell(new Phrase(ligne.getProduit().getNom(), normalFont));
                nameCell.setPadding(5);
                table.addCell(nameCell);

                PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(ligne.getQuantite()), normalFont));
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                qtyCell.setPadding(5);
                table.addCell(qtyCell);

                PdfPCell prixCell = new PdfPCell(new Phrase(String.format("%.2f DH", ligne.getProduit().getPrix()), normalFont));
                prixCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                prixCell.setPadding(5);
                table.addCell(prixCell);

                PdfPCell stCell = new PdfPCell(new Phrase(String.format("%.2f DH", ligne.getSousTotal()), normalFont));
                stCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                stCell.setPadding(5);
                table.addCell(stCell);
            }

            document.add(table);

            // Total Section
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(40);
            totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            PdfPCell labelCell = new PdfPCell(new Phrase("MONTANT TOTAL:", headerFont));
            labelCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            labelCell.setPadding(5);
            totalTable.addCell(labelCell);

            PdfPCell valueCell = new PdfPCell(new Phrase(String.format("%.2f DH", commande.getMontantTotal()), titleFont));
            valueCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            valueCell.setPadding(5);
            totalTable.addCell(valueCell);

            document.add(totalTable);

            PdfPTable settlementTable = new PdfPTable(2);
            settlementTable.setWidthPercentage(40);
            settlementTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            PdfPCell feeLabelCell = new PdfPCell(new Phrase("FRAIS PLATEFORME:", headerFont));
            feeLabelCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            feeLabelCell.setPadding(5);
            settlementTable.addCell(feeLabelCell);

            PdfPCell feeValueCell = new PdfPCell(new Phrase(String.format("%.2f DH", commande.getPlatformFee() != null ? commande.getPlatformFee() : 0.0), normalFont));
            feeValueCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            feeValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            feeValueCell.setPadding(5);
            settlementTable.addCell(feeValueCell);

            PdfPCell netLabelCell = new PdfPCell(new Phrase("NET FOURNISSEUR:", headerFont));
            netLabelCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            netLabelCell.setPadding(5);
            settlementTable.addCell(netLabelCell);

            PdfPCell netValueCell = new PdfPCell(new Phrase(String.format("%.2f DH", commande.getSupplierNetAmount() != null ? commande.getSupplierNetAmount() : commande.getMontantTotal()), normalFont));
            netValueCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            netValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            netValueCell.setPadding(5);
            settlementTable.addCell(netValueCell);

            document.add(settlementTable);

            // Footer
            Paragraph footer = new Paragraph("\n\nMerci pour votre confiance!\nSmart Supply Platform - Application PFE", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            log.info("Facture PDF générée: {}", filePath);
            return "/uploads/factures/" + fileName;
        } catch (DocumentException e) {
            log.error("Erreur lors de la génération du PDF", e);
            throw new IOException("Erreur PDF: " + e.getMessage());
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(Color.LIGHT_GRAY);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);
    }
}
