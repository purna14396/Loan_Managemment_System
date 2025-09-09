import { useCallback, useEffect, useState } from "react";
import "../../../styles/loan/adminloan/UserManagementPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  validateSuperKey,
  getAllUsers,
  deleteUser
} from "../../../services/userManagementService";
import { FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortLoanOption, setSortLoanOption] = useState("");
  const [sortDateOption, setSortDateOption] = useState("");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteUserRole, setDeleteUserRole] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(true);
  const [enteredKey, setEnteredKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  }, []);

  useEffect(() => {
    if (!authModalOpen) {
      fetchUsers();
    }
  }, [fetchUsers, authModalOpen]);

  useEffect(() => {
    setSearchTerm("");
    setRoleFilter("All");
    setSortLoanOption("");
    setSortDateOption("");
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setShowFilters(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    let updated = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      updated = updated.filter(
        (user) =>
          user.username?.toLowerCase().includes(term) ||
          (user.userId ?? user.id)?.toString().includes(term) ||
          user.email?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== "All") {
      updated = updated.filter((user) => user.role === roleFilter);
    }

    if (sortLoanOption === "loanAsc") {
      updated.sort((a, b) => (a.activeLoanCount ?? 0) - (b.activeLoanCount ?? 0));
    } else if (sortLoanOption === "loanDesc") {
      updated.sort((a, b) => (b.activeLoanCount ?? 0) - (a.activeLoanCount ?? 0));
    }

    if (sortDateOption === "dateAsc") {
      updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortDateOption === "dateDesc") {
      updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredUsers(updated);
  }, [users, searchTerm, roleFilter, sortLoanOption, sortDateOption]);

  const handleDelete = async (id, role) => {
    try {
      await deleteUser(id);
      toast.success(
        `${role === "ADMIN" ? "Admin" : "Customer"} with ID U${id} deleted successfully`
      );
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const handleKeySubmit = async () => {
    try {
      const isValid = await validateSuperKey(enteredKey);
      if (isValid) {
        setAuthModalOpen(false);
        toast.success("Access granted");
      } else {
        toast.error("Invalid secret key");
      }
    } catch (err) {
      toast.error("Error validating key");
    }
  };

  return (
    <div className="user-management-page-wrapper">
      {/* 🔑 Access Key Modal */}
      {authModalOpen && (
        <div className="user-modal-overlay">
          <div className="user-modal-content">
            <h3>User Management Access</h3>
            <p>Enter the secret access key to continue</p>
            <label className="user-password-label-wrapper">
              <input
                type={showKey ? "text" : "password"}
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                placeholder="Enter secret key..."
                className="user-management-filter-input"
              />
              <span
                className="user-password-eye"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <FaEyeSlash /> : <FaEye />}
              </span>
            </label>
            <div className="user-modal-buttons">
              <button className="user-cancel-btn" onClick={() => setEnteredKey("")}>
                Clear
              </button>
              <button className="user-confirm-key-btn" onClick={handleKeySubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔽 Toggle Filter Button */}
      
      {!authModalOpen && !showDeleteModal && (
        <button
          className="user-toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
        </button>
      )}

      
      

      {/* 🧠 Filters Section (Responsive) */}
      {!authModalOpen && !showDeleteModal && showFilters && (
        <div className={`user-management-filter-fixed open`}>
          <div className="user-management-filter-card">
            <div className="user-management-filter-group">
              <label>Search Users</label>
              <input
                type="text"
                placeholder="User ID, Username, or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="user-management-filter-input"
                autoComplete="off"
              />
            </div>
            <div className="user-management-filter-group">
              <label>Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="user-management-filter-input"
              >
                {["All", "ADMIN", "CUSTOMER"].map((role) => (
                  <option key={role} value={role}>
                    {role === "All"
                      ? "All"
                      : role.charAt(0) + role.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="user-management-filter-group">
              <label>Sort by Loan Count</label>
              <select
                value={sortLoanOption}
                onChange={(e) => setSortLoanOption(e.target.value)}
                className="user-management-filter-input"
              >
                <option value="">None</option>
                <option value="loanAsc">Loan Count (ASC)</option>
                <option value="loanDesc">Loan Count (DESC)</option>
              </select>
            </div>
            <div className="user-management-filter-group">
              <label>Sort by Registration Date</label>
              <select
                value={sortDateOption}
                onChange={(e) => setSortDateOption(e.target.value)}
                className="user-management-filter-input"
              >
                <option value="">None</option>
                <option value="dateAsc">Registration Date (ASC)</option>
                <option value="dateDesc">Registration Date (DESC)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ Filter Tags */}
      <div className="user-active-filter-tags">
        {searchTerm && (
          <span className="user-filter-badge">Search: "{searchTerm}"</span>
        )}
        {roleFilter !== "All" && (
          <span className="user-filter-badge">Role: {roleFilter}</span>
        )}
        {sortLoanOption && (
          <span className="user-filter-badge">
            Loan Sort: {sortLoanOption.replace(/([A-Z])/g, " $1")}
          </span>
        )}
        {sortDateOption && (
          <span className="user-filter-badge">
            Date Sort: {sortDateOption.replace(/([A-Z])/g, " $1")}
          </span>
        )}
        {(searchTerm || roleFilter !== "All" || sortLoanOption || sortDateOption) && (
          <div className="user-clear-filters-inline">
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("All");
                setSortLoanOption("");
                setSortDateOption("");
              }}
              className="user-filter-clear-btn"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* 🧑‍💼 Table Header */}
      <div className="user-management-section-header-wrapper">
        <h3 className="user-management-section-heading">User Management</h3>
        <p className="user-management-count-label">
          Showing {filteredUsers.length} users
        </p>
      </div>

      {/* 📋 Table Section */}
      <div className="user-management-table-wrapper">
        <div className="user-management-table-scroll">
          <table className="user-management-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role & Active Loan Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const idValue = user.userId ?? user.id;
                return (
                  <tr key={idValue}>
                    <td>U{idValue}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.username}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          className={`user-status-badge ${
                            user.role === "ADMIN" ? "admin" : "customer"
                          }`}
                        >
                          {user.role}
                        </span>
                        {user.role === "CUSTOMER" && (
                          <span className="user-filter-badge">
                            {user.activeLoanCount ?? 0}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="user-actions">
                      <button
                        className="user-delete-btn"
                        onClick={() => {
                          if (
                            user.role === "CUSTOMER" &&
                            (user.activeLoanCount ?? 0) > 0
                          ) {
                            toast.error(
                              "Cannot delete. This customer has active loans."
                            );
                            return;
                          }
                          setDeleteUserId(idValue);
                          setDeleteUserRole(user.role);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash style={{ marginRight: "6px" }} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="user-no-data-message">No users found.</div>
        )}
      </div>

      {/* ❗ Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="user-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div
            className="user-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h4>
              Are you sure you want to delete{" "}
              <span style={{ color: "#d9534f" }}>
                {deleteUserRole} with ID U{deleteUserId}
              </span>
              &nbsp;?
            </h4>
            <div className="user-modal-buttons">
              <button className="user-cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="user-confirm-delete-btn"
                onClick={() => {
                  handleDelete(deleteUserId, deleteUserRole);
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default UserManagementPage;
