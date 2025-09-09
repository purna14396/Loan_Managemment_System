import React from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/global/LogoutButton.css"; // 👈 Custom styles here

function LogoutButton() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    toast.success("You have been logged out!", {
      position: "top-center",
      autoClose: 2000,
    });

    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <>
      <button className="logout-btn" onClick={logout}>
        Logout
      </button>
      <ToastContainer />
    </>
  );
}

export default LogoutButton;
