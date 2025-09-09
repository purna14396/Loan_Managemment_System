import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../../../styles/loan/adminloan/InterestPenaltyConfig.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InterestPenaltyConfig = () => {
  const [loanTypes, setLoanTypes] = useState([]);
  const [selectedLoanType, setSelectedLoanType] = useState(null);
  const [modalData, setModalData] = useState({ interestRate: "", penaltyRatePercent: "" });
  const token = localStorage.getItem("token");

  const fetchLoanTypes = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/admin/loan-types", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const initialized = res.data.map((type) => ({
        ...type,
        interestRate: type.interestRate ?? "5.5",
        penaltyRatePercent: type.penaltyRatePercent ?? "1"
      }));
      setLoanTypes(initialized);
    } catch (error) {
      console.error("Failed to load loan types", error);
      toast.error("Failed to load loan types", { autoClose: 2000 });
    }
  }, [token]);

  useEffect(() => {
    fetchLoanTypes();
  }, [fetchLoanTypes]);

  const openModal = (type) => {
    setSelectedLoanType(type);
    setModalData({
      interestRate: type.interestRate,
      penaltyRatePercent: type.penaltyRatePercent,
    });
  };

  const closeModal = () => {
    setSelectedLoanType(null);
    setModalData({ interestRate: "", penaltyRatePercent: "" });
  };

  const handleModalChange = (field, value) => {
    if (!/^\d{0,2}(\.\d{0,2})?$/.test(value)) return;
    if (field === "interestRate" && +value > 15) return;
    if (field === "penaltyRatePercent" && +value > 5) return;

    setModalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedLoanType) return;

    // Add min interest rate check here
    if (Number(modalData.interestRate) < 6.5) {
      toast.error("Interest Rate must be at least 6.5");
      return;  // Prevent saving
    }

    const updated = {
      ...selectedLoanType,
      interestRate: modalData.interestRate,
      penaltyRatePercent: modalData.penaltyRatePercent,
    };

    try {
      await axios.put(
        `http://localhost:8081/api/admin/loan-types/${selectedLoanType.loanTypeId}`,
        updated,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Updated "${updated.name}"`, { autoClose: 2000 });
      closeModal();
      fetchLoanTypes();
    } catch (error) {
      console.error("Update failed", error);
      toast.error(`Failed to update "${updated.name}"`, { autoClose: 2000 });
    }
  };


  return (
    <div className="interest-config-wrapper">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
      <div className="interest-config-header">
        <h2 className="interest-config-title">Interest & Penalty Configuration</h2>
        <p className="interest-config-subtitle">Manage interest and penalty rates for loan types</p>
        <p className="interest-config-count">Total Loan Types: {loanTypes.length}</p>
      </div>

      <div className="interest-config-table-wrapper">
        <table className="interest-config-table scrollable">
          <thead>
            <tr>
              <th>Loan Type</th>
              <th>Interest Rate (%)</th>
              <th>Penalty Rate (%)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            
            

            {loanTypes.map((type) => (
              <tr key={type.loanTypeId}>
                <td>{type.name}</td>
                <td>{type.interestRate}</td>
                <td>{type.penaltyRatePercent}</td>
                <td>
                  <button
                    className="interest-config-update-btn"
                    onClick={() => openModal(type)}
                  >
                    Modify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {loanTypes.length === 0 && (

                <div colSpan="4" className="no-loan-types">
                  No loan types found.
                </div>

        )}
      </div>

      {/* Modal */}
      {selectedLoanType && (
      <div className="interest-modal-overlay" onClick={closeModal}>
        <div
          className="interest-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="interest-modal-close" onClick={closeModal}>
            &times;
          </button>
          <h4>Modify "{selectedLoanType.name}"</h4>

          <label>Interest Rate (%)</label>
          <input
            type="number"
            value={modalData.interestRate}
            placeholder="e.g., 9.50"
            min="0"
            max="15"
            step="0.01"
            onChange={(e) => handleModalChange("interestRate", e.target.value)}
          />

          <label>Penalty Rate (%)</label>
          <input
            type="number"
            value={modalData.penaltyRatePercent}
            placeholder="e.g., 2.00"
            min="0"
            max="5"
            step="0.01"
            onChange={(e) =>
              handleModalChange("penaltyRatePercent", e.target.value)
            }
          />

          <div className="interest-modal-buttons">
            <button className="cancel" onClick={closeModal}>Cancel</button>
            <button className="save" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    )}


    </div>
  );
};

export default InterestPenaltyConfig;
