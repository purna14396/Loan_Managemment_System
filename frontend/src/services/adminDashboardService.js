import axios from "axios";

const BASE_URL = "http://localhost:8081/api/admin/dashboard";

export const getAdminSummary = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/summary`);
    return res.data;
  } catch (err) {
    console.error("Error fetching admin summary:", err);
    return null;
  }
};

export const getUserStats = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/users`);
    return res.data;
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return null;
  }
};

export const getLoanStats = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/loans`);
    return res.data;
  } catch (err) {
    console.error("Error fetching loan stats:", err);
    return null;
  }
};
