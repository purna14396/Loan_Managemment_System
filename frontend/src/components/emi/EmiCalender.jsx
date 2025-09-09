import React, { useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/emi/EmiCalendar.css";

export default function EmiCalendar({ emis, loans = [], title = "EMI Calendar" }) {
  // State for popup
  const [selectedEmi, setSelectedEmi] = useState(null);

  // Map due dates to EMI objects for quick lookup
  const emiDateMap = useMemo(() => {
    const map = {};
    (emis || [])
      .filter((e) => e.status === "PENDING")
      .forEach((e) => {
        const key = new Date(e.dueDate).toDateString();
        if (!map[key]) map[key] = [];
        map[key].push(e);
      });
    return map;
  }, [emis]);

  // Highlight tiles with EMI due
  const tileClassName = ({ date, view }) => {
    if (view === "month" && emiDateMap[date.toDateString()]) {
      return "emi-calendar-due";
    }
    return null;
  };

  // Handle click on calendar tile
  const onClickDay = (date) => {
    const emisOnDate = emiDateMap[date.toDateString()];
    if (emisOnDate && emisOnDate.length > 0) {
      setSelectedEmi(emisOnDate[0]);
    }
  };

  // Find loan details for selected EMI
  const selectedLoan =
    selectedEmi && loans.length
      ? loans.find((l) => String(l.id) === String(selectedEmi.loanId))
      : null;

  // Format Loan ID as LN00X
  const formattedLoanId = (loanId) =>
    loanId ? `LN${String(loanId).padStart(3, "0")}` : "N/A";

  // Get loan name from selectedLoan or selectedEmi
  const getLoanName = () =>
    selectedLoan?.loanType?.name ||
    selectedLoan?.loanType ||
    selectedEmi?.loanType?.name ||
    selectedEmi?.loanType ||
    "N/A";

  return (
    <div className="emi-calendar-container">
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      <Calendar tileClassName={tileClassName} onClickDay={onClickDay} />
      <div className="emi-calendar-legend">
        <span className="emi-calendar-dot"></span> Upcoming EMI Due
      </div>

      {/* Popup for EMI details */}
      {selectedEmi && (
        <div className="emi-calendar-popup-backdrop" onClick={() => setSelectedEmi(null)}>
          <div className="emi-calendar-popup" onClick={(e) => e.stopPropagation()}>
            {/* Debug info */}
            {/* <pre>{JSON.stringify(selectedEmi, null, 2)}</pre>
            <pre>{JSON.stringify(selectedLoan, null, 2)}</pre> */}
            <button
              className="emi-calendar-popup-close"
              onClick={() => setSelectedEmi(null)}
              title="Close"
            >
              &times;
            </button>
            <h4>EMI Due Details</h4>
            <div className="emi-calendar-popup-section">
              <strong>Loan ID:</strong>{" "}
              {formattedLoanId(selectedLoan?.id || selectedEmi?.loanId)}
            </div>
            <div className="emi-calendar-popup-section">
              <strong>Loan Name:</strong> {getLoanName()}
            </div>
            <div className="emi-calendar-popup-section">
              <strong>EMI Amount:</strong> ₹{selectedEmi.amount?.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}