import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  FaEye,
  FaThumbsDown,
  FaThumbsUp,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import "../../../styles/loan/adminloan/AdminLoanList.css";



import { FiCheckCircle, FiLock, FiSend, FiXCircle } from "react-icons/fi";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoanDetailCard from "../adminloan/LoanDetailCard";

const AdminLoanList = () => {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loanIdToDelete, setLoanIdToDelete] = useState(null);
  
  const [actionModal, setActionModal] = useState({ open: false, loan: null, status: "" });
  const [actionComment, setActionComment] = useState("");
  
  const [loanTypes, setLoanTypes] = useState([]);

  
  const token = localStorage.getItem("token");

  const fetchLoans = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/admin/loans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoans(res.data);
    } catch (err) {
      toast.error("Failed to fetch loans");
    }
  }, [token]);
  
  useEffect(() => {
    const fetchLoanTypes = async () => {
      try {
        const res = await axios.get("http://localhost:8081/api/admin/loan-types", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoanTypes(res.data);
      } catch (err) {
        toast.error("Failed to load loan types");
      }
    };

    fetchLoanTypes();
  }, [token]);


  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      const filterBox = document.querySelector(".admin-loan-filter-fixed");
      const toggleBtn = document.querySelector(".admin-toggle-filters-btn");

      if (
        showFilters &&
        filterBox &&
        !filterBox.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        setShowFilters(false);
      }
    };
    
    

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  useEffect(() => {
    let updated = [...loans];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().replace("ln", "");
      updated = updated.filter((loan) => {
        const loanIdMatch = `ln00${loan.id}`.includes(searchTerm.toLowerCase());
        const idMatch = loan.id?.toString().includes(term);
        const typeMatch = loan.loanType?.toLowerCase().includes(term);
        const nameMatch = loan.customerName?.toLowerCase().includes(term);
        return loanIdMatch || idMatch || typeMatch || nameMatch;
      });
    }
    
    


    if (statusFilter !== "All") {
      updated = updated.filter((loan) => loan.loanStatus === statusFilter);
    }

    if (typeFilter !== "All") {
      updated = updated.filter((loan) => loan.loanType === typeFilter);
    }

    if (sortBy === "amount") {
      updated.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "date") {
      updated.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      );
    }

    setFilteredLoans(updated);
  }, [loans, searchTerm, statusFilter, typeFilter, sortBy]);


  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/api/admin/loans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.error(
        `Loan LN00${id} deleted`,
        {
          icon: <FaTrash style={{ color: "#d9534f" }} />,
          autoClose: 2000,
          hideProgressBar: false, // show progress bar
        }
      );



      fetchLoans();
    } catch (err) {
      toast.error("Failed to delete loan");
    }
  };


  return (
    <div className="admin-loan-page-wrapper">
      {/* 🔘 Show/Hide Filters Button */}
      <button
        className="admin-toggle-filters-btn"
        onClick={() => setShowFilters(prev => !prev)}
      >
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>


      {/* 🔍 Filter Section - Conditional */}
      

      <div className={`admin-loan-filter-fixed ${showFilters ? "open" : ""}`}>

        <div className="admin-loan-filter-card">
          <div className="admin-loan-filter-group">
            <label>Search Applications</label>
            <input
              type="text"
              placeholder="Loan ID, Customer, or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-loan-filter-input"
            />
          </div>
          <div className="admin-loan-filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-loan-filter-input"
            >
              <option key="all" value="All">All</option>
              <option key="submitted" value="SUBMITTED">Submitted</option>
              <option key="approved" value="APPROVED">Approved</option>
              <option key="rejected" value="REJECTED">Rejected</option>
              <option key="closed" value="CLOSED">Closed</option>
            </select>

          </div>
          <div className="admin-loan-filter-group">
            <label>Loan Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-loan-filter-input"
            >
              <option key="all-types" value="All">All Types</option>
              {loanTypes.map((type, idx) => (
                <option key={`${type?.id ?? type?.name ?? idx}-${idx}`} value={type.name}>
                  {type.name}
                </option>
              ))}

            </select>

          </div>
          <div className="admin-loan-filter-group">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-loan-filter-input"
            >
              <option key="none" value="">None</option>
              <option key="amount" value="amount">Amount</option>
              <option key="date" value="date">Date</option>
            </select>

          </div>
        </div>
      </div>


      {/* 📌 Filter Tags and Clear */}
      <div className="active-filter-tags">
        {searchTerm && (
          <span className="filter-badge">Search: "{searchTerm}"</span>
        )}
        {statusFilter !== "All" && (
          <span className="filter-badge">Status: {statusFilter}</span>
        )}
        {typeFilter !== "All" && (
          <span className="filter-badge">Type: {typeFilter}</span>
        )}
        {sortBy && <span className="filter-badge">Sort: {sortBy}</span>}
        {(searchTerm ||
          statusFilter !== "All" ||
          typeFilter !== "All" ||
          sortBy) && (
          <div className="clear-filters-inline">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setTypeFilter("All");
                setSortBy("");
              }}
              className="loan-filter-clear-btn"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* 🧾 Header */}
      <div className="admin-loan-section-header-wrapper">
        <h3 className="admin-loan-section-heading">Loan Applications</h3>
        <p className="admin-loan-count-label">
          Showing {filteredLoans.length} applications
        </p>
      </div>

      {/* 📊 Table */}
      <div className="admin-loan-table-wrapper">
        <div className="admin-loan-table-scroll">
          <table className="admin-loan-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Interest Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>LN00{loan.id}</td>
                  <td>{loan.loanType}</td>
                  <td>₹ {loan.amount.toLocaleString("en-IN")}</td>
                  <td>
                    {loan.appliedInterestRate
                      ? `${loan.appliedInterestRate}%`
                      : "N/A"}{" "}
                    - {loan.tenureYears} yrs
                  </td>
                  <td>
                    {loan.loanStatus ? (
                      <span className={`loan-status-badge ${loan.loanStatus.toLowerCase()}`}>
                        {loan.loanStatus === "SUBMITTED" && <><FiSend style={{ marginRight: "6px" }} />SUBMITTED</>}
                        {loan.loanStatus === "APPROVED" && <><FiCheckCircle style={{ marginRight: "6px" }} />APPROVED</>}
                        {loan.loanStatus === "REJECTED" && <><FiXCircle style={{ marginRight: "6px" }} />REJECTED</>}
                        {loan.loanStatus === "CLOSED" && <><FiLock style={{ marginRight: "6px" }} />CLOSED</>}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  <td className="admin-actions">
                    <button
                      className="blue-btn"
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <FaEye /> View
                    </button>
                    
                    <button
                      className="green-btn"
                      onClick={() => {
                        if (loan.loanStatus === "APPROVED") {
                          toast.info("Loan already approved");
                        } else if (loan.loanStatus === "CLOSED") {
                          toast.info("Loan is already closed and cannot be approved");
                        } else {
                          setActionModal({ open: true, loan, status: "APPROVED" });
                        }
                      }}
                    >
                      <FaThumbsUp /> Approve
                    </button>


                    
                    <button
                      className="red-btn"
                      onClick={() => {
                        if (loan.loanStatus === "REJECTED") {
                          toast.info("Loan already rejected");
                        } else if (loan.loanStatus === "APPROVED") {
                          toast.error("Approved loans cannot be rejected");
                        } else if (loan.loanStatus === "CLOSED") {
                          toast.error("Closed loans cannot be rejected");
                        } else {
                          setActionModal({ open: true, loan, status: "REJECTED" });
                        }
                      }}
                    >
                      <FaThumbsDown /> Reject
                    </button>

                    
                    
                    <button
                      className="gray-btn"
                      onClick={() => {
                        if (loan.loanStatus === "CLOSED") {
                          toast.info("Loan already closed");
                        } else if (loan.loanStatus === "REJECTED") {
                          toast.error("Rejected loans cannot be closed");
                        } else if (loan.loanStatus !== "APPROVED") {
                          toast.warn("Only approved loans can be closed");
                        } else {
                          setActionModal({ open: true, loan, status: "CLOSED" });
                        }
                      }}
                    >
                      <FaTimes /> Close
                    </button>

                    
                    <button
                      className="delete-btn"
                      onClick={() => {
                        const status = loan.loanStatus;

                        if (status === "REJECTED" || status === "CLOSED") {
                          setLoanIdToDelete(loan.id);
                          setShowDeleteModal(true);
                        } else if (status === "APPROVED") {
                          toast.error("Cannot delete an approved loan.");
                        } else if (status === "SUBMITTED") {
                          toast.info("Please reject the loan before deleting.");
                        } else {
                          toast.warn("Invalid status for deletion.");
                        }
                      }}
                    >
                      <FaTrash /> Delete
                    </button>



                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLoans.length === 0 && (
          <div className="no-applications-message">
            No loan applications found.
          </div>
        )}
  
      </div>

      {/* 👁️ View Modal */}
      {selectedLoan && (
        <div
          className="loan-modal-overlay"
          onClick={() => setSelectedLoan(null)}
        >
          <div
            className="loan-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-icon" onClick={() => setSelectedLoan(null)}>
              <FaTimes size={18} />
            </button>
            <LoanDetailCard loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" // important to allow custom progressStyle
      />


      
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>
              Are you sure you want to delete{" "}
              <span style={{ color: "#d9534f" }}>Loan LN00{loanIdToDelete}</span>?
            </h4>
            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>
              <button
                className="confirm-delete-btn"
                onClick={() => {
                  handleDelete(loanIdToDelete);
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {actionModal.open && (
        <div className="modal-overlay" onClick={() => {
          setActionModal({ open: false, loan: null, status: "" });
          setActionComment("");
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4 className="status-modal-heading">
              {actionModal.status === "APPROVED" && "Approve"} 
              {actionModal.status === "REJECTED" && "Reject"} 
              {actionModal.status === "CLOSED" && "Close"}{" "}
              Loan <span className="highlight-loan-id">LN00{actionModal.loan?.id}</span>
            </h4>

            <textarea
              className="status-reason-textarea"
              placeholder={`Enter reason (max 500 characters)...`}
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value.slice(0, 500))}
              rows={4}
            />
            <p className="char-count-label">
              {actionComment.length}/500 characters
            </p>

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setActionModal({ open: false, loan: null, status: "" });
                  setActionComment("");
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                disabled={actionComment.trim().length === 0}
                onClick={async () => {
                  try {
                    await axios.put(
                      `http://localhost:8081/api/admin/loans/${actionModal.loan.id}`,
                      {
                        status: actionModal.status,
                        comments: actionComment.trim(),
                      },
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    toast.success(`Loan ${actionModal.status.toLowerCase()} successfully`);
                    fetchLoans();
                  } catch (err) {
                    toast.error("Failed to update loan status");
                  } finally {
                    setActionModal({ open: false, loan: null, status: "" });
                    setActionComment("");
                  }
                }}
              >
                {actionModal.status}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminLoanList;
