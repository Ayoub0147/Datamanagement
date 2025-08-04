import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './AuthContext';
import App from './App';
import Login from './Login';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';

const AppWrapper: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes - redirect to login if not authenticated */}
        <Route path="/*" element={user ? <App /> : <Login />} />
      </Routes>
    </Router>
  );
};

export default AppWrapper; 