import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Shifts from './pages/Shifts';
import Settings from './pages/Settings';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'cashier' ? '/pos' : '/'} replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin', 'cashier']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['admin', 'cashier']}>
              <POS />
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Inventory />
            </ProtectedRoute>
          } />

          <Route path="/shifts" element={
            <ProtectedRoute allowedRoles={['admin', 'cashier']}>
              <Shifts />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'cashier']}>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
