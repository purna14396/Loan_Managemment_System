// src/routes/AppRoutes.js
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import Home from '../components/home/Home';

import AdminDashboard from '../components/dashboard/AdminDashboard';
import AdminProfile from '../components/dashboard/AdminProfile';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import CustomerLoanList from '../components/loan/customerLoan/CustomerLoanList';

import CustomerProfile from '../components/dashboard/CustomerProfile';

import EmiPaymentsPage from '../components/emi/EmiPaymentsPage'; // ✅ ADD
import ApplyLoanForm from '../components/loan/customerLoan/ApplyLoanForm';

import ProtectedRoute from './ProtectedRoute';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* ✅ Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔐 Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* 🔐 Customer with nested routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute role="CUSTOMER">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="apply-loan" element={<ApplyLoanForm />} />
          <Route path="emi" element={<EmiPaymentsPage />} />
          <Route path="applications" element={<CustomerLoanList />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
