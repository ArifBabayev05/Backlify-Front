import React from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="privacy-page-wrapper min-vh-100" style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a',
      color: '#ffffff'
    }}>
      {/* Subtle background pattern */}
      <div className="position-fixed w-100 h-100" style={{ 
        zIndex: -1, 
        background: `
          radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          #0a0a0a
        `,
        top: 0,
        left: 0
      }}></div>

      <Container className="py-5 position-relative" style={{ zIndex: 1, maxWidth: '1000px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Professional Header */}
          <div className="text-center mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <motion.h1 
              className="display-3 fw-bold mb-3"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Privacy Policy
            </motion.h1>
            <motion.div
              className="d-flex align-items-center justify-content-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div style={{ 
                width: '40px', 
                height: '2px', 
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' 
              }}></div>
              <span className="text-white fs-5 fw-medium">Backlify</span>
              <div style={{ 
                width: '40px', 
                height: '2px', 
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' 
              }}></div>
            </motion.div>
          </div>

          {/* Professional Content Card */}
          <motion.div
            className="position-relative mb-5"
            style={{
              background: 'rgba(15, 15, 15, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Subtle top border accent */}
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)',
              width: '100%'
            }}></div>
            
            <div className="p-5">
              <div className="text-white">
                <p className="fs-5 mb-5 text-light" style={{ lineHeight: '1.7' }}>
                  At Backlify, we value your privacy and are committed to protecting your personal information. 
                  This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
                </p>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#6366f1',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>1. Information We Collect</h2>
                  <p className="mb-4 text-light" style={{ lineHeight: '1.6' }}>We may collect the following types of information:</p>
                  <div className="ps-3">
                    <div className="mb-3 p-3" style={{ 
                      background: 'rgba(99, 102, 241, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #6366f1'
                    }}>
                      <strong className="text-white">Personal Information:</strong>
                      <span className="text-light ms-2">Name, email address, and other contact details provided when registering or using our services.</span>
                    </div>
                    <div className="mb-3 p-3" style={{ 
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #8b5cf6'
                    }}>
                      <strong className="text-white">Usage Data:</strong>
                      <span className="text-light ms-2">Information about your interaction with our platform, such as API usage, features accessed, and system logs.</span>
                    </div>
                    <div className="mb-3 p-3" style={{ 
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #3b82f6'
                    }}>
                      <strong className="text-white">Cookies and Tracking:</strong>
                      <span className="text-light ms-2">We may use cookies or similar technologies to enhance user experience and analyze platform usage.</span>
                    </div>
                  </div>
                </section>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#8b5cf6',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>2. How We Use Your Information</h2>
                  <p className="mb-4 text-light" style={{ lineHeight: '1.6' }}>We use the collected data to:</p>
                  <div className="ps-3">
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Provide, operate, and maintain Backlify services.</div>
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Improve and personalize user experience.</div>
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Communicate important updates, offers, or support information.</div>
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Analyze usage trends and monitor platform performance.</div>
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Ensure security and prevent fraudulent or unauthorized activity.</div>
                  </div>
                </section>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#3b82f6',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>3. Sharing Your Information</h2>
                  <p className="mb-4 text-light" style={{ lineHeight: '1.6' }}>We do not sell your personal information to third parties. We may share information with:</p>
                  <div className="ps-3">
                    <div className="mb-3 p-3" style={{ 
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #3b82f6'
                    }}>
                      <strong className="text-white">Service Providers:</strong>
                      <span className="text-light ms-2">Third-party vendors who help us provide and maintain Backlify.</span>
                    </div>
                    <div className="mb-3 p-3" style={{ 
                      background: 'rgba(99, 102, 241, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #6366f1'
                    }}>
                      <strong className="text-white">Legal Requirements:</strong>
                      <span className="text-light ms-2">When required by law or to protect our rights, users, or safety.</span>
                    </div>
                  </div>
                </section>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#6366f1',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>4. Data Security</h2>
                  <p className="text-light" style={{ lineHeight: '1.7' }}>
                    We implement appropriate technical and organizational measures to protect your data from unauthorized access, 
                    alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic 
                    storage is completely secure.
                  </p>
                </section>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#8b5cf6',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>5. Your Rights</h2>
                  <p className="mb-4 text-light" style={{ lineHeight: '1.6' }}>Depending on your location, you may have rights to:</p>
                  <div className="ps-3">
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Access and correct your personal data.</div>
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Request deletion or restriction of your data.</div>
                    <div className="mb-2 text-light" style={{ lineHeight: '1.6' }}>• Opt-out of marketing communications.</div>
                  </div>
                </section>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#3b82f6',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>6. Third-Party Links</h2>
                  <p className="text-light" style={{ lineHeight: '1.7' }}>
                    Backlify may contain links to third-party websites. We are not responsible for the privacy practices 
                    of these external sites and encourage you to review their privacy policies.
                  </p>
                </section>

                <section className="mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h2 className="h3 mb-4" style={{ 
                    color: '#6366f1',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>7. Changes to This Policy</h2>
                  <p className="text-light" style={{ lineHeight: '1.7' }}>
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h3 mb-4" style={{ 
                    color: '#8b5cf6',
                    fontWeight: '600',
                    fontSize: '1.5rem'
                  }}>8. Contact Us</h2>
                  <p className="mb-4 text-light" style={{ lineHeight: '1.6' }}>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
                  <div className="p-4" style={{ 
                    background: 'rgba(15, 15, 15, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div className="mb-3">
                      <strong className="text-white me-2">Email:</strong>
                      <span className="text-light">info@backlify.app</span>
                    </div>
                    <div>
                      <strong className="text-white me-2">Phone Number:</strong>
                      <span className="text-light">+994 51 856 16 21</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>

          {/* Professional Back Button */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link 
              to="/login" 
              className="btn px-5 py-3"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                fontWeight: '600',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 35px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
              }}
            >
              ← Back to Login
            </Link>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

export default PrivacyPage;
