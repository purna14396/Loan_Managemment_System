// src/utils/pdfTemplates.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/** ------------ helpers ------------ **/
const AMT = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

const longDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

/** brand */
const BRAND = {
  name: "SmartLend",
  email: "SmartLendLms1@gmail.com",
  contact: "+91 98765 43210",
  addr: "No. 42, Tech Park Lane, Chennai – 600096",
  blue: [3, 61, 107],
  navy: [21, 62, 117],
};

/** layout constants (page + base content width) */
const L = 18;
const R = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const W = PAGE_W - L - R;

/** middle section inner padding (left/right) */
const INNER_PAD = 6;
const ML = L + INNER_PAD;
const MR = R + INNER_PAD;
const MW = PAGE_W - ML - MR;

/** small divider line */
function divider(doc, x1, y, x2, color = 230) {
  doc.setDrawColor(color);
  doc.line(x1, y, x2, y);
}

/** header/footer */
function drawCenteredHeader(doc, subtitle) {
  doc.setFontSize(25);
  doc.setTextColor(3, 61, 107);
  doc.setFont("helvetica", "bold");
  doc.text("SmartLend", 105, 20, { align: "center" });

  doc.setFontSize(15);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 105, 28, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(3, 61, 107);
  doc.text(
    "No. 42, Tech Park Lane, Chennai – 600096 | Contact: +91 98765 43210 | Email: SmartLendLms1@gmail.com",
    105,
    36,
    { align: "center" }
  );

  return 42;
}

function drawFooterSection(doc) {
  const footerY = PAGE_H - 16;
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.blue);
  doc.text(`Email: ${BRAND.email}  |  Contact: ${BRAND.contact}`, L + W / 2, footerY, {
    align: "center",
  });

  doc.setTextColor(110);
  doc.text(
    `© ${new Date().getFullYear()} ${BRAND.name}. System-generated document.`,
    L + W / 2,
    footerY + 5,
    { align: "center" }
  );
}

/** ---------- safe helpers ---------- **/
const coalesce = (...vals) => vals.find((v) => v !== undefined && v !== null);
function nnum(n, fb = null) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fb;
}

/** ---------- robust derivations ---------- **/
function deriveTenureMonths({ pack, loan }) {
  // priority: explicit months → years*12 → count of emis → totalEmis
  return (
    coalesce(pack?.tenureMonths, loan?.tenureMonths) ??
    (nnum(pack?.tenureYears, null) != null ? pack.tenureYears * 12 : null) ??
    (nnum(loan?.tenureYears, null) != null ? loan.tenureYears * 12 : null) ??
    (Array.isArray(pack?.emis) ? pack.emis.length : null) ??
    nnum(loan?.totalEmis, null)
  );
}

function deriveInstallmentNumber({ emi, pack, loan }) {
  let k = coalesce(emi?.installmentNumber, emi?.index, emi?.seq);
  if (nnum(k, null) != null) return Number(k);

  const idKey = coalesce(emi?.id, emi?.emiId);
  const matchIdx = (arr) => {
    if (!Array.isArray(arr)) return -1;
    return arr.findIndex(
      (e) => (coalesce(e?.id, e?.emiId) ?? null) === (idKey ?? null)
    );
  };
  let idx = matchIdx(pack?.emis);
  if (idx === -1) idx = matchIdx(loan?.emis);
  if (idx >= 0) return idx + 1;

  // try dueDate match
  const byDue = (arr) => {
    if (!Array.isArray(arr) || !emi?.dueDate) return -1;
    return arr.findIndex((e) => e?.dueDate === emi.dueDate);
  };
  idx = byDue(pack?.emis);
  if (idx === -1) idx = byDue(loan?.emis);
  if (idx >= 0) return idx + 1;

  // fallback: paid count + 1
  if (Array.isArray(pack?.emis)) {
    const paid = pack.emis.filter((e) => (e?.status ?? "").toUpperCase() === "PAID").length;
    if (paid > 0) return paid + 1;
  }
  return null;
}

/** prefer summing schedule (variable EMIs) over emi * n */
function computeTotals({ pack, emiAmount, tenureMonths, principal }) {
  const P = nnum(principal, null);
  if (P == null) return { totalRepayable: null, totalInterest: null };

  let totalRepayable = null;

  if (Array.isArray(pack?.emis) && pack.emis.length > 0) {
    totalRepayable = pack.emis.reduce(
      (sum, e) => sum + (nnum(e?.amount, 0) ?? 0),
      0
    );
  } else {
    const emi = nnum(emiAmount, null);
    const n = nnum(tenureMonths, null);
    if (emi != null && n != null) totalRepayable = emi * n;
  }

  if (totalRepayable == null) return { totalRepayable: null, totalInterest: null };
  const totalInterest = totalRepayable - P;
  return { totalRepayable, totalInterest };
}

function computeRemainingBalance({ principal, annualRatePercent, tenureMonths, installmentNumber, fallback }) {
  const P = nnum(principal, null);
  const n = nnum(tenureMonths, null);
  const k = nnum(installmentNumber, null);
  const annual = nnum(annualRatePercent, null);

  if (P == null || n == null) return fallback ?? null;
  if (fallback != null) return fallback; // prefer backend-provided value

  if (annual == null || k == null) return null;

  const r = annual / 1200;
  if (r === 0) {
    const paid = Math.min(k, n);
    const remaining = P * (1 - paid / n);
    return remaining < 0 ? 0 : remaining;
  }
  const pow_n = Math.pow(1 + r, n);
  const pow_k = Math.pow(1 + r, k);
  const denom = pow_n - 1;
  if (denom === 0) return null;
  const remaining = (P * (pow_n - pow_k)) / denom;
  return remaining < 0 ? 0 : remaining;
}

/** ------------ RECEIPT (3 sections) ------------ **/
export function generateEmiReceiptPDF(emi, loan, pack) {
  const doc = new jsPDF("p", "mm", "a4");

  // Section 1
  let y = drawCenteredHeader(doc, "EMI Payment Receipt");
  y += 20;

  // Section 2 header bar
  const headingHeight = 9;
  doc.setFillColor(...BRAND.navy);
  doc.rect(ML, y, MW, headingHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("EMI Payment Receipt", ML + MW / 2, y + headingHeight - 2.5, { align: "center" });

  y += headingHeight + 3;
  divider(doc, ML, y, ML + MW, 215);
  y += 8;

  // body text
  doc.setTextColor(33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const userName =
    loan?.customer?.fullName ||
    loan?.customer?.name ||
    loan?.customerName ||
    "Customer";

  doc.text(`Dear ${userName},`, ML + 2, y);
  y += 6;
  doc.text("Thank you for your EMI payment. Below are the transaction details:", ML + 2, y);
  y += 8;

  // inputs
  const loanId = `LN${String(loan?.id ?? loan?.loanId ?? "").padStart(5, "0")}`;
  const emiAmountNum = nnum(emi?.amount, null);
  const paidOn = longDate(emi?.paymentDate);
  const status = (emi?.status || "-").toString().toUpperCase();

  const principal = nnum(coalesce(pack?.amount, loan?.amount), 0);

  // use appliedInterestRate first (matches your table), then other names
  const interestRate =
    nnum(coalesce(pack?.appliedInterestRate, loan?.appliedInterestRate, pack?.interestRate, loan?.interestRate), null);

  const tenureMonths = deriveTenureMonths({ pack, loan });
  const installmentNumber = deriveInstallmentNumber({ emi, pack, loan });
  const emiNoDisplay =
    installmentNumber != null && tenureMonths != null
      ? `${installmentNumber} / ${tenureMonths}`
      : installmentNumber != null
      ? String(installmentNumber)
      : tenureMonths != null
      ? `- / ${tenureMonths}`
      : "-";

  // totals (sum schedule if present)
  const { totalRepayable, totalInterest } = computeTotals({
    pack,
    emiAmount: emiAmountNum,
    tenureMonths,
    principal,
  });

  const directRemaining = coalesce(emi?.remainingBalance, emi?.balanceAfter, pack?.remainingBalance, null);
  const remainingAfter = computeRemainingBalance({
    principal,
    annualRatePercent: interestRate,
    tenureMonths,
    installmentNumber,
    fallback: directRemaining,
  });

  // table
  const bodyRows = [
    ["Receipt No.", `RCPT-${String(emi?.id ?? 0).padStart(6, "0")}`],
    ["Transaction Ref ID", emi?.transactionRef || "-"],  // ✅ Added
    ["Loan ID", loanId],
    ["EMI No.", emiNoDisplay],
    ["EMI Amount", emiAmountNum != null ? AMT(emiAmountNum) : "-"],
    ["Paid On", paidOn],
    ["Status", status],
    ["Interest", interestRate != null ? `${interestRate}%` : "-"],
    ["Tenure", tenureMonths != null ? `${tenureMonths} months` : "-"],
    ["Principal", AMT(principal)],
    ["Interest amount", totalInterest != null ? AMT(totalInterest) : "-"],
    ["Total repayable amount", totalRepayable != null ? AMT(totalRepayable) : "-"],
    [
      "Remaining balance after this payment",
      remainingAfter != null ? AMT(remainingAfter) : "-",
    ],
  ];

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: {
        fontSize: 11,
        cellPadding: 3.2,
        textColor: [31, 41, 55],
        fillColor: [240, 243, 245], // ✅ very light blue background
    },
    columnStyles: {
        0: { cellWidth: 70, fontStyle: "bold" },
        1: { cellWidth: MW - 70, halign: "right" },
    },
    body: bodyRows,
    didDrawRow: (data) => {
        const yy = data.cursor.y + 1;
        divider(doc, ML, yy, ML + MW, 235);
    },
    margin: { left: ML, right: MR },
    });


  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // centered notes
  doc.setTextColor(90);
  doc.setFontSize(10.5);
  doc.text(
    "This receipt has been recorded in your dashboard for future reference.",
    ML + MW / 2,
    y,
    { align: "center" }
  );
  y += 5;
  doc.text(
    "For any discrepancies, kindly contact support within 48 hours.",
    ML + MW / 2,
    y,
    { align: "center" }
  );
  y += 10;

  // Section 3
  drawFooterSection(doc);

  doc.save(`RCPT-${String(emi?.id ?? 0).padStart(6, "0")}.pdf`);
}

/** ------------ NOC (styled same as receipt) ------------ **/
export function generateLoanNocPDF(loan, pack, emis = []) {
  const doc = new jsPDF("p", "mm", "a4");

  // Section 1 — shared header
  let y = drawCenteredHeader(doc, "No Objection Certificate");
  y += 10; // same spacing buffer as receipt

  // Section 2 — dark bar heading exactly like receipt
  const headingHeight = 9;
  doc.setFillColor(...BRAND.navy);
  doc.rect(ML, y, MW, headingHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("No Objection Certificate", ML + MW / 2, y + headingHeight - 2.5, { align: "center" });

  y += headingHeight + 3;
  divider(doc, ML, y, ML + MW, 215);
  y += 8;

  // Body copy — use the same text styling palette as receipt
  doc.setTextColor(33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const borrower =
    loan?.customer?.fullName ||
    loan?.customer?.name ||
    loan?.customerName ||
    "Customer";

  const loanId = `LN${String(loan?.id ?? loan?.loanId ?? "").padStart(5, "0")}`;
  const principal = Number(pack?.amount || loan?.amount || 0);

  const startDate = loan?.submittedAt
  ? new Date(loan.submittedAt)
  : emis?.length > 0
    ? new Date(emis[0]?.dueDate)
    : null;


  const lastPayment = emis
    .filter((e) => e?.paymentDate)
    .sort((a, b) => (a.paymentDate || "").localeCompare(b.paymentDate || "")) // ISO ok
    .slice(-1)[0]?.paymentDate;

  const closedDate = loan?.closedAt || lastPayment || new Date().toISOString();

  // Paragraphs (justify + same margins)
  const p1 =
    `This is to certify that ${borrower}, holder of Loan ID ${loanId}, has successfully repaid the entire loan ` +
    `amount as per the scheduled EMI plan. The loan was initiated on ${longDate(startDate)} and closed on ` +
    `${longDate(closedDate)}. All dues are cleared and there are no outstanding liabilities on this account.`;
  doc.text(p1, ML, y, { maxWidth: MW, align: "justify" });
  y += 18;

  const p2 =
    "Accordingly, we issue this No Objection Certificate (NOC) confirming that we have no objection to the " +
    "closure of the loan account and the borrower’s disengagement from this contract.";
  doc.text(p2, ML, y+2, { maxWidth: MW, align: "justify" });
  y += 12;

  // Summary table — identical style to receipt (plain theme, light blue fill, bold left col, right-aligned values)
  const paidEmis = emis.filter((e) => (e?.status ?? "").toUpperCase() === "PAID").length;
  
  
  
  const emiAmountNum = nnum(coalesce(pack?.emiAmount, loan?.emiAmount), null);
    const interestRate = nnum(
        coalesce(pack?.appliedInterestRate, loan?.appliedInterestRate, pack?.interestRate, loan?.interestRate),
        null
    );
    const tenureMonths = deriveTenureMonths({ pack, loan });
    const { totalRepayable } = computeTotals({
        pack,
        emiAmount: emiAmountNum,
        tenureMonths,
        principal,
    });

    const body = [
        ["Loan ID", loanId],
        ["Borrower Name", borrower],
        ["Loan Amount", AMT(principal)],
        ["Loan Start Date", longDate(startDate)],
        ["Loan Closed Date", longDate(closedDate)],
        ["Total EMIs Paid", String(paidEmis || emis.length || 0)],
        ["Interest Rate", interestRate != null ? `${interestRate}%` : "-"],
        ["Tenure", tenureMonths != null ? `${tenureMonths} months` : "-"],
        ["Total Paid Amount", totalRepayable != null ? AMT(totalRepayable) : "-"],
    ];

  

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: {
      fontSize: 11,
      cellPadding: 3.2,
      textColor: [31, 41, 55],
      fillColor: [240, 243, 245], // very light blue background (same vibe as receipt)
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: MW - 70, halign: "right" },
    },
    body,
    didDrawRow: (data) => {
      const yy = data.cursor.y + 1;
      divider(doc, ML, yy, ML + MW, 235);
    },
    margin: { left: ML, right: MR },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // Centered notes — match receipt style
  doc.setTextColor(90);
  doc.setFontSize(10.5);
  doc.text(
    "This NOC is issued after full and final settlement of the loan account.",
    ML + MW / 2,
    y,
    { align: "center" }
  );
  y += 5;
  doc.text(
    "For any queries, please reach out to our support team within 15 days of issuance.",
    ML + MW / 2,
    y,
    { align: "center" }
  );
  y += 12;

  // Authorization block (clean, no outer border to match your ‘no border’ preference)
  doc.setTextColor(...BRAND.blue);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const authX = ML + MW - 60;
  const authY = y + 9;
  doc.text("Authorized By:", authX + 5, authY);
  
    doc.setFont("courier", "italic"); // or "times", "helvetica", "courier"
    doc.setFontSize(14); // make it slightly bigger like a signature
    doc.text("SmartLendOfficer", authX + 20, authY + 13, { align: "center" });

  
  divider(doc, authX, authY + 17, authX + 40);
  doc.setFont("helvetica", "bold");
  doc.text("Loan Officer / Administrator", authX + 20, authY + 22, { align: "center" });

  // Section 3 — shared footer
  drawFooterSection(doc);

  doc.save(`NOC_${String(loan?.id ?? 0).padStart(6, "0")}.pdf`);
}
