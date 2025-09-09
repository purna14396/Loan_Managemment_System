package com.loanmanagement.service;

import com.loanmanagement.model.EmiPayment;
import com.loanmanagement.model.Loan;
import com.loanmanagement.model.User;
import com.loanmanagement.repository.EmiPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final EmiPaymentRepository emiPaymentRepository; // ✅ to compute X/N and totals

    // Set this in application.properties, e.g. SmartLendOfficial <smartlendlms1@gmail.com>
    @Value("${mail.from:smartlendlms1@gmail.com}")
    private String from;

    @Value("${brand.name:SmartLend}")
    private String brandName;

    @Value("${brand.addr:No. 42, Tech Park Lane, Chennai – 600096}")
    private String brandAddr;

    @Value("${brand.phone:+91 98765 43210}")
    private String brandPhone;

    @Value("${brand.email:smartlendlms1@gmail.com}")
    private String brandEmail;

    private static final DateTimeFormatter D_ONLY = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter D_LONG = DateTimeFormatter.ofPattern("dd MMMM yyyy");


    // ---------- helpers ----------

    private static String inr(BigDecimal v) {
        if (v == null) return "₹0.00";
        return "₹" + String.format("%,.2f", v);
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static class FromParts { String email; String personal; }
    private static FromParts parseFrom(String from) {
        FromParts fp = new FromParts();
        if (from == null) { fp.email = "no-reply@example.com"; return fp; }
        Matcher m = Pattern.compile("^\\s*(.*?)\\s*<\\s*(.+@.+)\\s*>\\s*$").matcher(from);
        if (m.find()) {
            fp.personal = m.group(1).trim();
            fp.email = m.group(2).trim();
        } else {
            fp.email = from.trim();
        }
        return fp;
    }

    private void sendHtml(String to, String subject, String html) throws Exception {
        MimeMessage mime = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, false, StandardCharsets.UTF_8.name());
        FromParts fp = parseFrom(from);
        if (fp.personal != null && !fp.personal.isEmpty()) helper.setFrom(fp.email, fp.personal);
        else helper.setFrom(fp.email);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(mime);
    }

    private String shell(String title, String bodyInnerHtml) {
        // inline CSS, print-friendly
        String brand = "#0B5FFF", text = "#111827", muted = "#6B7280", border = "#E5E7EB", bg = "#f6f7fb";
        StringBuilder sb = new StringBuilder();
        sb.append("<!doctype html><html><head>")
          .append("<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">")
          .append("<title>").append(esc(title)).append("</title>")
          .append("<style>")
          .append("body{margin:0;background:").append(bg).append(";font-family:Inter,Segoe UI,Arial,sans-serif;color:").append(text).append(";}")
          .append(".container{max-width:720px;margin:24px auto;padding:0 16px;}")
          .append(".card{background:#fff;border:1px solid ").append(border).append(";border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.04);overflow:hidden;}")
          .append(".brandbar{background:").append(brand).append(";color:#fff;padding:14px 18px;font-weight:700;font-size:18px;letter-spacing:.2px;}")
          .append(".content{padding:22px;}")
          .append(".title{font-size:20px;font-weight:800;margin:0 0 12px;}")
          .append(".muted{color:").append(muted).append(";}")
          .append(".row{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 0 0}")
          .append(".pill{background:#f3f4f6;color:#111827;border-radius:999px;padding:6px 10px;font-size:12px;border:1px solid ").append(border).append(";}")
          .append(".hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:6px}")
          .append(".small{font-size:12px;color:").append(muted).append(";line-height:1.5}")
          .append("table{width:100%;border-collapse:collapse;margin-top:12px}")
          .append("th,td{padding:10px 12px;border-bottom:1px dashed ").append(border).append(";text-align:left;font-size:14px}")
          .append("th{color:#374151;font-weight:700;background:#fafafa}")
          .append(".right{text-align:right}")
          .append(".total{font-weight:800}")
          .append(".footer{color:").append(muted).append(";font-size:12px;margin-top:16px;line-height:1.5}")
          .append("@media print{body{background:#fff}.container{margin:0;max-width:none;padding:0}.card{border:none;box-shadow:none}}")
          .append("</style></head><body>")
          .append("<div class=\"container\"><div class=\"card\">")
          .append("<div class=\"brandbar\">").append(esc(brandName)).append("</div>")
          .append("<div class=\"content\">")
          .append(bodyInnerHtml)
          .append("<div class=\"footer\">This is an automated email from ").append(esc(brandName))
          .append(". For help, reply to this email.<br/>© ").append(java.time.Year.now())
          .append(" ").append(esc(brandName)).append(". All rights reserved.</div>")
          .append("</div></div></div></body></html>");
        return sb.toString();
    }

    // ---------- PUBLIC: EMI receipt (HTML; printable) ----------
    public void sendEmiPaidText(EmiPayment emi) {
    try {
        if (emi == null || emi.getLoan() == null || emi.getLoan().getCustomer() == null) {
            System.out.println("[MAIL] Skip EMI receipt: missing data");
            return;
        }

        Loan loan = emi.getLoan();
        User user = loan.getCustomer();
        String to = user.getEmail();
        if (to == null || to.trim().isEmpty()) {
            System.out.println("[MAIL] Skip EMI receipt: recipient email blank for userId=" + user.getUserId());
            return;
        }

        List<EmiPayment> all = emiPaymentRepository.findByLoanOrderByDueDateAsc(loan);
        int totalEmis = all.size();
        int index = -1;
        for (int i = 0; i < totalEmis; i++) {
            if (all.get(i).getId().equals(emi.getId())) {
                index = i;
                break;
            }
        }
        String emiNo = (index >= 0 ? (index + 1) : 1) + " / " + (totalEmis > 0 ? totalEmis : 1);

        BigDecimal monthlyEmi = emi.getAmount();
        BigDecimal totalRepayable = monthlyEmi.multiply(BigDecimal.valueOf(totalEmis)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal principal = loan.getAmount() != null ? loan.getAmount() : BigDecimal.ZERO;
        BigDecimal interestAmt = totalRepayable.subtract(principal);

        String subject = "EMI Payment Receipt — Loan #" + loan.getId();
        String receiptNo = "RCPT-" + String.format("%06d", emi.getId() == null ? 0 : emi.getId());
        String tx = (emi.getTransactionRef() == null || emi.getTransactionRef().isBlank()) ? "—" : esc(emi.getTransactionRef());
        String paidOn = emi.getPaymentDate() != null ? D_ONLY.format(emi.getPaymentDate()) : "—";
        String dueOn = emi.getDueDate() != null ? D_ONLY.format(emi.getDueDate()) : "—";
        String remBal = emi.getRemainingBalance() != null ? inr(emi.getRemainingBalance()) : "—";
        String borrower = (user.getName() != null && !user.getName().trim().isEmpty()) ? esc(user.getName()) : "Customer";
        String rateStr = loan.getAppliedInterestRate() == null ? "—" : String.format("%.2f%%", loan.getAppliedInterestRate());
        String loanName = (loan.getLoanType() != null && loan.getLoanType().getName() != null)
                ? esc(loan.getLoanType().getName()) : "—";

        // HTML layout
        StringBuilder head = new StringBuilder();
        head.append("<div class=\"hdr\" style=\"display:flex;justify-content:space-between;align-items:center;gap:24px;padding:6px 0 12px;\">")
            .append("<div class=\"small\" style=\"letter-spacing:.2px;\">")
              .append("Receipt No. <b>").append(esc(receiptNo)).append("</b>")
            .append("</div>")
            .append("<div class=\"small\" style=\"text-align:right;\">")
              .append("<span class=\"pill\" style=\"background:#E8FFF0;color:#065F46;border-color:#D1FAE5;font-weight:700;margin-left:8px;padding:6px 12px;\">PAID</span>")
            .append("</div>")
          .append("</div>");

        StringBuilder body = new StringBuilder();
        body.append(head)
            .append("<p>Dear ").append(borrower).append(",</p>")
            .append("<p>Thank you for your EMI payment. Below are the transaction details:</p>")
            .append("<table>")
              .append("<tr><th>Transaction Ref ID</th><td>").append(tx).append("</td></tr>")
              .append("<tr><th>Loan ID</th><td>LN").append(String.format("%05d", loan.getId())).append("</td></tr>")
              .append("<tr><th>Loan Name</th><td>").append(loanName).append("</td></tr>")
              .append("<tr><th>EMI No.</th><td>").append(esc(emiNo)).append("</td></tr>")
              .append("<tr><th>EMI Amount</th><td>").append(inr(emi.getAmount())).append("</td></tr>")
              .append("<tr><th>Paid On</th><td>").append(esc(paidOn)).append("</td></tr>")
              .append("<tr><th>Due Date</th><td>").append(esc(dueOn)).append("</td></tr>")
              .append("<tr><th>Status</th><td>PAID</td></tr>")
              .append("<tr><th>Interest (R)</th><td>").append(esc(rateStr)).append("</td></tr>")
              .append("<tr><th>Tenure (T)</th><td>").append(loan.getTenureYears()).append(" years</td></tr>")
              .append("<tr><th>Principal (P)</th><td>").append(inr(principal)).append("</td></tr>")
              .append("<tr><th>Interest amount (I)</th><td>").append(inr(interestAmt)).append("</td></tr>")
              .append("<tr><th>Total repayable (P + I)</th><td class=\"total\">").append(inr(totalRepayable)).append("</td></tr>")
              .append("<tr><th>Remaining balance after this payment</th><td>").append(remBal).append("</td></tr>")
            .append("</table>")
            .append("<p class=\"muted\">This receipt has been recorded in your dashboard for future reference.<br/>")
            .append("For any discrepancies, kindly contact support within 48 hours.</p>");

        String html = shell("EMI Payment Receipt", body.toString());
        sendHtml(to, subject, html);
        System.out.println("[MAIL] EMI receipt (HTML) sent to " + to);

    } catch (Exception e) {
        System.out.println("[MAIL] EMI receipt FAILED: " + e.getMessage());
        e.printStackTrace();
    }
}



// ---------- PUBLIC: Loan closed (NOC-style) HTML; styled same as receipt ----------
public void sendLoanClosedText(Loan loan, BigDecimal totalRepayableIgnored) {
    try {
        if (loan == null || loan.getCustomer() == null) {
            System.out.println("[MAIL] Skip loan-closed: missing data");
            return;
        }
        User user = loan.getCustomer();
        String to = user.getEmail();
        if (to == null || to.trim().isEmpty()) {
            System.out.println("[MAIL] Skip loan-closed: recipient email blank for userId=" + user.getUserId());
            return;
        }

        // --- derive values ---
        String borrower   = (user.getName() != null && !user.getName().trim().isEmpty()) ? esc(user.getName()) : "Customer";
        String loanName   = (loan.getLoanType() != null && loan.getLoanType().getName() != null) ? esc(loan.getLoanType().getName()) : "—";
        BigDecimal principal = loan.getAmount() != null ? loan.getAmount() : BigDecimal.ZERO;

        String appliedOn = loan.getSubmittedAt() != null ? loan.getSubmittedAt().toLocalDate().format(D_LONG) : "—";
        String closedOn  = loan.getClosedAt()   != null ? loan.getClosedAt().toLocalDate().format(D_LONG)   : "—";

        // Count PAID EMIs and sum their amounts
        long totalEmisPaid = emiPaymentRepository.countByLoanAndStatus(loan, com.loanmanagement.model.EmiPayment.EmiStatus.PAID);
        List<com.loanmanagement.model.EmiPayment> emis = emiPaymentRepository.findByLoanOrderByDueDateAsc(loan);
        BigDecimal totalPaidAmount = emis.stream()
                .filter(e -> e.getStatus() == com.loanmanagement.model.EmiPayment.EmiStatus.PAID)
                .map(com.loanmanagement.model.EmiPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Interest rate as nice string (e.g., 7.5%)
        String rateStr = "—";
        if (loan.getAppliedInterestRate() != null) {
            String r = String.format("%.2f", loan.getAppliedInterestRate());
            r = r.replaceAll("\\.?0+$", ""); // trim trailing .00 / .0
            rateStr = r + "%";
        }

        // Tenure in months
        int tenureMonths = Math.max(loan.getTenureYears(), 0) * 12;

        String subject = "Loan Closed — NOC Confirmation for Loan #" + loan.getId();
        String nocNo   = "NOC-" + String.format("%06d", loan.getId() == null ? 0 : loan.getId());

        // Header: left NOC No, right CLOSED pill (same spacing as receipt)
        StringBuilder head = new StringBuilder();
        head.append("<div class=\"hdr\" ")
            .append("style=\"display:flex;justify-content:space-between;align-items:center;gap:24px;padding:6px 0 12px;\">")
            .append("<div class=\"small\" style=\"letter-spacing:.2px;\">")
              .append("NOC No. <b>").append(esc(nocNo)).append("</b>")
            .append("</div>")
            .append("<div class=\"small\" style=\"text-align:right;\">")
              .append("<span class=\"pill\" ")
              .append("style=\"background:#DBEAFE;color:#1E3A8A;border-color:#BFDBFE;font-weight:700;")
              .append("margin-left:8px;padding:6px 12px;\">CLOSED</span>")
            .append("</div>")
          .append("</div>");

        // Body table with requested fields
        StringBuilder body = new StringBuilder();
        body.append(head)
            .append("<p>Dear ").append(borrower).append(",</p>")
            .append("<p>Your loan has been <b>fully repaid</b> and is now <b>closed</b>. Please find the closure details below:</p>")
            .append("<table>")
              .append("<tr><th>Loan ID</th><td>LN").append(String.format("%05d", loan.getId())).append("</td></tr>")
              .append("<tr><th>Loan Name</th><td>").append(loanName).append("</td></tr>")
              .append("<tr><th>Borrower Name</th><td>").append(borrower).append("</td></tr>")
              .append("<tr><th>Loan Amount</th><td>").append(inr(principal)).append("</td></tr>")
              .append("<tr><th>Loan Start Date</th><td>").append(esc(appliedOn)).append("</td></tr>")
              .append("<tr><th>Loan Closed Date</th><td>").append(esc(closedOn)).append("</td></tr>")
              .append("<tr><th>Total EMIs Paid</th><td>").append(totalEmisPaid).append("</td></tr>")
              .append("<tr><th>Interest Rate</th><td>").append(rateStr).append("</td></tr>")
              .append("<tr><th>Tenure</th><td>").append(tenureMonths).append(" months</td></tr>")
              .append("<tr><th>Total Paid Amount</th><td class=\"total\">").append(inr(totalPaidAmount)).append("</td></tr>")
            .append("</table>")
            .append("<p>This is an electronic NOC confirming there are <b>no outstanding liabilities</b> on this loan account.</p>")
            .append("<p class=\"muted\">For any queries, reply to this email.</p>");

        String html = shell("Loan Closed — NOC Confirmation", body.toString());
        sendHtml(to, subject, html);
        System.out.println("[MAIL] Loan-closed (NOC) email sent to " + to);
    } catch (Exception e) {
        System.out.println("[MAIL] Loan-closed mail FAILED: " + e.getMessage());
        e.printStackTrace();
    }
}


}
