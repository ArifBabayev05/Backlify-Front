import React from 'react';
import { Spinner } from 'react-bootstrap';

const GlobalSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" 
         style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999 }}>
      <Spinner animation="border" variant="primary" className="mb-4" style={{ width: '3rem', height: '3rem' }} />
      <p className="text-white fs-5">{text}</p>
    </div>
  );
};

export default GlobalSpinner; 