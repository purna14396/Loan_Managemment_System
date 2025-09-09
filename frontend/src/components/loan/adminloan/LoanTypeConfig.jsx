import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/loan/adminloan/LoanTypeConfig.css";
import { FaTrash } from "react-icons/fa";


function LoanTypeConfig() {
  const [loanTypes, setLoanTypes] = useState([]);
  const [newLoan, setNewLoan] = useState({
    name: "",
    maxTenureYears: "",
    maxLoanAmount: "",
    interestRate: "6.5",
    penaltyRatePercent: "1",
    maxLoansPerCustomerPerLoanType: "3"
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);

  const fetchLoanTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8081/api/admin/loan-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoanTypes(res.data);
    } catch (error) {
      console.error("Error fetching loan types:", error);
      toast.error("Failed to fetch loan types");
    }
  }, []);

  useEffect(() => {
    fetchLoanTypes();
  }, [fetchLoanTypes]);

    const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "maxLoanAmount") {
      const raw = value.replace(/[^0-9]/g, "");

      // ✅ Block inputs beyond 10 digits or > 1000000000 silently
      if (raw.length > 10 || Number(raw) > 1000000000) return;

      setNewLoan((prev) => ({
        ...prev,
        [name]: raw, // store raw number
      }));
    } else if (name === "maxTenureYears") {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 2);
      if (+numericValue <= 30) {
        setNewLoan((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setNewLoan((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleCreate = async () => {
    let { name, maxTenureYears, maxLoanAmount, maxLoansPerCustomerPerLoanType } = newLoan;
    if (!name || !maxTenureYears || !maxLoanAmount || !maxLoansPerCustomerPerLoanType) {
      toast.error("Please fill in all fields");
      return;
    }
    
    maxLoanAmount = maxLoanAmount.replace(/,/g, "");
    if (Number(maxLoanAmount) < 20000) {
      toast.error("Minimum loan amount should be ₹20,000");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8081/api/admin/loan-types",
        {
          ...newLoan,
          maxLoanAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewLoan({
        name: "",
        maxTenureYears: "",
        maxLoanAmount: "",
        interestRate: "6.5",
        penaltyRatePercent: "1",
        maxLoansPerCustomerPerLoanType: "3"
      });

      toast.success("New loan type added");
      fetchLoanTypes();
    } catch (error) {
      console.error("Error creating loan type:", error);
      toast.error("Error adding loan type");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8081/api/admin/loan-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      
      toast.error(
              `Loan type deleted successfully`,
              {
                icon: <FaTrash style={{ color: "#d9534f" }} />,
                autoClose: 2000,
                hideProgressBar: false, // show progress bar
              }
            );
      
      fetchLoanTypes();

    } catch (error) {
      console.error("Error deleting loan type:", error);

      // Handle backend 409 error specifically
      if (error.response?.status === 409) {
        toast.error(
          "This loan type has active loan(s). You cannot delete it until all loans under it are rejected or closed."
        );
      } else {
        toast.error("Failed to delete loan type. Please try again later.");
      }
    }
  };




  const openEditModal = (loan) => {
    setEditingLoan({
      ...loan,
      maxLoanAmount: loan.maxLoanAmount?.toString() || ""
    });
    setEditModalOpen(true);
  };


  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "maxLoanAmount") {
      const raw = value.replace(/[^0-9]/g, "");

      if (raw.length > 10) return;

      const maxAllowed = 1000000000;
      if (Number(raw) > maxAllowed) {
        toast.warn("Maximum allowed is ₹100,00,00,000 (100 Cr)");
        return;
      }

      setEditingLoan((prev) => ({
        ...prev,
        [name]: raw,
      }));


    } else if (name === "maxTenureYears") {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 2);
      if (+numericValue <= 30) {
        setEditingLoan((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else if (name === "maxLoansPerCustomerPerLoanType") {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 1);
      if (+numericValue >= 1 && +numericValue <= 3) {
        setEditingLoan((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setEditingLoan((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveEdit = async () => {
  let { name, maxTenureYears, maxLoanAmount, maxLoansPerCustomerPerLoanType } = editingLoan;

  if (!name || !maxTenureYears || !maxLoanAmount || !maxLoansPerCustomerPerLoanType) {
    toast.error("All fields are required");
    return;
  }

  try {
    const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8081/api/admin/loan-types/${editingLoan.loanTypeId}`,
        {
          ...editingLoan,
          maxLoanAmount: maxLoanAmount.toString()   // always raw numeric string
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Loan type updated");
      fetchLoanTypes();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating loan type:", error);
      toast.error("Failed to update");
    }
  };


  return (
    <div className="loan-type-config-wrapper">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />

      <div className="loan-type-header">
        <h2 className="loan-type-title">Loan Type Configuration</h2>
        <p className="loan-type-subtitle">Manage and add new loan categories</p>
        <p className="loan-type-count">Total Loan Types: {loanTypes.length}</p>
      </div>

      <div className="loan-type-form">
        <input
          name="name"
          value={newLoan.name}
          onChange={handleChange}
          placeholder="Loan Name"
          className="loan-type-input"
          maxLength={100}
        />
        <input
          name="maxTenureYears"
          value={newLoan.maxTenureYears}
          onChange={handleChange}
          placeholder="Max Tenure (Years)"
          className="loan-type-input"
          maxLength={2}
        />
        
        <input
          name="maxLoanAmount"
          value={
            newLoan.maxLoanAmount
              ? new Intl.NumberFormat("en-IN").format(newLoan.maxLoanAmount)
              : ""
          }
          onChange={handleChange}
          placeholder="Max Amount (₹)"
          className="loan-type-input"
        />



        <input
          type="number"
          name="maxLoansPerCustomerPerLoanType"
          value={newLoan.maxLoansPerCustomerPerLoanType}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= 1 && val <= 3) {
              setNewLoan((prev) => ({ ...prev, maxLoansPerCustomerPerLoanType: val.toString() }));
            }
          }}
          placeholder="1–3"
          className="loan-type-input"
          min="1"
          max="3"
        />

        <button onClick={handleCreate} className="loan-type-add-btn">
          Add New Loan
        </button>
      </div>

      <div className="loan-type-table-wrapper">
        <table className="loan-type-table scrollable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Max Tenure</th>
              <th>Max Amount</th>
              <th>Max Loans / Customer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loanTypes.map((loan) => (
              <tr key={loan.loanTypeId}>
                <td>{loan.name}</td>
                <td>{loan.maxTenureYears} yrs</td>
                <td>₹ {parseInt(loan.maxLoanAmount).toLocaleString("en-IN")}</td>
                <td>{loan.maxLoansPerCustomerPerLoanType}</td>
                <td>
                  <button
                    className="loan-type-edit-btn"
                    onClick={() => openEditModal(loan)}
                  >
                    Modify
                  </button>
                  <button
                    className="loan-type-delete-btn"
                    onClick={() => handleDelete(loan.loanTypeId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {loanTypes.length === 0 && (

            <div colSpan="5" className="no-loan-types">
              No loan types found.
            </div>

        )}

        
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div
          className="loan-type-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("loan-type-modal-overlay")) {
              setEditModalOpen(false);
            }
          }}
        >
          <div className="loan-type-modal">
            <button className="loan-type-modal-close" onClick={() => setEditModalOpen(false)}>
              &times;
            </button>
            <h4>Edit Loan Type</h4>

            <label>Loan Name</label>
            <input name="name" value={editingLoan.name} onChange={handleEditChange} />

            <label>Max Tenure (Years)</label>
            <input name="maxTenureYears" value={editingLoan.maxTenureYears} onChange={handleEditChange} />

            <label>Max Amount (₹)</label>
            <input
              name="maxLoanAmount"
              value={
                editingLoan.maxLoanAmount
                  ? new Intl.NumberFormat("en-IN").format(editingLoan.maxLoanAmount)
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                if (raw.length > 10 || Number(raw) > 1000000000) return;

                setEditingLoan((prev) => ({
                  ...prev,
                  maxLoanAmount: raw,   // ✅ always store raw numeric
                }));
              }}
              placeholder="Max Amount (₹)"
              className="loan-type-input"
            />



            <label>Max Loans/Customer</label>
            <input
              type="number"
              name="maxLoansPerCustomerPerLoanType"
              value={editingLoan.maxLoansPerCustomerPerLoanType}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 3) {
                  setEditingLoan((prev) => ({ ...prev, maxLoansPerCustomerPerLoanType: val.toString() }));
                }
              }}
              min="1"
              max="3"
              placeholder="1–3"
            />


            <div className="loan-type-modal-buttons">
              <button className="cancel" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button className="save" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanTypeConfig;
