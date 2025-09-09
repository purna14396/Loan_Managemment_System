// src/components/dashboard/CustomerDashboardMain.jsx
import { useEffect, useState } from "react";
import {  useRef } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import EmiCalendar from "../emi/EmiCalender";
import {
  FaBuilding,
  FaCheckCircle,
  FaCreditCard,
  FaFileAlt,
  FaHourglassHalf,
} from "react-icons/fa";

import {
  getCustomerLoans,
  getLoanWithEmis,
} from "../../services/emiService";

import "../../styles/dashboard/CustomerDashboardMain.css";

// Loan Icons
import AgriculturalLoan from "../../assets/Agricultural_Loan.png";
import BusinessLoan from "../../assets/Business_Loan.png";
import EducationalLoan from "../../assets/Educational_Loan.png";
import HomeLoan from "../../assets/Home_Loan.png";
import PersonalLoan from "../../assets/Personal_Loan.png";
import VehicleLoan from "../../assets/Vehicle_Loan.png";

function CustomerDashboardMain({ activeSection, setActiveSection }) {
  const [loans, setLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarModalRef = useRef();
  
  // Use loanDetails instead of loans
  const allEmis = Object.entries(loanDetails).flatMap(([loanId, d]) =>
    (d?.emis || []).map(emi => ({
      ...emi,
      loanId: Number(loanId),
      loanType: d?.loanType || undefined,
    }))
  );


  useEffect(() => {
    const fetchData = async () => {
      const data = await getCustomerLoans();
      setLoans(data || []);

      const details = {};
      await Promise.all(
        (data || []).map(async (loan) => {
          const d = await getLoanWithEmis(loan.id);
          details[loan.id] = d;
        })
      );
      setLoanDetails(details);
    };

    fetchData();
  }, []);

  const getLoanImage = (type) => {
    switch (type) {
      case "Home Loan":
        return HomeLoan;
      case "Vehicle Loan":
        return VehicleLoan;
      case "Personal Loan":
        return PersonalLoan;
      case "Education Loan":
        return EducationalLoan;
      case "Business Loan":
        return BusinessLoan;
      case "Agricultural Loan":
        return AgriculturalLoan;
      default:
        return PersonalLoan;
    }
  };

  const totalApplications = loans.length;
  const approvedAmount = loans
    .filter((l) => l.loanStatus === "APPROVED" || l.loanStatus === "CLOSED")
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const activeLoans = loans.filter((l) => l.loanStatus === "APPROVED").length;
  const pendingLoans = loans.filter(
    (l) => l.loanStatus === "SUBMITTED" || l.loanStatus === "UNDER_REVIEW"
  ).length;

  const approvedApps = loans
    .filter((l) => l.loanStatus === "APPROVED")
    .slice(0, 5)
    .map((loan) => {
      const pack = loanDetails[loan.id];

      const totalPaid =
        pack?.emis?.filter((e) => e.status === "PAID")
          .reduce((sum, e) => sum + e.amount, 0) || 0;

      const totalLiability =
        pack?.emis?.reduce((sum, e) => sum + e.amount, 0) || 0; // principal + interest

      const totalDue = totalLiability - totalPaid;

      return { ...loan, paid: totalPaid, remaining: totalDue };
    });

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEMIs = Object.entries(loanDetails)
    .flatMap(([loanId, d]) =>
      (d?.emis || []).map((emi) => ({
        ...emi,
        loanId, // attach parent loanId
      }))
    )
    .filter(
      (emi) =>
        emi.status === "PENDING" &&
        new Date(emi.dueDate) >= today &&
        new Date(emi.dueDate) <= nextWeek
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="cdm-wrapper">
      {/* Top Stats */}
      <div className="cdm-stats-row">
        <div className="cdm-stat-box">
          <FaFileAlt />
          <p>Total Applications</p>
          <h3>{totalApplications}</h3>
        </div>
        <div className="cdm-stat-box">
          <FaCheckCircle />
          <p>Total Loan Taken</p>
          <h3>₹{approvedAmount.toLocaleString("en-IN")}</h3>
        </div>
        <div className="cdm-stat-box">
          <FaBuilding />
          <p>Active Loans</p>
          <h3>{activeLoans}</h3>
        </div>
        <div className="cdm-stat-box">
          <FaHourglassHalf />
          <p>Pending Loans</p>
          <h3>{pendingLoans}</h3>
        </div>
        
        <div className="cdm-stat-box cdm-calendar-btn-box">
          <button
            className="cdm-calendar-btn"
            onClick={() => setShowCalendar(true)}
            title="View EMI Calendar"
          >
            <FaCalendarAlt /> Calendar
          </button>
        </div>
      </div>
      
      {/* Calendar Modal */}
      {showCalendar && (
      <div
        className="cdm-calendar-modal"
        ref={calendarModalRef}
        onClick={(e) => {
          if (e.target === calendarModalRef.current) setShowCalendar(false);
        }}
      >
        <div className="cdm-calendar-modal-content">
          <div className="cdm-calendar-wrapper">
            <button
              className="cdm-calendar-close-btn"
              onClick={() => setShowCalendar(false)}
              title="Close"
            >
              &times;
            </button>
            <EmiCalendar emis={allEmis} loans={loans} />
          </div>
        </div>
      </div>
    )}


      {/* Main Grid */}
      <div className="cdm-main-columns">
        {/* Left - Recent Applications */}
        <div className="cdm-applications">
          <h2>Recent Applications</h2>
          <p>Showing {approvedApps.length} approved applications</p>

          <div className="cdm-scroll-wrapper">
            {approvedApps.length === 0 ? (
              <div className="cdm-empty">No approved applications</div>
            ) : (
              approvedApps.map((loan) => (
                <div className="cdm-loan-card" key={loan.id}>
                  {/* Left */}
                  <div className="cdm-loan-left">
                    <img
                      src={getLoanImage(loan.loanType?.name)}
                      alt={loan.loanType?.name}
                      className="cdm-loan-img"
                    />
                    <div>
                      <h4 className="cdm-loan-type">{loan.loanType?.name}</h4>
                      <p className="cdm-loan-id">Application ID: LN00{loan.id}</p>
                    </div>
                  </div>

                  {/* Middle */}
                  <div className="cdm-loan-middle">
                    <h3>₹{loan.amount.toLocaleString("en-IN")}</h3>
                    <p>Paid: ₹{loan.paid.toLocaleString("en-IN")}</p>
                    <p>Remaining: ₹{loan.remaining.toLocaleString("en-IN")}</p>
                  </div>

                  {/* Right */}
                  <div className="cdm-loan-right">
                    <span className={`cdm-status-badge ${loan.loanStatus?.toLowerCase()}`}>
                      {loan.loanStatus}
                    </span>
                    <button onClick={() => setActiveSection("payments")}>
                      EMI Schedule
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - EMI Reminder */}
        <div className="cdm-emi-reminder">
          <h2>Upcoming EMI Payments (Next 7 Days)</h2>
          <div className="cdm-scroll-wrapper">
            {upcomingEMIs.length === 0 ? (
              <p className="cdm-empty">No upcoming EMIs in the next 7 days</p>
            ) : (
              upcomingEMIs.map((emi, i) => (
                <div className="cdm-emi-card" key={i}>
                  <FaCreditCard className="cdm-emi-icon" />
                  <div>
                    <h4>Loan: LN00{emi.loanId}</h4>
                    <p>Due on: {emi.dueDate}</p>
                  </div>
                  <div>
                    <h4>₹{emi.amount.toLocaleString("en-IN")}</h4>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboardMain;
