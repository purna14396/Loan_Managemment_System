// src/components/emi/EmiPaymentsPage.jsx

import { useEffect, useMemo, useRef, useState } from "react";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCustomerLoans, getLoanWithEmis, payEmi } from "../../services/emiService";
import "../../styles/emi/EmiPayments.css";
import EmiTable from "./EmiTable";

import { useLocation } from "react-router-dom";



export default function EmiPaymentsPage() {
  const { state } = useLocation();            // ✅ use hook inside component
  const preselectLoanId = state?.loanId ?? null; // ✅ safely read loanId

  const [loans, setLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState({}); // loanId -> LoanWithEmiDto
  const [loading, setLoading] = useState(true);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [loanType, setLoanType] = useState("ALL");
  const [emiStatus, setEmiStatus] = useState("ALL");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  // mobile filter panel
  const [showFilters, setShowFilters] = useState(false);



  useEffect(() => {
    (async () => {
      try {
        const list = await getCustomerLoans();
        setLoans(list || []);
        const packs = {};
        await Promise.all(
          (list || []).map(async (ln) => {
            const d = await getLoanWithEmis(ln.id);
            packs[ln.id] = d;
          })
        );
        setLoanDetails(packs);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load EMI data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  
  
  // one-time scroll to the selected loan, then clear state so it won't repeat
  const didScrollRef = useRef(false);

  useEffect(() => {
    if (!loading && preselectLoanId && !didScrollRef.current) {
      const el = document.getElementById(`loan-${preselectLoanId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("pulse-focus");
        setTimeout(() => el.classList.remove("pulse-focus"), 1200);
      }
      didScrollRef.current = true; // ✅ prevents re-scroll after payment refresh
    }
  }, [loading, preselectLoanId]);


  const loanTypeOptions = useMemo(() => {
    const set = new Set((loans || []).map((l) => l.loanType?.name || l.loanType || "Other"));
    return ["ALL", ...Array.from(set)];
  }, [loans]);

  // top-level loan filters (which loan cards appear)
  // top-level loan filters (which loan cards appear)
  const filteredLoans = useMemo(() => {
    let arr = [...(loans || [])];

    // ✅ Hide rejected loans completely
    arr = arr.filter(
      (ln) => ln.loanStatus !== "REJECTED" && ln.loanStatus !== "SUBMITTED"
    );


    if (loanType !== "ALL") {
      arr = arr.filter((ln) => (ln.loanType?.name || ln.loanType) === loanType);
    }
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      arr = arr.filter((ln) => {
        const idStr = String(ln.id);
        const nameStr = String(ln.loanType?.name || ln.loanType || "");
        return idStr.includes(s) || nameStr.toLowerCase().includes(s);
      });
    }
    return arr;
  }, [loans, loanType, searchTerm]);


  const grouped = useMemo(() => {
    const map = {};
    filteredLoans.forEach((ln) => {
      const key = ln.loanType?.name || ln.loanType || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(ln);
    });
    return map;
  }, [filteredLoans]);

  // pay handler – refetch the pack after payment for consistency
  const handlePay = async (emi, loanId) => {
    try {
      // toast.info("Processing payment...", { autoClose: 1200 });
      await payEmi(emi.id);
      const fresh = await getLoanWithEmis(loanId);
      setLoanDetails((prev) => ({ ...prev, [loanId]: fresh }));
      toast.success("EMI paid successfully");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Payment failed");
    }
  };


  const clearFilters = () => {
    setSearchTerm("");
    setLoanType("ALL");
    setEmiStatus("ALL");
    setDueFrom("");
    setDueTo("");
    toast.info("Filters cleared");
  };

  if (loading) {
    return (
      <div className="emi-page">
        <div className="loading">Loading EMIs…</div>
      </div>
    );
  }

  const loanCount = filteredLoans.length;
  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div className="emi-page">
      <ToastContainer position="top-center" autoClose={1800} />

      {/* Mobile toggle */}
      <button
        className="emi2-toggle-filters-btn"
        onClick={() => setShowFilters((s) => !s)}
      >
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>

      {/* Fixed Filter Bar */}
      <div className={`emi2-filter-fixed ${showFilters ? "open" : ""}`}>
        <div className="emi2-filter-card">
          <div className="emi2-filter-group">
            <label>Search Applications</label>
            <input
              type="text"
              placeholder="Loan ID or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="emi2-filter-input"
            />
          </div>

          <div className="emi2-filter-group">
            <label>Loan Type</label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className="emi2-filter-input"
            >
              {loanTypeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="emi2-filter-group">
            <label>EMI Status</label>
            <select
              value={emiStatus}
              onChange={(e) => setEmiStatus(e.target.value)}
              className="emi2-filter-input"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="LATE">Late</option>
            </select>
          </div>

          <div className="emi2-filter-group">
            <label>Due From</label>
            <input
              type="date"
              max={todayISO}
              value={dueFrom}
              onChange={(e) => setDueFrom(e.target.value)}
              className="emi2-filter-input"
            />
          </div>

          <div className="emi2-filter-group">
            <label>Due To</label>
            <input
              type="date"
              max={todayISO}
              value={dueTo}
              onChange={(e) => setDueTo(e.target.value)}
              className="emi2-filter-input"
            />
          </div>

          {(searchTerm || loanType !== "ALL" || emiStatus !== "ALL" || (dueFrom && dueTo)) && (
            <div className="emi2-filter-group-button">
              <button onClick={clearFilters} className="emi2-filter-clear-btn">Clear Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Topbar (badges + heading) */}
      <div className="emi2-topbar-fixed">
        <div className="emi2-active-filter-tags">
          {loanType !== "ALL" && <span className="emi2-filter-badge">Loan Type: {loanType}</span>}
          {emiStatus !== "ALL" && (
            <span className="emi2-filter-badge">
              EMI Status: {emiStatus.charAt(0) + emiStatus.slice(1).toLowerCase()}
            </span>
          )}
          {searchTerm && <span className="emi2-filter-badge">Search: “{searchTerm}”</span>}
          {dueFrom && dueTo && <span className="emi2-filter-badge">Due: {dueFrom} to {dueTo}</span>}
        </div>

        <div className="emi2-section-header-wrapper">
          <h2 className="emi2-section-heading">EMI & Payments</h2>
          <p className="emi2-count-label">Showing {loanCount} {loanCount === 1 ? "loan" : "loans"}</p>
        </div>
      </div>

      {/* ===== ONLY this area scrolls ===== */}
      <div className="emi2-content-scroll">
        {Object.entries(grouped).map(([loanTypeName, loanArr]) => (
          <div className="emi2-type-block" key={loanTypeName}>
            {loanArr.map((ln) => (
              <div className="emi2-loan-card-and-table" key={ln.id} id={`loan-${ln.id}`}>
                <div className="emi2-admin-table-wrapper">
                  <div className="emi2-admin-table-scroll">
                    <EmiTable
                      loan={ln}
                      pack={loanDetails[ln.id]}
                      onPay={handlePay}
                      rowStatusFilter={emiStatus}
                      rowDueFrom={dueFrom}
                      rowDueTo={dueTo}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {loanCount === 0 && <div className="empty">No loans matched your filters.</div>}
      </div>
    </div>
  );
}
