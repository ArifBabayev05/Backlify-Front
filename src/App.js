import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';

// Import pages
import LandingPage from './pages/LandingPage';
import SchemaPage from './pages/SchemaPage';
import EndpointsPage from './pages/EndpointsPage';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/schema" element={<SchemaPage />} />
          <Route path="/endpoints" element={<EndpointsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
          },
        }}
      />
    </>
  );
}

export default App;
