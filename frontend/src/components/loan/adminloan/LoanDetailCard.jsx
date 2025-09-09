import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../../styles/loan/adminloan/LoanDetailCard.css";

function LoanDetailCard({ loan, onClose }) {
  if (!loan) return null;

  // 🔁 EMI Calculation
  const interestRate = loan.appliedInterestRate || 0;


  const tenureMonths = loan.tenureYears * 12;
  const principal = loan.amount || 0;
  const monthlyRate = interestRate / 12 / 100;

  const emi = tenureMonths
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    : 0;

  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;

  // 💰 Currency Formatter
  const formatCurrency = (value) =>
    isNaN(value) ? "0" : Number(value).toLocaleString("en-IN");
  
  const parseIncomeToNumber = (incomeStr) => {
    if (!incomeStr) return 0;

    const cleaned = incomeStr.replace(/[,₹$]/g, "").trim();

    // Example: "< $ 30,000" or "<30000"
    if (cleaned.startsWith("<")) {
      const match = cleaned.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }

    // Example: "> $ 1,00,000"
    if (cleaned.startsWith(">")) {
      const match = cleaned.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }

    // Example: "$ 40,000 - $ 75,000"
    if (cleaned.includes("-")) {
      const parts = cleaned.split("-").map((p) => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return Math.round((parts[0] + parts[1]) / 2);
      }
    }

    // Example: "45000" or "₹45000"
    const match = cleaned.match(/\d+/g);
    return match ? parseInt(match.join("")) : 0;
  };


  const sanitize = (val) => val ?? "N/A";

  // 📄 PDF Generation
  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(25);
    doc.setTextColor(3, 61, 107);
    doc.setFont("helvetica", "bold");
    doc.text("SmartLend", 105, 20, { align: "center" });

    doc.setFontSize(15);
    doc.setFont("helvetica", "normal");
    doc.text("Loan Application Summary", 105, 28, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(3, 61, 107);
    doc.text(
      "No. 42, Tech Park Lane, Chennai – 600096 | Contact: +91 98765 43210 | Email: SmartLendLms1@gmail.com",
      105,
      36,
      { align: "center" }
    );

    const startY = 50;

    const personal = [
      ["Applicant Name", sanitize(loan.customer?.name)],
      ["Email", sanitize(loan.customer?.email)],
      ["Contact No", sanitize(loan.customer?.contactNumber)],
      ["City", sanitize(loan.customer?.city)],
      ["Pincode", sanitize(loan.customer?.pincode)],
      ["Employment Type", getEmploymentType(loan.employmentInfo)],

      ["Monthly Income", formatCurrency(parseIncomeToNumber(loan.income))],


      ["PAN", sanitize(loan.pan)],
      ["Aadhaar", sanitize(loan.aadhaar)],
    ];

    const loanInfo = [
      ["Loan ID", `LN${String(loan.id).padStart(3, "0")}`],

      ["Loan Type", sanitize(loan.loanType)],

      ["Principal Amount", `${formatCurrency(principal)}`],
      ["Tenure", `${loan.tenureYears} Years`],
      ["Interest Rate", `${interestRate}%`],
      ["Purpose", sanitize(loan.purpose)],
      ["Status", sanitize(loan.loanStatus)],
      ["CIBIL Score", sanitize(loan.cibilScore)],
      [
        "Submitted On",
        loan.submittedAt
          ? new Date(loan.submittedAt).toLocaleDateString("en-IN")
          : "N/A",
      ],
    ];

    const maxRows = Math.max(personal.length, loanInfo.length);
    const combinedRows = [];

    for (let i = 0; i < maxRows; i++) {
      const p = personal[i] || ["", ""];
      const l = loanInfo[i] || ["", ""];
      combinedRows.push([sanitize(p[0]), sanitize(p[1]), sanitize(l[0]), sanitize(l[1])]);
    }

    autoTable(doc, {
      startY: startY + 6,
      head: [["Personal Info", "", "Loan Info", ""]],
      body: combinedRows,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: "middle",
        textColor: [30, 30, 30],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [3, 61, 107],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 46 },
        1: { cellWidth: 45 },
        2: { fontStyle: "bold", cellWidth: 46 },
        3: { cellWidth: 45 },
      },
      alternateRowStyles: {
        fillColor: [245, 248, 255],
      },
      tableLineColor: 200,
      tableLineWidth: 0.2,
    });

    const emiInfo = [
      ["Monthly EMI", `${formatCurrency(emi)}`],
      ["Total EMIs", `${tenureMonths}`],
      ["Total Interest", `${formatCurrency(totalInterest)}`],
      ["Total Payable (P + I)", `${formatCurrency(totalPayable)}`],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["EMI Info", ""]],
      body: emiInfo,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [3, 61, 107],
        textColor: 255,
        halign: "center",
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70 },
        1: { cellWidth: 100 },
      },
    });

    const h = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Generated by SmartLend | © 2025 SmartLend Pvt Ltd",
      105,
      h - 30,
      { align: "center" }
    );
    doc.text("Email: SmartLendLms1@gmail.com", 105, h - 25, {
      align: "center",
    });

    doc.save(`Loan_Application_${loan.id}.pdf`);
  };

  const getEmploymentType = (info) => {
    return info?.trim() || "N/A";
  };


  return (
    <div className="loan-detail-card">
      <h3>Loan Application Details</h3>

      <h4 className="section-heading">Personal Info</h4>
      <div className="loan-detail-form">
        <div className="loan-field-line">
          <span className="loan-field-label">Name:</span>
          <span className="loan-field-value">{sanitize(loan.customer?.name)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Email:</span>
          <span className="loan-field-value">{sanitize(loan.customer?.email)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Contact:</span>
          <span className="loan-field-value">{sanitize(loan.customer?.contactNumber)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">City:</span>
          <span className="loan-field-value">{sanitize(loan.customer?.city)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Pincode:</span>
          <span className="loan-field-value">{sanitize(loan.customer?.pincode)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Employment:</span>
          <span className="loan-field-value">{getEmploymentType(loan.employmentInfo)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Monthly Income:</span>
          
          <span className="loan-field-value">{sanitize(loan.income)}</span>

        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">PAN:</span>
          <span className="loan-field-value">{sanitize(loan.pan)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Aadhaar:</span>
          <span className="loan-field-value">{sanitize(loan.aadhaar)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">CIBIL Score:</span>
          <span className="loan-field-value">{sanitize(loan.cibilScore)}</span>
        </div>
      </div>

      <h4 className="section-heading">Loan Info</h4>
      <div className="loan-detail-form">
        <div className="loan-field-line">
          <span className="loan-field-label">Loan ID:</span>
          <span className="loan-field-value">{`LN${String(loan.id).padStart(3, "0")}`}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Loan Type:</span>
          <span className="loan-field-value">{sanitize(loan.loanType)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Loan Amount:</span>
          <span className="loan-field-value">₹ {formatCurrency(principal)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Tenure:</span>
          <span className="loan-field-value">{loan.tenureYears} Years</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Interest Rate:</span>
          <span className="loan-field-value">{interestRate}%</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Purpose:</span>
          <span className="loan-field-value">{sanitize(loan.purpose)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Status:</span>
          <span className="loan-field-value">{sanitize(loan.loanStatus)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Submitted On:</span>
          <span className="loan-field-value">
            {loan.submittedAt
              ? new Date(loan.submittedAt).toLocaleString("en-IN")
              : "N/A"}
          </span>
        </div>
      </div>

      <h4 className="section-heading">EMI Info</h4>
      <div className="loan-detail-form">
        <div className="loan-field-line">
          <span className="loan-field-label">Monthly EMI:</span>
          <span className="loan-field-value">₹ {formatCurrency(emi)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Total EMIs:</span>
          <span className="loan-field-value">{tenureMonths}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Total Interest:</span>
          <span className="loan-field-value">₹ {formatCurrency(totalInterest)}</span>
        </div>
        <div className="loan-field-line">
          <span className="loan-field-label">Total Payable (P + I):</span>
          <span className="loan-field-value">₹ {formatCurrency(totalPayable)}</span>
        </div>
      </div>

      <div className="loan-detail-btns">
        <button onClick={downloadPDF}>Download as PDF</button>
      </div>
    </div>
  );
}

export default LoanDetailCard;
