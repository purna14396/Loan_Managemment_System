// src/components/emi/EmiTable.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { generateEmiReceiptPDF, generateLoanNocPDF } from "../../utils/pdfTemplates";
import "../../styles/emi/EmiTable.css";

function formatMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n));
}
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
const loanRef = (id) => `ln${String(id).padStart(3, "0")}`;

/**
 * Choose a stable ordering for EMIs:
 * 1) If emiNumber exists, use it (ascending)
 * 2) else by dueDate (ascending)
 * 3) fallback: by id (ascending)
 */
function orderEmis(emis) {
  const copy = [...(emis ?? [])];
  copy.sort((a, b) => {
    if (a.emiNumber != null && b.emiNumber != null) return a.emiNumber - b.emiNumber;
    if (a.dueDate && b.dueDate) return String(a.dueDate).localeCompare(String(b.dueDate));
    return Number(a.id) - Number(b.id);
  });
  return copy;
}

export default function EmiTable({
  loan,
  pack,
  onPay,
  rowStatusFilter = "ALL",
  rowDueFrom = "",
  rowDueTo = "",
}) {
  const [showAll, setShowAll] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const scrollBodyRef = useRef(null);
  const firstPendingRef = useRef(null);

  const emisRaw = useMemo(() => pack?.emis ?? [], [pack?.emis]);
  const emis = useMemo(() => orderEmis(emisRaw), [emisRaw]);

  // summary
  const paidCount = useMemo(() => emis.filter((e) => e.status === "PAID").length, [emis]);
  const lastPaid = useMemo(() => {
    const paid = emis.filter((e) => e.status === "PAID");
    if (!paid.length) return null;
    // latest by paymentDate or by emiNumber
    const ordered = orderEmis(paid);
    return ordered[ordered.length - 1].paymentDate || null;
  }, [emis]);

  const totalPayable = useMemo(
    () => emis.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [emis]
  );
  const principal = Number(pack?.amount || loan.amount || 0);
  const interestAmount = Math.max(0, totalPayable - principal);
  const remainingAfterPaid = Number(pack?.remainingAmount || 0);

  const isCleared = useMemo(() => {
    const noBalance = remainingAfterPaid <= 0.000001;
    const allPaid = emis.length > 0 && paidCount === emis.length;
    return (noBalance && allPaid) || loan?.loanStatus === "CLOSED";
  }, [remainingAfterPaid, paidCount, emis.length, loan?.loanStatus]);

  // --- CORE RULE: find the next payable (first non-PAID) from the FULL schedule ---
  const nextPayableEmiId = useMemo(() => {
    const next = emis.find((r) => r.status !== "PAID");
    return next ? next.id : null;
  }, [emis]);

  // Filtering for display only (does NOT change nextPayableEmiId)
  const filteredRows = useMemo(() => {
    let rows = emis;
    if (rowStatusFilter !== "ALL") {
      rows = rows.filter((row) => row.status === rowStatusFilter);
    }
    if (rowDueFrom) {
      const from = new Date(rowDueFrom);
      rows = rows.filter((row) => (row.dueDate ? new Date(row.dueDate) >= from : true));
    }
    if (rowDueTo) {
      const to = new Date(rowDueTo);
      rows = rows.filter((row) => (row.dueDate ? new Date(row.dueDate) <= to : true));
    }
    return rows;
  }, [emis, rowStatusFilter, rowDueFrom, rowDueTo]);

  // index of first unpaid in the filtered list (for auto-scroll focus)
  const firstPendingIndex = useMemo(() => {
    const idx = filteredRows.findIndex((r) => r.status !== "PAID");
    return idx === -1 ? 0 : idx;
  }, [filteredRows]);

  // windowing for compact view
  const startIndex = useMemo(
    () => (showAll ? 0 : Math.max(0, firstPendingIndex - 1)),
    [showAll, firstPendingIndex]
  );
  const endIndex = useMemo(
    () => (showAll ? filteredRows.length : Math.min(filteredRows.length, startIndex + 3)),
    [showAll, filteredRows.length, startIndex]
  );
  const visible = useMemo(
    () => filteredRows.slice(startIndex, endIndex),
    [filteredRows, startIndex, endIndex]
  );

  // Auto-scroll to first unpaid when "Show All" opens
  useEffect(() => {
    if (showAll && firstPendingRef.current && scrollBodyRef.current) {
      firstPendingRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAll, filteredRows]);

  const handlePayClick = async (row) => {
    // Double-check on click (front-end hard gate)
    const isPayableNow = row?.status === "PENDING" && row?.id === nextPayableEmiId;
    if (!isPayableNow) {
      // Use your toast if available; fallback to alert
      if (window?.toast) {
        window.toast.error("Please pay EMIs in order. Pay the earliest pending EMI first.");
      } else {
        alert("Please pay EMIs in order. Pay the earliest pending EMI first.");
      }
      return;
    }
    try {
      setPayingId(row.id);
      await onPay(row, loan.id); // backend should enforce the same rule too
    } finally {
      setPayingId(null);
    }
  };

  const handleDownloadReceipt = (emiRow) => {
    generateEmiReceiptPDF(emiRow, loan, pack);
  };

  const handleDownloadNoc = () => {
    generateLoanNocPDF(loan, pack, emis);
  };

  const appliedOn = loan?.submittedAt
    ? new Date(loan.submittedAt).toLocaleDateString("en-IN")
    : "-";

  return (
    <div className="emi-card">
      {/* ===== Loan Summary ===== */}
      <div className="emi-summary">
        <h3 className="emi-loan-title">
          {loan.loanType?.name || loan.loanType}
          {isCleared && <span className="loan-cleared-badge">Loan Cleared</span>}
          {isCleared && (
            <button className="pay-btn noc-btn" onClick={handleDownloadNoc}>
              Download NOC
            </button>
          )}
        </h3>

        <div className="emi-summary-compact">
          <div>Loan ID: {loanRef(loan.id)}</div>
          <div>
            Tenure &amp; Interest:&nbsp;
            {(pack?.tenureYears ?? loan.tenureYears) ?? "N/A"} yr -{" "}
            {(pack?.appliedInterestRate ?? loan.appliedInterestRate) ?? "N/A"}%
          </div>
          <div>Amount: ₹{formatMoney(principal)}</div>
          <div>Total Payable: ₹{formatMoney(totalPayable)}</div>
          <div>Applied on: {appliedOn}</div>
          <div>Last Paid: {fmtDate(lastPaid)}</div>
          <div>Interest: ₹{formatMoney(interestAmount)}</div>
          <div>Remaining: ₹{formatMoney(remainingAfterPaid)}</div>
        </div>
      </div>

      {/* ===== EMI Table ===== */}
      {loan?.loanStatus !== "REJECTED" && (
        <div className="emi-table-wrapper">
          <div className="emi-scroll-body" ref={scrollBodyRef}>
            <table className="emi-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>EMI_id</th>
                  <th>EMI Amt (₹)</th>
                  <th>Due Date</th>
                  <th>
                    Status{" "}
                    <span className="paid-inline-th">
                      (Paid: {paidCount}/{emis.length})
                    </span>
                  </th>
                  <th>Payment Date</th>
                  <th>Transaction Reference Id</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e, idx) => {
                  const realIndex = startIndex + idx;
                  const isFirstPendingInFiltered = realIndex === firstPendingIndex;
                  const isPayableNow = e.status === "PENDING" && e.id === nextPayableEmiId;
                  const isFutureLocked = e.status === "PENDING" && e.id !== nextPayableEmiId;

                  return (
                    <tr
                      key={e.id}
                      ref={isFirstPendingInFiltered ? firstPendingRef : null}
                      className={isFutureLocked ? "locked-row" : undefined}
                      title={
                        isFutureLocked
                          ? "Pay EMIs sequentially. Settle the earliest pending EMI first."
                          : undefined
                      }
                    >
                      <td>{e.emiNumber ?? realIndex + 1}</td>
                      <td>{e.id}</td>
                      <td>{formatMoney(e.amount)}</td>
                      <td>{fmtDate(e.dueDate)}</td>
                      <td className="status-cell">
                        <span className={`badge ${e.status.toLowerCase()}`}>{e.status}</span>
                      </td>
                      <td>{fmtDate(e.paymentDate)}</td>
                      <td className="txn">{e.transactionRef || "-"}</td>
                      <td>
                        {e.status === "PENDING" ? (
                          <button
                            className={`pay-btn ${payingId === e.id ? "disabled" : ""} ${!isPayableNow ? "locked" : ""}`}
                            onClick={() => isPayableNow && handlePayClick(e)}
                            disabled={payingId === e.id || !isPayableNow}
                          >
                            {payingId === e.id ? "Paying…" : isPayableNow ? "Pay" : "Pay (locked)"}
                          </button>
                        ) : (
                          <button className="pay-btn" onClick={() => handleDownloadReceipt(e)}>
                            Download receipt
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">
                      No EMIs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loan?.loanStatus === "REJECTED" && (
        <div className="empty" style={{ padding: "15px", textAlign: "center" }}>
          Loan is rejected — no EMI schedule available.
        </div>
      )}

      {filteredRows.length > 3 && (
        <div className="emi-more">
          <button className="toggle-btn" onClick={() => setShowAll((s) => !s)}>
            {showAll ? "Show Less" : "Show All"}
          </button>
        </div>
      )}
    </div>
  );
}
