import React, { useState } from "react";
import { login, forgotPassword } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/auth/Login.css";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotForm, setForgotForm] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleForgotChange = (e) => {
    setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({
        username: form.username.trim(),
        password: form.password,
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);

      toast.success("Login successful!", { autoClose: 1200 });

      setTimeout(() => {
        if (res.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/customer/dashboard");
        }
      }, 1300);
    } catch {
      toast.error("Invalid username or password", { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    const { username, newPassword, confirmPassword } = forgotForm;
    if (!username || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 30) {
      toast.error("Password must be 8–30 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await forgotPassword({ username, newPassword, confirmPassword });
      toast.success("Password updated! Please login again.");
      setShowForgotModal(false);
      setForgotForm({ username: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-wrapper">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Login</h2>

            <div className="form-group-L">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                minLength={4}
                maxLength={30}
                required
              />
            </div>

            <div className="form-group-L">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  minLength={8}
                  maxLength={30}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <p className="forgot-password-link">
              <span onClick={() => setShowForgotModal(true)}>Forgot Password?</span>
            </p>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="switch-text">
              Don’t have an account? <a href="/register">Register</a>
            </p>
          </form>
        </div>
      </div>

      {showForgotModal && (
        <div className="modal-overlay-auth">
          <div className="modal-content">
            <h3>Reset Password</h3>
            <form onSubmit={handleForgotSubmit} className="modal-form-1">
              <div className="form-group-M">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={forgotForm.username}
                  onChange={handleForgotChange}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group-M">
                <label>New Password</label>
                <div className="password-field">
                  <input
                    type={showForgotPassword ? "text" : "password"}
                    name="newPassword"
                    value={forgotForm.newPassword}
                    onChange={handleForgotChange}
                    placeholder="Enter new password"
                    minLength={8}
                    maxLength={30}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowForgotPassword((prev) => !prev)}
                  >
                    {showForgotPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="form-group-M">
                <label>Confirm Password</label>
                <div className="password-field">
                  <input
                    type={showForgotConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={forgotForm.confirmPassword}
                    onChange={handleForgotChange}
                    placeholder="Confirm new password"
                    minLength={8}
                    maxLength={30}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowForgotConfirm((prev) => !prev)}
                  >
                    {showForgotConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="modal-buttons">
                <button type="button" className="cancel" onClick={() => setShowForgotModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        limit={2}
      />
    </>
  );
}

export default Login;
