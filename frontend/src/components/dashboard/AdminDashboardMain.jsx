import React, { useEffect, useRef, useState } from "react";
import {
  FaUsers,
  FaFileAlt,
  FaCheckCircle,
  FaRupeeSign,
  FaDownload,
} from "react-icons/fa";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import {
  getAdminSummary,
  getUserStats,
  getLoanStats,
} from "../../services/adminDashboardService";
import "../../styles/dashboard/AdminDashboardMain.css";
import html2canvas from "html2canvas";

function AdminDashboardMain() {
  const [summary, setSummary] = useState({});
  const [userStats, setUserStats] = useState({});
  const [loanStats, setLoanStats] = useState({});

  const chartRef = useRef(null);

  const userData = [
    { name: "Admins", value: userStats.totalAdmins || 0 },
    { name: "Customers", value: userStats.totalCustomers || 0 }
  ];

  const loanData = [
    { name: "Approved", value: loanStats.totalApprovedLoans || 0 },
    { name: "Closed", value: loanStats.totalClosedLoans || 0 },
    { name: "Rejected", value: loanStats.totalRejectedLoans || 0 }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      const s = await getAdminSummary();
      const u = await getUserStats();
      const l = await getLoanStats();
      setSummary(s || {});
      setUserStats(u || {});
      setLoanStats(l || {});
    };

    fetchDashboardData();
  }, []);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const downloadCharts = () => {
    const element = chartRef.current;
    if (!element) return;

    html2canvas(element).then((canvas) => {
      const link = document.createElement("a");
      link.download = "dashboard_charts.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div className="adm-wrapper">
      {/* Stat Cards */}
      <div className="adm-stats-row">
        <div className="adm-stat-box">
          <FaUsers />
          <p>Total Users</p>
          <h3>{summary.totalUsers ?? 0}</h3>
        </div>
        <div className="adm-stat-box">
          <FaFileAlt />
          <p>Total Applications</p>
          <h3>{summary.totalLoanApplications ?? 0}</h3>
        </div>
        <div className="adm-stat-box">
          <FaCheckCircle />
          <p>Total Loan Sanctioned</p>
          <h3>₹{(summary.totalApprovedLoanAmount || 0).toLocaleString("en-IN")}</h3>
        </div>
        <div className="adm-stat-box">
          <FaRupeeSign />
          <p>Total Amount Received</p>

          <h3>₹{(summary.totalRepaidAmount || 0).toLocaleString("en-IN")}</h3>
        </div>
      </div>

      {/* Download Button */}
      <div className="adm-chart-download">
        <button onClick={downloadCharts}>
          <FaDownload style={{ marginRight: "8px" }} />
          Download Charts
        </button>
      </div>

      {/* Charts */}
      <div className="adm-charts" ref={chartRef}>
        {/* Pie Chart - Users */}
        <div className="adm-chart-card">
          <h4>User Breakdown</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {userData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === "Admins" ? "#00C49F" : "#12457b"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} Users`, name]}
                contentStyle={{ fontSize: "13px" }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend Below */}
          <div className="adm-legend-box">
            <div className="adm-legend-item">
              <div className="adm-legend-color" style={{ backgroundColor: "#00C49F" }} />
              <span>Admins</span>
            </div>
            <div className="adm-legend-item">
              <div className="adm-legend-color" style={{ backgroundColor: "#12457b" }} />
              <span>Customers</span>
            </div>
          </div>
        </div>

        {/* Bar Chart - Loans */}
        <div className="adm-chart-card">
          <h4>Loan Breakdown</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={loanData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [`${value} Loans`, name]}
                contentStyle={{ fontSize: "13px" }}
              />
              <Legend />
              <Bar dataKey="value" fill="#12457b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardMain;
