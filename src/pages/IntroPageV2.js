import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useViewportScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import '../styles/IntroPageV2.css'; // Import the new CSS

// --- Mock Data (Refined) ---
const features = [
  {
    icon: '🎨',
    title: 'Visual API Canvas',
    description: 'Design APIs with an intuitive drag-and-drop canvas. Connect endpoints, data, and logic blocks visually.'
  },
  {
    icon: '🧩',
    title: 'Intelligent Logic Blocks',
    description: 'Use pre-built components for authentication, validation, and data transformation to build complex workflows.'
  },
  {
    icon: '🚀',
    title: 'One-Click Deployment',
    description: 'Deploy your APIs to a global CDN instantly. We handle scaling, monitoring, and security.'
  },
  {
    icon: '👥',
    title: 'Real-time Collaboration',
    description: 'Work with your team in real-time. Share canvases, review changes, and deploy together with built-in version control.'
  },
];

const pricingPlans = [
    {
        id: 'free',
        name: 'Hobby',
        price: '$0',
        description: 'For personal projects & learning the ropes.',
        features: ['1 User', '3 Projects', '10,000 API Calls/mo', 'Community Support'],
        buttonText: 'Start for Free',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        description: 'For professionals and small teams.',
        features: ['5 Users', 'Unlimited Projects', '1 Million API Calls/mo', 'Email Support', 'Custom Domains'],
        buttonText: 'Choose Pro',
        isPopular: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large-scale applications and organizations.',
        features: ['Unlimited Users', 'Dedicated Infrastructure', '24/7 Support', 'SSO & SAML Login'],
        buttonText: 'Contact Sales',
    },
];

// --- Animation Variants ---
const sectionVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
  }
};

const cardVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { 
        delay: i * 0.15,
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

// --- Reusable Components ---
const AnimatedSection = ({ children }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  useEffect(() => {
    if (inView) controls.start('visible');
  }, [controls, inView]);

  return (
    <motion.section 
      ref={ref} 
      animate={controls} 
      initial="hidden" 
      variants={sectionVariant}
      className="ip-v2-section"
    >
      {children}
    </motion.section>
  );
};

const MeshGradientBackground = () => {
    const { scrollYProgress } = useViewportScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
    const x2 = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
    return (
      <div className="mesh-gradient-container">
        <motion.div className="circle c1" style={{ y: y1 }} />
        <motion.div className="circle c2" style={{ x: x2 }} />
      </div>
    );
  };

// --- Main Page Component ---
const IntroPageV2 = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="ip-v2-wrapper">
      <MeshGradientBackground />

      {/* --- Navigation --- */}
      <nav className={`ip-v2-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="ip-v2-nav-container">
          <div className="ip-v2-font-mono" style={{fontWeight: 'bold', fontSize: '1.5rem'}}>Backlify</div>
          <div className="desktop-nav" style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
            <a href="#features" className="footer-link">Features</a>
            <a href="#pricing" className="footer-link">Pricing</a>
            <button className="ip-v2-btn ip-v2-btn-secondary">Sign In</button>
            <button className="ip-v2-btn ip-v2-btn-primary">Get Started</button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="ip-v2-hero">
        <motion.h1 
            className="ip-v2-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
        >
          Build Your Backend <br />
          <span className="ip-v2-gradient-text">Visually. Instantly.</span>
        </motion.h1>
        <motion.p 
            className="ip-v2-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
        >
          The AI-powered no-code platform for creating powerful, scalable APIs.
          Describe your logic, and let Backlify handle the rest.
        </motion.p>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
        >
            <button className="ip-v2-btn ip-v2-btn-primary" style={{padding: '1.2rem 2.5rem', fontSize: '1.1rem'}}>✨ Start Building for Free</button>
        </motion.div>
      </header>

      <main>
        {/* --- Features Section --- */}
        <AnimatedSection>
            <div className="ip-v2-section-header">
                <h2 className="ip-v2-section-title">An Entire Backend Team in One Platform</h2>
                <p className="ip-v2-section-subtitle">From database design to deployment, get all the tools you need to launch faster.</p>
            </div>
            <div className="features-grid">
                {features.map((feature, i) => (
                <motion.div className="feature-card-v2" key={i} custom={i} initial="hidden" animate="visible" variants={cardVariant}>
                    <div style={{fontSize: '2.5rem', marginBottom: '1rem'}}>{feature.icon}</div>
                    <h3 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem'}}>{feature.title}</h3>
                    <p className="ip-v2-text-secondary">{feature.description}</p>
                </motion.div>
                ))}
            </div>
        </AnimatedSection>

        {/* --- Pricing Section --- */}
        <AnimatedSection>
            <div className="ip-v2-section-header">
                <h2 className="ip-v2-section-title">Pricing That Scales with You</h2>
                <p className="ip-v2-section-subtitle">Start for free and upgrade as you grow. No hidden fees, ever.</p>
            </div>
            <div className="pricing-grid">
                {pricingPlans.map((plan, i) => (
                    <motion.div className={`pricing-card-v2 ${plan.isPopular ? 'popular' : ''}`} key={plan.id} custom={i} initial="hidden" animate="visible" variants={cardVariant}>
                        {plan.isPopular && <div className="popular-badge">Most Popular</div>}
                        <div style={{textAlign: 'center'}}>
                            <h3 style={{fontSize: '1.75rem', fontWeight: '600'}}>{plan.name}</h3>
                            <p className="ip-v2-text-secondary mb-4">{plan.description}</p>
                            <div style={{fontSize: '3rem', fontWeight: '700', margin: '1rem 0'}}>{plan.price}</div>
                            <p className="ip-v2-text-secondary" style={{fontSize: '0.9rem'}}>{plan.price !== '$0' && '/ month'}</p>
                        </div>
                        <ul style={{listStyle: 'none', padding: 0, margin: '2rem 0', flexGrow: 1}}>
                            {plan.features.map(f => <li key={f} style={{marginBottom: '1rem'}}>✅ {f}</li>)}
                        </ul>
                        <button className={`ip-v2-btn ${plan.isPopular ? 'ip-v2-btn-primary' : 'ip-v2-btn-secondary'}`} style={{width: '100%'}}>{plan.buttonText}</button>
                    </motion.div>
                ))}
            </div>
        </AnimatedSection>

        {/* --- CTA Section --- */}
        <AnimatedSection>
            <div className="ip-v2-section-header">
                <h2 className="ip-v2-section-title">Ready to Build Your Next Idea?</h2>
                <p className="ip-v2-section-subtitle">Go from concept to production-ready API in minutes. Your first project is on us.</p>
                <button className="ip-v2-btn ip-v2-btn-primary" style={{padding: '1.2rem 2.5rem', fontSize: '1.1rem', marginTop: '2rem'}}>Get Started - It's Free</button>
            </div>
        </AnimatedSection>
      </main>

      {/* --- Footer --- */}
      <footer style={{textAlign: 'center', padding: '4rem 2rem', borderTop: '1px solid var(--v2-border-color)'}}>
        <p>© {new Date().getFullYear()} Backlify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default IntroPageV2;
