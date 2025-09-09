// src/routes/ProtectedRoute.js

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

/**
 * 🔒 ProtectedRoute
 * -----------------------------------------
 * Purpose:
 *    Prevents unauthorized users from accessing private routes.
 * 
 * Props:
 *    children - The component to render if authorized
 *    role     - (optional) Expected role ("ADMIN" or "CUSTOMER")
 *
 * Logic:
 *    ✅ Checks for token in localStorage
 *    ✅ Optionally checks if user's role matches the required role
 *    🚫 Redirects to /login if unauthorized
 */
function ProtectedRoute({ children, role }) {
  const [isLoading, setIsLoading] = useState(true);      // For transition/loading state
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    // Simulate slight delay (can be removed)
    setTimeout(() => {
      if (!token) {
        setIsAuthorized(false);                           // Not logged in
      } else if (role && userRole !== role) {
        setIsAuthorized(false);                           // Role mismatch
      } else {
        setIsAuthorized(true);                            // Access granted
      }
      setIsLoading(false);
    }, 100);
  }, [role]);

  // While checking auth status
  if (isLoading) {
    return <div className="loading">Checking authorization...</div>;
  }

  // 🚫 Redirect to login if unauthorized
  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

  // ✅ Render child component if authorized
  return children;
}

export default ProtectedRoute;
