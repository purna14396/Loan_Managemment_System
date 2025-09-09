// src/services/authService.js

import axios from "axios";

const API = "http://localhost:8081/api/auth";

export const login = async ({ username, password }) => {
  const response = await axios.post(
    `${API}/login`,
    { username, password },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    }
  );
  return response.data;
};

export const register = async ({
  name,
  email,
  username,
  password,
  role,
  adminKey,
}) => {
  const payload = {
    name,
    email,
    username,
    password,
    role,
  };

  if (role === "ADMIN" && adminKey) {
    payload.adminKey = adminKey;
  }

  const response = await axios.post(`${API}/register`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  return response.data;
};

/**
 * 🔁 forgotPassword()
 * --------------------------------------------
 * Sends forgot password request to backend.
 *
 * 📤 Input:  { username, newPassword, confirmPassword }
 * 🌐 POST:   /api/auth/update-password
 * 📥 Output: { message } or error
 */
export const forgotPassword = async ({ username, newPassword, confirmPassword }) => {
  const response = await axios.post(
    `${API}/update-password`,
    {
      username,
      newPassword,
      confirmPassword,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    }
  );

  return response.data;
};
