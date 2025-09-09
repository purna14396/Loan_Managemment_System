import axios from "axios";

const API_URL = "http://localhost:8081/api/admin/user-management";

export const validateSuperKey = async (key) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/validate-super-key`, {
    params: { key },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAllUsers = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteUser = async (userId) => {
  const token = localStorage.getItem("token");
  return axios.delete(`${API_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
