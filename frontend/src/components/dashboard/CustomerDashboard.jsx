// src/components/dashboard/CustomerDashboard.jsx


import { useEffect, useState } from "react";
import {
  FaComments,
  FaCreditCard,
  FaFileAlt,
  FaIdBadge,
  FaMoneyBillAlt,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";


import CustomerChat from "../chat/CustomerChat";
import EmiPaymentsPage from "../emi/EmiPaymentsPage";
import LogoutButton from "../global/LogoutButton";
import ApplyLoanForm from "../loan/customerLoan/ApplyLoanForm";
import CustomerLoanList from "../loan/customerLoan/CustomerLoanList";
import CustomerDashboardMain from "./CustomerDashboardMain"; // ✅ NEW
import CustomerProfile from "./CustomerProfile";

import "../../styles/dashboard/Dashboard.css";

function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");

  const [customerUser, setCustomerUser] = useState({ name: "" });
  const [chatUser, setChatUser] = useState({ userId: null });
  const [loadingUser, setLoadingUser] = useState(true);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  // Fetch user info for dashboard and chat
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch main dashboard user info
    fetch("http://localhost:8081/api/customer/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch customer user");
        return res.json();
      })
      .then((data) => {
        setCustomerUser(data);
        setLoadingUser(false);
      })
      .catch(() => navigate("/login"));

    // Fetch chat user info
    fetch("http://localhost:8081/api/chat/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch chat user");
        return res.json();
      })
      .then((data) => setChatUser(data))
      .catch(() => console.warn("Failed to fetch chat user info"));
  }, [navigate]);

  // Sync activeSection with URL path
  useEffect(() => {
    const p = location.pathname || "";
    if (p.endsWith("/customer/dashboard/emi")) setActiveSection("payments");
    else if (p.endsWith("/customer/dashboard/profile")) setActiveSection("profile");
    else if (p.endsWith("/customer/dashboard/apply-loan")) setActiveSection("apply");
    else if (p.endsWith("/customer/dashboard")) setActiveSection("dashboard"); // ✅ fixed here
  }, [location.pathname]);

  if (loadingUser) {
    return (
      <div className="dashboard-container">
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading user information...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* ☰ Toggle Button */}
      <button className="dashboard-toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Overlay */}
      <div
        className={`dashboard-overlay ${sidebarVisible ? "show" : ""}`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarVisible ? "show" : ""}`}>
        <div className="dashboard-user-info">
          <FaUser size={42} className="dashboard-user-icon" />
          <p>Welcome,</p>
          <h3>{customerUser.name}</h3>
          <hr className="dashboard-divider" />
        </div>

        <nav className="dashboard-nav">
          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => { setActiveSection("dashboard"); navigate("/customer/dashboard"); }}
          >
            <FaUser /> Dashboard
          </button>
          <button
            className={activeSection === "applications" ? "active" : ""}
            onClick={() => { setActiveSection("applications"); navigate("/customer/dashboard/applications"); }}
          >
            <FaFileAlt /> My Applications
          </button>
          <button
            className={activeSection === "apply" ? "active" : ""}
            onClick={() => { setActiveSection("apply"); navigate("/customer/dashboard/apply-loan"); }}
          >
            <FaMoneyBillAlt /> Apply For Loan
          </button>
          <button
            className={activeSection === "payments" ? "active" : ""}
            onClick={() => { setActiveSection("payments"); navigate("/customer/dashboard/emi"); }}
          >
            <FaCreditCard /> EMI & Payments
          </button>
          <button
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => { setActiveSection("profile"); navigate("/customer/dashboard/profile"); }}
          >
            <FaIdBadge /> My Profile
          </button>
          <button
            className={activeSection === "chatSupport" ? "active" : ""}
            onClick={() => setActiveSection("chatSupport")}
          >
            <FaComments /> Chat Support
          </button>
        </nav>

        <div className="dashboard-logout">
          <LogoutButton icon={<FaSignOutAlt />} />
        </div>
      </aside>

      {/* Main Section */}
      <main className="dashboard-main">

        {activeSection === "dashboard" && (
          <CustomerDashboardMain
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        )}

        {activeSection === "applications" && <CustomerLoanList />}
        {activeSection === "apply" && <ApplyLoanForm />}
        {activeSection === "payments" && <EmiPaymentsPage />}
        {activeSection === "profile" && <CustomerProfile />}

        {activeSection === "chatSupport" && (
          chatUser.userId ? <CustomerChat customerId={chatUser.userId} /> : <p>Loading chat support...</p>
        )}

      </main>
    </div>
  );
}

export default CustomerDashboard;
