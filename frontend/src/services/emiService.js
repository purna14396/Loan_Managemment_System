// src/services/emiService.js
import axios from "axios";

const API = "http://localhost:8081/api/customer/loans";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getCustomerLoans = async () => {
  const res = await axios.get(`${API}`, { headers: authHeader() });
  return res.data; // array of loans
};

export const getLoanWithEmis = async (loanId) => {
  const res = await axios.get(`${API}/emi/${loanId}`, { headers: authHeader() });
  return res.data; // LoanWithEmiDto
};

export const payEmi = async (emiId) => {
  const res = await axios.post(`${API}/emi/pay/${emiId}`, {}, { headers: authHeader() });
  return res.data; // updated EmiPayment
};

// If your backend exposes a receipt download endpoint like below,
// this returns the URL to open in a new tab.
export const getEmiReceiptUrl = (emiId) => `${API}/emi/${emiId}/receipt`;
