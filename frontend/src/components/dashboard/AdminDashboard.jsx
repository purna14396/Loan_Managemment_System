// src/components/dashboard/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaUsersCog,
  FaFileAlt,
  FaMoneyBillWave,
  FaCogs,
  FaAddressCard,
  FaSignOutAlt,
  FaEnvelope,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import LogoutButton from "../global/LogoutButton";
import AdminProfile from "./AdminProfile";
import AdminLoanList from "../loan/adminloan/AdminLoanList";
import LoanTypeConfig from "../loan/adminloan/LoanTypeConfig";
import InterestPenaltyConfig from "../loan/adminloan/InterestPenaltyConfig";

import UserManagementPage from "../loan/adminloan/UserManagementPage";
import AdminDashboardMain from "./AdminDashboardMain";


import AdminChat from "../chat/AdminChat";

import "../../styles/dashboard/Dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");

  const [adminUser, setAdminUser] = useState({ name: "" });
  const [chatUser, setChatUser] = useState({ userId: null });

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // Fetch admin user info
    fetch("http://localhost:8081/api/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setAdminUser(data))
      .catch(() => navigate("/login"));

    // Fetch chat user info
    fetch("http://localhost:8081/api/chat/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setChatUser(data))
      .catch(() => console.warn("Chat user info fetch failed"));
  }, [navigate]);

  const sections = [
    { key: "dashboard", label: "Dashboard", icon: <FaUser /> },
    { key: "userManagement", label: "User Management", icon: <FaUsersCog /> },
    { key: "loanApplications", label: "Loan Applications", icon: <FaFileAlt /> },
    { key: "interestPenalty", label: "Interest & Penalty Config", icon: <FaMoneyBillWave /> },
    { key: "loanConfig", label: "Loan Type Configuration", icon: <FaCogs /> },
    { key: "profile", label: "My Profile", icon: <FaAddressCard /> },
    { key: "viewChats", label: "View Chats", icon: <FaEnvelope /> },
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboardMain />;
      case "userManagement":
        return <UserManagementPage />;
      case "loanApplications":
        return <AdminLoanList />;
      case "loanConfig":
        return <LoanTypeConfig />;
      case "interestPenalty":
        return <InterestPenaltyConfig />;
      case "profile":
        return <AdminProfile />;
      case "viewChats":
        return chatUser.userId ? <AdminChat adminId={chatUser.userId} /> : <p>Loading chats...</p>;
      default:
        return <h2>📊 Welcome to Admin Dashboard</h2>;
    }
  };

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
          <h3>{adminUser.name}</h3>
          <hr className="dashboard-divider" />
        </div>

        <nav className="dashboard-nav">
          {sections.map((sec) => (
            <button
              key={sec.key}
              className={activeSection === sec.key ? "active" : ""}
              onClick={() => setActiveSection(sec.key)}
            >
              {sec.icon} {sec.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-logout">
          <LogoutButton icon={<FaSignOutAlt />} />
        </div>
      </aside>

      {/* Main Content */}

      <main className="dashboard-main">{renderMainContent()}</main>

    </div>
  );
}

export default AdminDashboard;
