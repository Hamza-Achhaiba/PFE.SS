package ma.smartsupply.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.smartsupply.model.Commande;
import ma.smartsupply.model.LigneCommande;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class FactureService {

    private static final String UPLOAD_DIR = "uploads/factures";
    private static final String LOGO_PATH = "logo.png";
    
    // Premium Brand Colors
    private static final Color PRIMARY_COLOR = new Color(0, 31, 63); // Navy Blue
    private static final Color SECONDARY_COLOR = new Color(71, 85, 105); // Slate Gray
    private static final Color ACCENT_COLOR = new Color(59, 130, 246); // Blue
    private static final Color LIGHT_BG = new Color(248, 250, 252); // Light Gray-Blue

    public String genererFacturePDF(Commande commande) throws IOException {
        Path path = Paths.get(UPLOAD_DIR);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }

        String fileName = "facture_" + commande.getReference() + ".pdf";
        Path filePath = path.resolve(fileName);

        // Professional Margins
        Document document = new Document(PageSize.A4, 40, 40, 50, 40);
        try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
            PdfWriter.getInstance(document, fos);
            document.open();

            // Premium Fonts
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, PRIMARY_COLOR);
            Font invoiceTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, Color.BLACK);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, PRIMARY_COLOR);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9, SECONDARY_COLOR);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, SECONDARY_COLOR);

            // 1. Header Section: Logo & Document Title
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setSpacingAfter(40);

            // Logo with Fallback
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            try {
                ClassPathResource res = new ClassPathResource(LOGO_PATH);
                try (InputStream is = res.getInputStream()) {
                    byte[] logoBytes = is.readAllBytes();
                    Image logo = Image.getInstance(logoBytes);
                    logo.scaleToFit(140, 70);
                    logoCell.addElement(logo);
                }
            } catch (Exception e) {
                log.warn("Logo loading failed in PDF: {}", e.getMessage());
                logoCell.addElement(new Paragraph("SMART SUPPLY", brandFont));
            }
            headerTable.addCell(logoCell);

            // Invoice Title & Ref
            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            
            Paragraph pInvoice = new Paragraph("INVOICE", invoiceTitleFont);
            pInvoice.setAlignment(Element.ALIGN_RIGHT);
            titleCell.addElement(pInvoice);
            
            Paragraph pRef = new Paragraph("Ref: " + commande.getReference(), boldFont);
            pRef.setAlignment(Element.ALIGN_RIGHT);
            titleCell.addElement(pRef);
            
            headerTable.addCell(titleCell);
            document.add(headerTable);

            // 2. Info Section: Bill To & Order Summary
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(30);

            // Bill To
            PdfPCell billToCell = new PdfPCell();
            billToCell.setBorder(Rectangle.NO_BORDER);
            billToCell.setPaddingRight(20);
            
            addSectionTitle(billToCell, "BILL TO", sectionTitleFont);
            billToCell.addElement(new Paragraph(commande.getNomComplet().toUpperCase(), boldFont));
            billToCell.addElement(new Paragraph(commande.getAdresse(), normalFont));
            billToCell.addElement(new Paragraph(commande.getVille().toUpperCase() + ", " + commande.getCodePostal(), normalFont));
            billToCell.addElement(new Paragraph(commande.getRegion(), normalFont));
            billToCell.addElement(new Paragraph("Phone: " + commande.getTelephone(), smallFont));
            infoTable.addCell(billToCell);

            // Order Summary
            PdfPCell orderSummaryCell = new PdfPCell();
            orderSummaryCell.setBorder(Rectangle.NO_BORDER);
            orderSummaryCell.setPaddingLeft(20);
            
            addSectionTitle(orderSummaryCell, "ORDER SUMMARY", sectionTitleFont);
            addDetailRow(orderSummaryCell, "Order ID", "#" + commande.getId(), normalFont, boldFont);
            addDetailRow(orderSummaryCell, "Date", commande.getDateCreation().format(DateTimeFormatter.ofPattern("dd MMM yyyy")), normalFont, boldFont);
            addDetailRow(orderSummaryCell, "Payment Method", (commande.getPaymentMethod() != null ? commande.getPaymentMethod() : commande.getMethodePaiement()), normalFont, boldFont);
            addDetailRow(orderSummaryCell, "Order Status", commande.getStatut().toString(), normalFont, boldFont);
            addDetailRow(orderSummaryCell, "Payment Status", commande.getPaymentStatus().toString(), normalFont, boldFont);
            
            infoTable.addCell(orderSummaryCell);
            document.add(infoTable);

            // 3. Items Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 5f, 1f, 2f, 2f });
            table.setSpacingAfter(20);

            // Professional Headers with Navy Background
            addPremiumHeaderCell(table, "PRODUCT / DESCRIPTION", tableHeaderFont);
            addPremiumHeaderCell(table, "QTY", tableHeaderFont);
            addPremiumHeaderCell(table, "UNIT PRICE", tableHeaderFont);
            addPremiumHeaderCell(table, "TOTAL", tableHeaderFont);

            // Table Body
            for (LigneCommande ligne : commande.getLignes()) {
                addPremiumBodyCell(table, ligne.getProduit().getNom(), normalFont, Element.ALIGN_LEFT);
                addPremiumBodyCell(table, String.valueOf(ligne.getQuantite()), normalFont, Element.ALIGN_CENTER);
                addPremiumBodyCell(table, String.format("%.2f DH", ligne.getProduit().getPrix()), normalFont, Element.ALIGN_RIGHT);
                addPremiumBodyCell(table, String.format("%.2f DH", ligne.getSousTotal()), boldFont, Element.ALIGN_RIGHT);
            }
            document.add(table);

            // 4. Totals Block
            PdfPTable totalsContainer = new PdfPTable(2);
            totalsContainer.setWidthPercentage(100);
            
            // Notes Column
            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.NO_BORDER);
            notesCell.setPaddingRight(40);
            notesCell.addElement(new Paragraph("NOTES:", sectionTitleFont));
            notesCell.addElement(new Paragraph("Payment processed successfully. This is a computer-generated invoice.", smallFont));
            totalsContainer.addCell(notesCell);

            // Totals Column
            PdfPCell totalsColumnCell = new PdfPCell();
            totalsColumnCell.setBorder(Rectangle.NO_BORDER);
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(100);
            
            addTotalRow(totalsTable, "Subtotal", String.format("%.2f DH", commande.getMontantTotal()), normalFont, normalFont, false);
            
            if (commande.getPlatformFee() != null && commande.getPlatformFee() > 0) {
                addTotalRow(totalsTable, "Platform Fee", String.format("- %.2f DH", commande.getPlatformFee()), normalFont, normalFont, false);
            }
            
            if (commande.getSupplierNetAmount() != null && commande.getSupplierNetAmount() > 0) {
                 addTotalRow(totalsTable, "Net Supplier", String.format("%.2f DH", commande.getSupplierNetAmount()), smallFont, smallFont, false);
            }

            addTotalRow(totalsTable, "TOTAL AMOUNT", String.format("%.2f DH", commande.getMontantTotal()), sectionTitleFont, brandFont, true);
            
            totalsColumnCell.addElement(totalsTable);
            totalsContainer.addCell(totalsColumnCell);
            
            document.add(totalsContainer);

            // 5. Footer
            Paragraph thankYou = new Paragraph("\n\nThank you for choosing Smart Supply!", footerFont);
            thankYou.setAlignment(Element.ALIGN_CENTER);
            thankYou.setSpacingBefore(80);
            document.add(thankYou);
            
            Paragraph smartSupply = new Paragraph("www.smart-supply.ma", smallFont);
            smartSupply.setAlignment(Element.ALIGN_CENTER);
            document.add(smartSupply);

            document.close();
            log.info("Facture PDF générée: {}", filePath);
            return "/uploads/factures/" + fileName;
        } catch (DocumentException e) {
            log.error("Erreur lors de la génération du PDF", e);
            throw new IOException("Erreur PDF: " + e.getMessage());
        }
    }

    private void addSectionTitle(PdfPCell cell, String title, Font font) {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingAfter(8);
        cell.addElement(p);
    }

    private void addDetailRow(PdfPCell cell, String label, String value, Font labelFont, Font valueFont) {
        Phrase phrase = new Phrase();
        phrase.add(new Chunk(label + ": ", labelFont));
        phrase.add(new Chunk(value, valueFont));
        Paragraph p = new Paragraph(phrase);
        p.setLeading(14);
        cell.addElement(p);
    }

    private void addPremiumHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(PRIMARY_COLOR);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(10);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }

    private void addPremiumBodyCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(10);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont, boolean isFinal) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingTop(5);
        labelCell.setPaddingBottom(5);
        if (isFinal) {
            labelCell.setBorder(Rectangle.TOP);
            labelCell.setBorderColor(Color.LIGHT_GRAY);
            labelCell.setPaddingTop(10);
        }
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPaddingTop(5);
        valueCell.setPaddingBottom(5);
        if (isFinal) {
            valueCell.setBorder(Rectangle.TOP);
            valueCell.setBorderColor(Color.LIGHT_GRAY);
            valueCell.setPaddingTop(10);
        }
        table.addCell(valueCell);
    }
}
