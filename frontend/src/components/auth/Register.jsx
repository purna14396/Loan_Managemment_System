import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { register } from "../../services/authService";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/auth/Register.css";

function Register() {
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
    adminKey: "",
  });

  const [strength, setStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [tempAdminKey, setTempAdminKey] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") evaluatePasswordStrength(value);
    if (name === "role" && value === "ADMIN") setShowAdminModal(true);
  };

  const evaluatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[\W_]/.test(password)) score++;

    const levels = ["Weak", "Moderate", "Strong", "Very Strong"];
    setStrength(levels[score - 1] || "");
  };

  const getStrengthColor = () => {
    const colors = {
      Weak: "#d32f2f",
      Moderate: "#f57c00",
      Strong: "#388e3c",
      "Very Strong": "#2e7d32",
    };
    return colors[strength] || "#999";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || form.username.length < 4) {
      return toast.error("Username must be at least 4 characters.");
    }
    const usernameRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/;
    if (!usernameRegex.test(form.username.trim())) {
      return toast.error("Username must be alphanumeric and contain both letters and numbers.");
    }

    if (!form.name.trim()) return toast.error("Full Name is required.");
    if (/\d/.test(form.name)) return toast.error("Full Name should not contain numbers.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return toast.error("Please enter a valid email address.");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      return toast.error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
    }

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (form.role === "ADMIN" && form.adminKey.trim() === "") {
      return toast.error("Admin key is required for admin registration");
    }

    const trimmedForm = {
      ...form,
      username: form.username.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      adminKey: form.role === "ADMIN" ? form.adminKey.trim() : null,
    };

    try {
      await register(trimmedForm);
      toast.success("Registered successfully!", {
        autoClose: 1200,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
      });

      setTimeout(() => {
        navigate("/login");
      }, 1300);
    } catch (err) {
      const msg = err.response?.data?.message || "Username or Email already exists";
      const adminKeyIssue = (
        msg.toLowerCase().includes("invalid admin") ||
        msg.toLowerCase().includes("missing admin") ||
        msg.toLowerCase().includes("admin secret key")
      );

      if (adminKeyIssue) {
        setForm((prev) => ({ ...prev, role: "CUSTOMER", adminKey: "" }));
        toast.error("Invalid Admin key. Role switched to Customer.");
      } else {
        toast.error(msg);
      }
    }
  };


  const handleAdminSave = () => {
    if (tempAdminKey.trim() === "") {
      toast.warn("Admin key is required. Switched to Customer role.");
      setForm((prev) => ({ ...prev, role: "CUSTOMER", adminKey: "" }));
    } else {
      setForm((prev) => ({ ...prev, adminKey: tempAdminKey }));
    }
    setShowAdminModal(false);
    setTempAdminKey("");
  };

  const handleAdminCancel = () => {
    setForm((prev) => ({ ...prev, role: "CUSTOMER" }));
    setTempAdminKey("");
    setShowAdminModal(false);
  };

  return (
    <div className="register-page">{/* ✅ PAGE-SPECIFIC WRAPPER */}
      <div className="auth-container">
        <h2 className="auth-heading">Register</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="left-column">
              <div className="input-group">
                <label>Username</label>
                <input name="username" value={form.username} onChange={handleChange} maxLength="30" placeholder="Enter your username" required />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" name="email" value={form.email} placeholder="Enter your email" onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Full Name</label>
                <input name="name" value={form.name} placeholder="Enter your full name" onChange={handleChange} maxLength="30" required />
              </div>
            </div>

            <div className="right-column">
              <div className="input-group password-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    maxLength="30"
                    placeholder="Create a strong password"
                    required
                  />
                  <span className="eye-icon" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                
                
                <small
                  className="password-strength"
                  style={{ color: form.password ? getStrengthColor() : "#999" }}
                >
                  {form.password ? `Password Strength: ${strength}` : ""}
                </small>

                
                
              </div>

              <div className="input-group password-group">
                <label>Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    maxLength="30"
                    placeholder="Re-enter your password"
                    required
                  />
                  <span className="eye-icon" onClick={() => setShowConfirm((prev) => !prev)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="auth-input-role">Role</label>
                <select className="auth-input" name="role" value={form.role} onChange={handleChange} required>
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>

          <button className="auth-button" type="submit">Register</button>
        </form>

        <div className="switch-link">
          Already have an account? <a href="/login" className="login-link">Login</a>
        </div>
      </div>

      {showAdminModal && (
        <div className="modal-overlay-auth">
          <div className="modal-content">
            <h3>Enter Secret Admin Key</h3>
            <input
              type="text"
              placeholder="Enter Admin Key"
              value={tempAdminKey}
              onChange={(e) => setTempAdminKey(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={handleAdminCancel} className="cancel-btn">Cancel</button>
              <button onClick={handleAdminSave} className="save-btn">Save</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={1500} // ✅ You can reduce to 2000 or 1500 for faster toast
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        draggable
      />

    </div>
  );
}

export default Register;
