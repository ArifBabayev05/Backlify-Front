import React from 'react';
import { motion } from 'framer-motion';
import { Container } from 'react-bootstrap';
import { useAuth } from '../components/auth/AuthContext';
import RequireAuth from '../components/auth/RequireAuth';
import NavBar from '../components/layout/NavBar';
import AdminUsagePanel from '../components/usage/AdminUsagePanel';

const AdminUsagePage = () => {
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.username === 'Admin';

  if (!isAdmin) {
    return (
      <RequireAuth>
        <div className="min-vh-100 d-flex align-items-center justify-content-center" 
             style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-white mb-4">Access Denied</h1>
            <p className="text-light">You don't have permission to access this page.</p>
          </motion.div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <NavBar />
        
        <Container className="py-5">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AdminUsagePanel />
          </motion.div>
        </Container>
      </div>
    </RequireAuth>
  );
};

export default AdminUsagePage;
