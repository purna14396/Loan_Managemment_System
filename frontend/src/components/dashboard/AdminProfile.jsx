import React, { useEffect, useState } from "react";
import "../../styles/dashboard/Profile.css";
import { ToastContainer, toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

function AdminProfile() {
  const [user, setUser] = useState({});
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [passwordEditMode, setPasswordEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  useEffect(() => {
    fetch("http://localhost:8081/api/admin/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setForm({ ...data });
      })
      .catch(() => toast.error("Failed to fetch admin profile"));
  }, []);


  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateProfile = () => {
    const err = {};

    if (!form.name?.trim()) err.name = "Name is required";
    if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber)) err.contactNumber = "Must be 10 digits";
    if (form.alternatePhoneNumber && !/^\d{10}$/.test(form.alternatePhoneNumber)) err.alternatePhoneNumber = "Must be 10 digits";
    if (form.city?.length > 30) err.city = "Max 30 chars";
    if (form.state?.length > 30) err.state = "Max 30 chars";
    if (form.street?.length > 30) err.street = "Max 30 chars";
    if (form.country?.length > 30) err.country = "Max 30 chars";
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) err.pincode = "Must be 6 digits";
    if (form.gender && !["Male", "Female", "Prefer not to say"].includes(form.gender)) err.gender = "Invalid gender";
    if (form.dateOfBirth && form.dateOfBirth.length > 12) err.dateOfBirth = "Invalid date";

    return err;
  };

  const saveProfile = () => {
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      Object.values(validationErrors).forEach(msg => toast.error(msg, { autoClose: 1500 }));

      
      return;
    }

    fetch("http://localhost:8081/api/admin/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(data => {
        toast.success("Profile updated successfully");
        setUser(data);
        setEditMode(false);
        
      })
      .catch(() => toast.error("Failed to update profile"));
  };

  const validatePassword = () => {
    const { password, confirmPassword } = passwordForm;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!password) {
      toast.error("Password is required", { autoClose: 3000 });
      return false;
    }

    if (!passwordRegex.test(password)) {
      toast.error("Must be 8+ chars with uppercase, lowercase, number, special char", {
        autoClose: 3000,
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", { autoClose: 3000 });
      return false;
    }

    return true;
  };



  const savePassword = () => {
    if (!validatePassword()) return;

    fetch("http://localhost:8081/api/admin/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ ...user, password: passwordForm.password }),
    })
      .then(res => res.json())
      .then(() => {
        toast.success("Password updated successfully", { autoClose: 2000 });
        setPasswordEditMode(false);
        setPasswordForm({ password: "", confirmPassword: "" });
      })
      .catch(() => toast.error("Failed to update password", { autoClose: 2000 }));
  };



  return (
    <div className="profile-board">
      <ToastContainer position="top-center" autoClose={1500} pauseOnHover={false} pauseOnFocusLoss={false} />

      {/* Admin Profile Section */}
      <div className="profile-card">
        <h2>Admin Profile</h2>

        <form className="profile-form three-column-grid">
          {/* Name */}
          <div className="form-group">
            <label>Name:</label>
            <input name="name" maxLength={30} placeholder="Enter full name" value={form.name || ""} onChange={handleProfileChange} readOnly={!editMode} style={{ backgroundColor: editMode ? "white" : "#eee" }} />
          </div>

          <div className="form-group">
            <label>Username:</label>
            <input name="username" value={form.username || ""} readOnly style={{ backgroundColor: "#eee" }} />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input name="email" value={form.email || ""} readOnly style={{ backgroundColor: "#eee" }} />
          </div>

          <div className="form-group">
            <label>Contact Number:</label>
            <input
              name="contactNumber"
              value={form.contactNumber || ""}
              onChange={handleProfileChange}
              readOnly={!editMode}
              maxLength={10}
              placeholder="Enter contact number"
              pattern="\d{10}"
              style={{ backgroundColor: editMode ? "white" : "#eee" }}
              inputMode="numeric"
            />
          </div>

          <div className="form-group">
            <label>Alternate Phone:</label>
            <input
              name="alternatePhoneNumber"
              value={form.alternatePhoneNumber || ""}
              onChange={handleProfileChange}
              readOnly={!editMode}
              maxLength={10}
              pattern="\d{10}"
              placeholder="Enter alternate number"
              style={{ backgroundColor: editMode ? "white" : "#eee" }}
              inputMode="numeric"
            />
          </div>

          <div className="form-group">
            <label>Date of Birth:</label>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth || ""}
              onChange={handleProfileChange}
              readOnly={!editMode}
              placeholder="Select date of birth"
              max={new Date().toISOString().split("T")[0]}
              style={{ backgroundColor: editMode ? "white" : "#eee" }}
            />
          </div>

          <div className="form-group">
            <label>Gender:</label>
            <select name="gender" value={form.gender || ""} onChange={handleProfileChange} disabled={!editMode} style={{ backgroundColor: editMode ? "white" : "#eee" }}>
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label>Street:</label>
            <input name="street" placeholder="Enter street name" value={form.street || ""} onChange={handleProfileChange} readOnly={!editMode} maxLength={30} style={{ backgroundColor: editMode ? "white" : "#eee" }} />
          </div>

          <div className="form-group">
            <label>City:</label>
            <input name="city" placeholder="Enter city" maxLength={30} value={form.city || ""} onChange={handleProfileChange} readOnly={!editMode} style={{ backgroundColor: editMode ? "white" : "#eee" }} />
          </div>

          <div className="form-group">
            <label>State:</label>
            <input name="state" placeholder="Enter state" maxLength={30} value={form.state || ""} onChange={handleProfileChange} readOnly={!editMode} style={{ backgroundColor: editMode ? "white" : "#eee" }} />
          </div>

          <div className="form-group">
            <label>Pincode:</label>
            <input name="pincode" placeholder="Enter 6-digit pincode" value={form.pincode || ""} onChange={handleProfileChange} readOnly={!editMode} maxLength={6} style={{ backgroundColor: editMode ? "white" : "#eee" }} />
          </div>

          <div className="form-group">
            <label>Country:</label>
            <input name="country" placeholder="Enter country" maxLength={30} value={form.country || ""} onChange={handleProfileChange} readOnly={!editMode}  style={{ backgroundColor: editMode ? "white" : "#eee" }} />
          </div>

          <div className="form-group">
            <label>Role:</label>
            <input value={user.role || ""} readOnly style={{ backgroundColor: "#eee" }} />
          </div>
        </form>

        <div style={{ marginTop: "1rem" }}>
          {editMode ? (
            <>
              <button className="save" onClick={saveProfile}>Save Changes</button>
              <button
                className="cancel"
                onClick={() => {
                  setForm({ ...user });
                  setEditMode(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="profile-card">
        <h3>Change Password</h3>
        {passwordEditMode ? (
          <>
            <div className="password-row">
              <div className="password-form-group">
                <label>New Password:</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  />
                  <span onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="password-form-group">
                <label>Confirm Password:</label>
                <div className="password-field">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                  <span onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="password-button-row">
                <button className="save" onClick={savePassword}>Save</button>
                <button
                  className="cancel"
                  onClick={() => {
                    setPasswordForm({ password: "", confirmPassword: "" });
                   
                    setPasswordEditMode(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : (
          <button className="edit-btn" onClick={() => setPasswordEditMode(true)}>Edit Password</button>
        )}
      </div>
    </div>
  );
}

export default AdminProfile;