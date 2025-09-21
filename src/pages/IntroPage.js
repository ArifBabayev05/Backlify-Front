import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Card, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-hot-toast';
import backlifyIcon from '../assets/icons/backlify.png';
import subscriptionService from '../utils/subscriptionService';

// Mock data for AI API platform
const mockFeatures = [
  {
    title: 'AI Schema Generation',
    description: 'Transform natural language into optimized database schemas instantly. Our AI understands relationships, constraints, and best practices.',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop&crop=entropy',
    icon: '⚡',
    stats: '10x faster development'
  },
  {
    title: 'No-Code Visual API Builder',
    description: 'Design complex API workflows with drag-and-drop simplicity. Connect databases, external services, and business logic without writing code.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=entropy',
    icon: '🔧',
    stats: '500+ integrations'
  },
  {
    title: 'Enterprise-Grade Security',
    description: 'Built-in authentication, rate limiting, and monitoring. Deploy to cloud or on-premises with automatic scaling and 99.9% uptime guarantee.',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop&crop=entropy',
    icon: '🛡️',
    stats: '99.9% uptime SLA'
  },
  {
    title: 'Real-Time Analytics',
    description: 'Track API performance, usage patterns, and errors in real-time. Get actionable insights to optimize your APIs and improve user experience.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=entropy',
    icon: '📊',
    stats: 'Real-time insights'
  },
];

const mockPricingPlans = [
  {
    id: 'starter',
    name: 'Developer',
    price: 0,
    description: 'Perfect for learning and prototyping',
    features: ['3 API endpoints', '10K requests/month', 'Community support', 'Basic templates', 'Development environment'],
    buttonText: 'Start Free'
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49,
    description: 'For growing businesses and teams',
    features: ['Unlimited API endpoints', '1M requests/month', 'Priority support', 'Advanced integrations', 'Team collaboration', 'Custom domains', 'Analytics dashboard'],
    isPopular: true,
    buttonText: 'Start Trial'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: ['Unlimited everything', 'Dedicated infrastructure', 'Custom SLA', 'On-premise deployment', 'SSO integration', '24/7 phone support', 'Custom training'],
    buttonText: 'Contact Sales'
  },
];

const steps = [
  {
    number: '01',
    title: 'Describe Your Idea',
    description: 'Simply describe what you want to build in natural language. Our AI understands complex requirements and relationships.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop&crop=entropy',
    mockup: 'Chat interface: "Create an e-commerce API with users, products, and orders"'
  },
  {
    number: '02',
    title: 'AI Generates Your Backend',
    description: 'Backlify\'s AI analyzes your text and instantly creates database tables, relationships, and API endpoints with full documentation.',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop&crop=entropy',
    mockup: 'Code generation interface showing auto-generated endpoints'
  },
  {
    number: '03',
    title: 'Deploy and Integrate',
    description: 'Your API is live instantly! Connect it to your frontend application and launch your project in record time.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop&crop=entropy',
    mockup: 'Dashboard showing API metrics and deployment status'
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CTO at TechFlow',
    company: 'TechFlow',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=faces',
    quote: 'Backlify reduced our API development time from weeks to hours. The AI understands exactly what we need.'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Lead Developer at DataSync',
    company: 'DataSync',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=faces',
    quote: 'The no-code visual builder is incredible. I can prototype APIs faster than ever before.'
  },
  {
    name: 'Emily Watson',
    role: 'Product Manager at CloudBase',
    company: 'CloudBase',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=faces',
    quote: 'Enterprise security out of the box. Backlify handles compliance so we can focus on innovation.'
  }
];

const IntroPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const pricingRef = useRef(null);
  const featureItemRefs = useRef([]);
  const lastActiveFeatureRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
      }
    };
    
    // Only add scroll listener on desktop
    if (window.innerWidth >= 992) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (window.innerWidth >= 992) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    // Only use intersection observer on desktop
    if (window.innerWidth < 992) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroRef.current) {
            setIsVisible(prev => ({ ...prev, hero: entry.isIntersecting }));
          } else if (entry.target === featuresRef.current) {
            setIsVisible(prev => ({ ...prev, features: entry.isIntersecting }));
          } else if (entry.target === stepsRef.current) {
            setIsVisible(prev => ({ ...prev, steps: entry.isIntersecting }));
          } else if (entry.target === pricingRef.current) {
            setIsVisible(prev => ({ ...prev, pricing: entry.isIntersecting }));
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (stepsRef.current) observer.observe(stepsRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);

    return () => observer.disconnect();
  }, []);

  // Scroll-progress based feature switching (desktop only)
  useEffect(() => {
    // Only run on desktop (lg and above)
    const isDesktop = window.innerWidth >= 992;
    if (!isDesktop) return;

    let ticking = false;
    
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!featuresRef.current) {
            ticking = false;
            return;
          }
          
          const sectionEl = featuresRef.current;
          const rect = sectionEl.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const sectionHeight = sectionEl.offsetHeight;
          
          // Only compute when section is visible
          const isInViewport = rect.bottom > 0 && rect.top < windowHeight;
          
          if (!isInViewport) {
            ticking = false;
            return;
          }

          const totalScrollable = Math.max(sectionHeight - windowHeight, 1);
          const scrolled = Math.min(Math.max(-rect.top, 0), totalScrollable);
          const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
          const total = mockFeatures.length;
          const index = Math.min(total - 1, Math.floor(progress * total));

          if (index !== lastActiveFeatureRef.current && index >= 0 && index < total) {
            lastActiveFeatureRef.current = index;
            setActiveFeatureIndex(index);
          }
          
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load subscription plans
  useEffect(() => {
    const loadSubscriptionPlans = async () => {
      try {
        setPlansLoading(true);
        const plans = await subscriptionService.getSubscriptionPlans();
        setSubscriptionPlans(plans.length ? plans : mockPricingPlans);
      } catch (error) {
        console.error('Error loading subscription plans:', error);
        setSubscriptionPlans(mockPricingPlans);
      } finally {
        setPlansLoading(false);
      }
    };

    loadSubscriptionPlans();
  }, []);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      toast.success('Message sent successfully!');
      setContactForm({ email: '', message: '' });
      setIsSending(false);
    }, 2000);
  };

  const handleStartClick = (e) => {
      e.preventDefault();
    if (window.innerWidth < 768) {
      setShowMobileWarning(true);
    } else {
      window.location.href = "/register";
    }
  };

  const plansToShow = subscriptionPlans.length ? subscriptionPlans : mockPricingPlans;
  useEffect(() => {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
      const toggleNavbar = () => {
        if (navbarCollapse.classList.contains('show')) {
          navbarCollapse.classList.remove('show');
          navbarCollapse.classList.add('collapsing');
          setTimeout(() => {
            navbarCollapse.classList.remove('collapsing');
          }, 350);
        } else {
          navbarCollapse.classList.add('collapsing');
          setTimeout(() => {
            navbarCollapse.classList.remove('collapsing');
            navbarCollapse.classList.add('show');
          }, 10);
        }
      };
      
      navbarToggler.addEventListener('click', toggleNavbar);
      
      // Close menu when clicking on nav links (mobile)
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
            toggleNavbar();
          }
        });
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && 
            navbarCollapse.classList.contains('show') &&
            !navbarCollapse.contains(e.target) &&
            !navbarToggler.contains(e.target)) {
          toggleNavbar();
        }
      });
      
      return () => {
        navbarToggler.removeEventListener('click', toggleNavbar);
        navLinks.forEach(link => {
          link.removeEventListener('click', toggleNavbar);
        });
      };
    }
  }, []);
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Outfit', sans-serif;
          background: #0B0D17;
          color: #E2E8F0;
          overflow-x: hidden;
        }

        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 50%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-text-alt {
          background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-bg {
          background:
            radial-gradient(circle at 30% 20%, rgba(0, 210, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(58, 123, 213, 0.08) 0%, transparent 50%);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border-radius: 20px;
        }

        .api-card {
          background: linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border: 1px solid rgba(0, 210, 255, 0.2);
          backdrop-filter: blur(20px);
          border-radius: 16px;
        }

        .glow-effect {
          box-shadow: 0 0 60px rgba(0, 210, 255, 0.15);
        }

        .popular-plan {
          position: relative;
          overflow: visible;
        }

        .popular-plan::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #1e40af, #7c3aed, #1e40af);
          border-radius: 16px;
          z-index: -1;
          animation: borderGlow 3s ease-in-out infinite;
        }

        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .pricing-button {
          position: relative;
          overflow: hidden;
        }

        .pricing-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .pricing-button:hover::before {
          left: 100%;
        }

        .glow-purple {
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.2);
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-slide-in {
          opacity: 0;
          transform: translateX(-40px);
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-slide-in.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .animate-scale {
          transform: scale(0.9);
          opacity: 0;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-scale.visible {
          transform: scale(1);
          opacity: 1;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(0, 210, 255, 0.4);
          border-radius: 50%;
          animation: particles 25s linear infinite;
        }

        @keyframes particles {
          0% { transform: translateY(100vh) translateX(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(150px) rotate(360deg); opacity: 0; }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .bg-grid {
          background-image: radial-gradient(circle at 2px 2px, rgba(0, 210, 255, 0.15) 2px, transparent 0);
          background-size: 60px 60px;
        }

        .hover-lift:hover {
          transform: translateY(-10px);
          transition: transform 0.4s ease;
        }

        .nav-blur {
          backdrop-filter: blur(30px);
          background: rgba(11, 13, 23, 0.95);
          transition: all 0.3s ease;
          will-change: transform;
        }

        .nav-blur.scrolled {
          background: rgba(11, 13, 23, 0.98);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

     

       

        .code-snippet {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 210, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          font-family: 'JetBrains Mono', monospace;
        }

        .api-endpoint {
          background: linear-gradient(90deg, rgba(0, 210, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-left: 3px solid #00D2FF;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 8px 0;
        }

        .metric-card {
          background: linear-gradient(135deg, rgba(0, 210, 255, 0.08) 0%, rgba(58, 123, 213, 0.08) 100%);
          border: 1px solid rgba(0, 210, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .btn-primary {
          background: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%);
          border: none;
          transition: all 0.3s ease;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #00B8E6 0%, #3369BB 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 210, 255, 0.3);
          color: white;
        }

        .btn-outline {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: #E2E8F0;
          transition: all 0.3s ease;
          padding: 14px 30px;
          border-radius: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(0, 210, 255, 0.5);
          color: #00D2FF;
        }

        /* Bootstrap Integration */
        .section-padding { padding: 5rem 0; }
        
        .custom-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Typography Responsive */
        .hero-title {
            font-size: clamp(1.5rem, 4vw, 3.5rem); /* mobil → kiçik, desktop → böyük */
          line-height: 1.1;
          text-align: center;
          justify-content: center;
          align-items: center;
          display: grid;
        }
        .hero-title span {
  font-size: clamp(2.2rem, 5vw, 2.5rem);
            display: grid;
            text-align: center;
            justify-content: center;
            align-items: center;
}
        .section-title {
          font-size: clamp(2rem, 6vw, 3.5rem);
          line-height: 1.2;
        }
        
        .hero-subtitle {
          font-size: clamp(1rem, 3vw, 1.5rem);
          line-height: 1.6;
        }

        /* Mobile-First Responsive Design */
        @media (max-width: 575.98px) {
          .section-padding { padding: 2rem 0; }
          .hero-bg { 
            padding-top: 4rem !important; 
            padding-bottom: 2rem !important; 
            min-height: 100vh;
          }
          .display-1 { 
            font-size: 2.2rem !important; 
            line-height: 1.1;
            margin-bottom: 1rem !important;
          }
          .display-4 { 
            font-size: 1.6rem !important; 
            line-height: 1.2;
          }
          .btn-lg { 
            padding: 0.75rem 1.5rem; 
            font-size: 0.9rem; 
            width: 100%;
            margin-bottom: 0.5rem;
          }
          .hero-title { 
            font-size: 2rem !important; 
            line-height: 1.15;
            margin-bottom: 1.5rem !important;
            letter-spacing: -0.02em;
            word-spacing: -0.1em;
          }
          .section-title { 
            font-size: 1.6rem !important; 
            line-height: 1.25;
            margin-bottom: 1rem !important;
            letter-spacing: -0.01em;
          }
          .hero-subtitle {
            font-size: 1rem !important;
            line-height: 1.5;
            margin-bottom: 2rem !important;
            padding: 0 0.5rem;
          }
          /* Mobile specific heading improvements */
          h1, h2, h3, h4, h5, h6 {
            word-wrap: break-word;
            hyphens: auto;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .gradient-text {
            display: inline-block;
            word-break: break-word;
            background-attachment: fixed;
          }
          /* Better mobile text spacing */
          .text-center {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          /* Mobile specific card text improvements */
          .card h3, .card h4, .card h5 {
            font-size: 1.1rem !important;
            line-height: 1.3;
            margin-bottom: 0.75rem !important;
          }
          .card p {
            font-size: 0.9rem !important;
            line-height: 1.4;
          }
          
          /* Mobile testimonials section improvements */
          .section-title .gradient-text {
            font-size: 1.4rem !important;
            display: inline-block;
            line-height: 1.2;
            margin: 0 0.2rem;
          }
          
          /* Mobile specific title wrapping */
          .section-title {
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          /* Better mobile spacing for testimonials */
          .testimonials .section-title {
            font-size: 1.4rem !important;
            line-height: 1.3;
            margin-bottom: 1.5rem !important;
          }
          
          /* Mobile badge improvements */
          .badge {
            font-size: 0.7rem !important;
            padding: 0.4rem 0.8rem !important;
          }
          
          /* Enhanced mobile title improvements */
          .section-title {
            text-align: center !important;
            padding: 0 1rem !important;
            margin-bottom: 1rem !important;
          }
          
          /* Mobile title stacking */
          .section-title .d-block {
            display: block !important;
            margin-bottom: 0.2rem;
            width: 100%;
          }
          
          .section-title .d-block:last-child {
            margin-bottom: 0;
          }
          
          /* Ensure gradient text doesn't break */
          .section-title .gradient-text {
            white-space: nowrap !important;
            display: block !important;
            width: 100%;
          }
          
          /* Force all section title content to stack on mobile */
          .section-title .d-block.d-md-inline {
            display: block !important;
            width: 100%;
            text-align: center;
          }
          
          /* Additional mobile section title fixes */
          .section-title {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          
          .section-title h2 {
            display: block !important;
            width: 100% !important;
            margin-bottom: 0.1rem !important;
          }
          
          .section-title h2:last-child {
            margin-bottom: 0 !important;
          }
          
          /* Mobile gradient text improvements */
          .gradient-text {
            background-attachment: scroll !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            display: inline-block !important;
            word-break: break-word !important;
          }
          
          /* Mobile specific spacing */
          .mb-4 {
            margin-bottom: 1.5rem !important;
          }
          
          .mb-5 {
            margin-bottom: 2rem !important;
          }
          .g-5 { gap: 1.5rem !important; }
          
          /* Mobile Navigation */
          .navbar-brand {
            font-size: 1.1rem;
          }
          .navbar-toggler {
            padding: 0.25rem 0.5rem;
            font-size: 1rem;
          }
          .navbar-collapse {
            margin-top: 1rem;
            padding: 1rem 0;
            background: rgba(11, 13, 23, 0.95);
            border-radius: 8px;
            backdrop-filter: blur(20px);
          }
          .nav-link {
            padding: 0.5rem 1rem;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .nav-link:last-child {
            border-bottom: none;
          }
          
          /* Mobile Hero Section */
          .hero-bg .container {
            padding: 0 1rem;
          }
          .code-snippet {
            padding: 1rem;
            font-size: 0.8rem;
          }
          .api-endpoint {
            padding: 8px 12px;
            font-size: 0.75rem;
          }
          
          /* Mobile Features */
          .feature-nav-item {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .fixed-content-card {
            height: 300px !important;
          }
          .fixed-content-card img {
            height: 150px !important;
          }
          
          /* Mobile Steps */
          .steps .col-md-4 {
            margin-bottom: 2rem;
          }
          .steps img {
            height: 150px !important;
          }
          
          /* Mobile Pricing */
          .pricing .col-md-4 {
            margin-bottom: 1.5rem;
          }
          
          /* Mobile Footer */
          .footer .col-md-6 {
            margin-bottom: 2rem;
            text-align: center;
          }
        }

        @media (max-width: 767.98px) {
          .hero-bg { 
            padding-top: 5rem !important; 
            padding-bottom: 3rem !important; 
          }
          .nav-blur { 
            padding: 0.5rem 0; 
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1030;
          }
          .section-padding { padding: 3rem 0; }
          .hero-title { 
            font-size: 2.4rem !important; 
            line-height: 1.15;
            margin-bottom: 1.5rem !important;
            letter-spacing: -0.02em;
          }
          .section-title { 
            font-size: 1.9rem !important; 
            line-height: 1.25;
            margin-bottom: 1rem !important;
            letter-spacing: -0.01em;
          }
          .hero-subtitle {
            font-size: 1.1rem !important;
            line-height: 1.5;
            margin-bottom: 2rem !important;
          }
          .g-5 { gap: 2rem !important; }
          
          /* Tablet Navigation */
          .navbar-collapse {
            background: transparent;
            margin-top: 0;
            padding: 0;
          }
          .nav-link {
            padding: 0.5rem 1rem;
            border-bottom: none;
          }
          
          /* Tablet Features */
          #features {
            height: 150vh !important;
          }
          .fixed-content-card {
            height: 400px !important;
          }
        }

        @media (max-width: 991.98px) {
          .hero-bg { 
            padding-top: 6rem !important; 
            padding-bottom: 4rem !important; 
          }
          .section-padding { padding: 4rem 0; }
          .hero-title { 
            font-size: 2.8rem !important; 
            line-height: 1.1;
            margin-bottom: 1.5rem !important;
            letter-spacing: -0.02em;
          }
          .section-title { 
            font-size: 2.2rem !important; 
            line-height: 1.2;
            margin-bottom: 1rem !important;
            letter-spacing: -0.01em;
          }
          .hero-subtitle {
            font-size: 1.2rem !important;
            line-height: 1.5;
            margin-bottom: 2rem !important;
          }
          .g-5 { gap: 2.5rem !important; }
          
          /* Desktop Features */
          #features {
            height: 200vh !important;
          }
          .fixed-content-card {
            height: 500px !important;
          }
        }

        @media (min-width: 1200px) {
          .section-padding { padding: 6rem 0; }
          .g-5 { gap: 4rem !important; }
        }

        /* Smooth scrolling and performance - Desktop only */
        @media (min-width: 992px) {
          html {
            scroll-behavior: smooth;
          }
        }
        
        /* Mobile scroll optimization */
        @media (max-width: 991.98px) {
          html {
            scroll-behavior: auto !important;
            overflow-x: hidden;
          }
          
          body {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: auto !important;
            overscroll-behavior: none;
            overflow-x: hidden;
            position: relative;
          }
          
          * {
            scroll-behavior: auto !important;
          }
          
          /* Disable all transforms and animations that might cause scroll issues */
          .animate-fade-up,
          .animate-slide-in,
          .animate-scale,
          .animate-float {
            animation: none !important;
            transform: none !important;
            transition: none !important;
          }
          
          /* Ensure no sticky positioning on mobile */
          .position-sticky {
            position: static !important;
          }
        }
        
/* Base navbar styles */
.navbar {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
  overflow-x: hidden;
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
}

.navbar .container {
  max-width: 100% !important;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.nav-blur {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(11, 13, 23, 0.9);
}

/* Fix collapse functionality */
.navbar-collapse {
  max-width: 100%;
  overflow-x: hidden;
  transition: height 0.35s ease;
}

.navbar-collapse.collapse:not(.show) {
  display: none;
}

.navbar-collapse.collapsing {
  height: 0;
  overflow: hidden;
  transition: height 0.35s ease;
}

.navbar-collapse.collapse.show {
  display: block;
}

/* Toggler fixes */
.navbar-toggler {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0.25rem 0.5rem;
  background: transparent !important;
}

.navbar-toggler:focus,
.navbar-toggler:active,
.navbar-toggler:hover {
  box-shadow: none !important;
  outline: none !important;
  background: transparent !important;
}

/* Mobile specific styles */
@media (max-width: 991.98px) {
  .navbar {
    padding: 0.5rem 0;
  }
  
  .navbar .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .navbar-brand .h5 {
    font-size: 1.1rem;
  }
  
  .navbar-collapse {
    margin-top: 1rem;
    padding: 1.5rem 1rem;
    background: rgba(11, 13, 23, 0.98);
    border-radius: 12px;
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-left: -1rem;
    margin-right: -1rem;
  }
  
  .nav-link {
    padding: 0.75rem 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin: 0;
    transition: all 0.2s ease;
    display: block;
    width: 100%;
  }
  
  .nav-link:last-of-type {
    border-bottom: none;
    margin-bottom: 0.5rem;
  }
  
  .nav-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #00D2FF !important;
    border-radius: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  /* Button container mobil üçün */
  .navbar-collapse .d-flex {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    width: 100%;
  }
  
  .navbar-collapse .d-flex .btn {
    width: 100%;
  }
}

/* Extra small devices */
@media (max-width: 575.98px) {
  .navbar {
    padding: 0.4rem 0;
  }
  
  .navbar .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .navbar-brand .me-2 {
    margin-right: 0.5rem !important;
  }
  
  .navbar-brand .h5 {
    font-size: 1rem;
  }
  
  .navbar-collapse {
    margin-top: 0.75rem;
    padding: 1rem;
    margin-left: -0.75rem;
    margin-right: -0.75rem;
  }
  
  .nav-link {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }
}

/* Glow effect */
.glow-effect {
  box-shadow: 0 4px 20px rgba(0, 210, 255, 0.3);
  transition: all 0.3s ease;
}

.glow-effect:hover {
  box-shadow: 0 6px 30px rgba(0, 210, 255, 0.5);
  transform: translateY(-2px);
}

        /* Feature Navigation Animation */
        .feature-nav-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-nav-item:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 210, 255, 0.2);
        }

        /* Navigation Dots Animation */
        .nav-dot:hover {
          transform: scale(1.2);
        }

        /* Content Card Animation */
        .fixed-content-card {
          transition: all 0.3s ease;
        }

        .fixed-content-card img {
          transition: all 0.3s ease;
        }

        /* Smooth feature content transitions */
        .feature-nav-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-content-transition {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        /* Feature content switching animations */
        .feature-content-switch {
          transition: all 0.2s ease-in-out;
        }

        .feature-content-switch img {
          transition: all 0.2s ease-in-out;
        }

        .feature-content-switch h3,
        .feature-content-switch p,
        .feature-content-switch .badge {
          transition: all 0.2s ease-in-out;
        }

        /* Smooth fade transition for content changes */
        .feature-content-fade {
          animation: contentFade 0.2s ease-in-out;
        }

        @keyframes contentFade {
          0% { opacity: 0.8; transform: scale(0.98); }
          50% { opacity: 0.9; transform: scale(0.99); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        /* Mobile scroll optimization */
        @media (max-width: 991.98px) {
          .feature-content-transition,
          .feature-content-switch,
          .feature-content-fade {
            transition: none !important;
            animation: none !important;
          }
          
          .feature-nav-item {
            transition: none !important;
          }
          
          .fixed-content-card {
            transition: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen relative">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 25}s`,
              animationDuration: `${20 + Math.random() * 15}s`
            }}
          />
        ))}

        {/* Hero Section */}
        <section
        ref={heroRef}
          id="hero"
          className="hero-bg bg-grid section-padding position-relative overflow-hidden"
          style={{  paddingBottom: '6rem' }}
        >
          <Container className="text-center position-relative" style={{zIndex: 10}}>
            <div className={`animate-fade-up ${isVisible.hero ? 'visible' : ''}`}>
              <div 
                className="d-inline-flex align-items-center rounded-pill px-4 py-2 mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid rgba(34, 211, 238, 0.2)'
                }}
              >
                <span 
                  className="rounded-circle me-2"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#22d3ee',
                    animation: 'pulse 2s infinite'
                  }}
                ></span>
                <span className="text-cyan-400 medium fw-medium font-mono">AI-Powered Backend Generation</span>
              </div>

              <h1 class="hero-title fw-bold text-white mb-4 text-center text-md-start">
  Build Backends with
  <br />
  <span class="gradient-text typing-animation font-monospace text-nowrap">
    Natural Language
  </span>
</h1>


              <div className="hero-subtitle text-light mb-4 mx-auto" style={{maxWidth: '800px'}}>
                Transform your ideas into production-ready APIs in minutes, not months.
                <br />
                <span className="gradient-text-alt fw-medium">Code Less, Build More – Instant Backend at Your Fingertips!</span>
              </div>

              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3 mb-5">
                <Button 
                  size="lg"
                  className="btn-primary glow-effect hover-lift border-0 fw-medium w-50 w-sm-auto"
                  onClick={handleStartClick}
                  style={{
                    background: 'linear-gradient(135deg,rgb(0, 152, 186)00%)',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '1rem'
                  }}
                >
                   Start Building Free
                </Button>
                {/* <Button 
                  variant="outline-light" 
                  size="lg"
                  className="btn-outline fw-medium w-100 w-sm-auto"
                  style={{
                    padding: '14px 30px',
                    borderRadius: '12px',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '1rem'
                  }}
                >
                  <span className="me-2">▶</span>
                  View Demo
                </Button> */}
              </div>

              <Row className="justify-content-center mb-5 g-2">
                <Col xs={12} sm="auto" className="d-flex align-items-center justify-content-center">
                  <span 
                    className="rounded-circle me-2"
                    style={{width: '8px', height: '8px', backgroundColor: '#22c55e'}}
                  ></span>
                  <span className="font-mono small text-white">99.9% Uptime</span>
            </Col>
                <Col xs={12} sm="auto" className="d-flex align-items-center justify-content-center">
                  <span 
                    className="rounded-circle me-2"
                    style={{width: '8px', height: '8px', backgroundColor: '#22d3ee'}}
                  ></span>
                  <span className="font-mono small text-white">10x Faster Development</span>
                </Col>
                <Col xs={12} sm="auto" className="d-flex align-items-center justify-content-center">
                  <span 
                    className="rounded-circle me-2"
                    style={{width: '8px', height: '8px', backgroundColor: '#a855f7'}}
                  ></span>
                  <span className="font-mono small text-white">Enterprise Security</span>
                </Col>
              </Row>

              <div
                className="position-relative animate-float mx-auto"
                style={{ 
                  transform: window.innerWidth >= 992 ? `translateY(${scrollY * 0.15}px)` : 'none',
                  maxWidth: '900px'
                }}
              >
                <div className="api-card p-4 glow-effect">
                  <div className="code-snippet">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-1"
                          style={{width: '12px', height: '12px', backgroundColor: '#ef4444'}}
                        ></div>
                        <div 
                          className="rounded-circle me-1"
                          style={{width: '12px', height: '12px', backgroundColor: '#eab308'}}
                        ></div>
                        <div 
                          className="rounded-circle"
                          style={{width: '12px', height: '12px', backgroundColor: '#22c55e'}}
                        ></div>
                </div>
                      <span className="text-white small font-mono">backlify-ai-generator</span>
                </div>
                    <div className="text-start">
                      <div className="api-endpoint mb-2">
                        <span className="text-success font-mono">POST</span>
                        <span className="text-info font-mono ms-3">/api/users</span>
                        <span className="text-white ms-3">// Create new user</span>
                      </div>
                      <div className="api-endpoint mb-2">
                        <span className="text-primary font-mono">GET</span>
                        <span className="text-info font-mono ms-4">/api/products</span>
                        <span className="text-white ms-3">// Fetch products</span>
                      </div>
                      <div className="api-endpoint mb-2">
                        <span className="text-warning font-mono">POST</span>
                        <span className="text-info font-mono ms-3">/api/orders</span>
                        <span className="text-white ms-3">// Process orders</span>
                      </div>
                      <div className="text-info font-mono small mt-3">
                        + 15 more endpoints generated automatically
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </Container>
        </section>

         {/* Features Section - Desktop Only */}
        <section
          ref={featuresRef}
          id="features"
          className="position-relative d-none d-lg-block"
          style={{
            background: 'linear-gradient(135deg,rgb(2, 7, 17) 0%,rgb(18, 28, 44) 50%,#0F172A 100%)',
            height: `${mockFeatures.length * 100}vh`
          }}
        >
          {/* Invisible scroll triggers positioned throughout the section (outside sticky container) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${mockFeatures.length * 100}vh`, pointerEvents: 'none' }}>
            {mockFeatures.map((_, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: `${(index / mockFeatures.length) * 100}%`,
                  height: `${100 / mockFeatures.length}%`,
                  width: '100%',
                  pointerEvents: 'none',
                  opacity: 0
                }}
                ref={(el) => {
                  if (el) {
                    featureItemRefs.current[index] = el;
                  }
                }}
              />
            ))}
          </div>

          <div 
            className="position-sticky" 
            style={{
              top: '0',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Container>
              {/* Section Header */}
              <div className={`text-center mb-5 animate-fade-up ${isVisible.features ? 'visible' : ''}`}>
                <div 
                  className="d-inline-flex align-items-center rounded-pill px-4 py-2 mb-4"
                  style={{
                    background: 'rgba(31, 41, 55, 0.5)',
                    border: '1px solid rgba(55, 65, 81, 0.5)'
                  }}
                >
                  <span className="text-white small fw-medium font-mono text-uppercase">Platform Features</span>
                </div>
              <h2 className="section-title fw-bold text-white mb-2" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">Everything You Need for</div>
              </h2>
              <h2 className="section-title fw-bold gradient-text mb-4" style={{fontSize: 'clamp(1.3rem, 4.5vw, 2.6rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">Modern Backend Development</div>
              </h2>
              </div>

              {/* Fixed Features Layout */}
              <Row className="align-items-center g-4">
                {/* Left Side - Single Active Feature Navigation */}
                <Col lg={5} className="h-100 d-flex align-items-center">
                  <div className="w-100">
                    {/* Active Feature Display */}
                    <div
                      key={`feature-nav-${activeFeatureIndex}`}
                      className="feature-nav-item feature-content-transition feature-content-switch feature-content-fade p-4 rounded-3 mb-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        backdropFilter: 'blur(20px)',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <Row className="align-items-center g-3">
                        <Col xs="auto">
                          <div 
                            className="rounded-3 d-flex align-items-center justify-content-center glow-effect"
                            style={{
                              width: '60px',
                              height: '60px',
                              background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
                              fontSize: '1.8rem',
                              boxShadow: '0 15px 40px rgba(0, 210, 255, 0.4)'
                            }}
                          >
                            {mockFeatures[activeFeatureIndex].icon}
                          </div>
                        </Col>
                        <Col>
                          <h3 className="h5 fw-bold text-white mb-2">{mockFeatures[activeFeatureIndex].title}</h3>
                          <div 
                            className="badge rounded-pill px-3 py-1 font-mono fw-medium"
                            style={{
                              background: 'rgba(0, 210, 255, 0.25)',
                              color: '#00D2FF',
                              border: '1px solid rgba(0, 210, 255, 0.4)',
                              fontSize: '0.8rem'
                            }}
                          >
                            {mockFeatures[activeFeatureIndex].stats}
                          </div>
                        </Col>
                      </Row>
                      <p className="text-white mt-3 mb-0" style={{lineHeight: '1.5', fontSize: '0.95rem'}}>
                        {mockFeatures[activeFeatureIndex].description}
                      </p>
                    </div>
                  </div>
                </Col>

                {/* Right Side - Fixed Content Area */}
                {/* Right Side - Fixed Content Area */}
<Col lg={6} className="h-100 d-flex align-items-center">
  <div className="w-100 position-relative px-2">
    <Card
      key={`feature-card-${activeFeatureIndex}`}
      className="glass-card border-0 fixed-content-card feature-content-transition feature-content-switch feature-content-fade"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, rgba(246, 92, 92, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        borderRadius: '20px',
        overflow: 'hidden',
        height: '500px', // Reduced from 500px
        maxWidth: '100%', // Added max width
        margin: '0 auto' // Center the card
      }}
    >
      {/* Feature Image */}
      <div className="position-relative" style={{height: '55%'}}>
        <img
          src={mockFeatures[activeFeatureIndex].image}
          alt={mockFeatures[activeFeatureIndex].title}
          className="w-100 h-100"
          style={{
            objectFit: 'cover',
            transition: 'all 0.5s ease'
          }}
        />
        <div 
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
          }}
        ></div>
        
        {/* Feature Icon Overlay */}
        <div 
          className="position-absolute top-50 start-50 translate-middle rounded-3 d-flex align-items-center justify-content-center glow-effect"
          style={{
            width: '70px', // Reduced from 80px
            height: '70px',
            background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
            fontSize: '2.2rem', 
            boxShadow: '0 20px 60px rgba(0, 210, 255, 0.4)'
          }}
        >
          {mockFeatures[activeFeatureIndex].icon}
        </div>
      </div>

      <Card.Body className="p-3 d-flex flex-column justify-content-center" style={{height: '45%'}}> {/* Reduced padding and increased height percentage */}
        <h3 className="h5 fw-bold text-white mb-2">{mockFeatures[activeFeatureIndex].title}</h3> {/* Reduced heading size and margin */}
        <p 
          className="text-white mb-3" // Reduced margin
          style={{
            lineHeight: '1.5', // Reduced line height
            fontSize: '0.9rem' // Reduced font size
          }}
        >
          {mockFeatures[activeFeatureIndex].description}
        </p>
        
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
          <div 
            className="badge rounded-pill px-3 py-2 font-mono fw-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(58, 123, 213, 0.2) 100%)',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              color: '#00D2FF',
              fontSize: '0.8rem' // Reduced font size
            }}
          >
            {mockFeatures[activeFeatureIndex].stats}
          </div>
          <Button
            variant="outline-light"
            size="sm"
            className="rounded-pill"
            style={{
              borderColor: 'rgba(0, 210, 255, 0.3)',
              color: '#00D2FF',
              fontSize: '0.75rem' // Reduced font size
            }}
          >
            Learn More →
          </Button>
        </div>
      </Card.Body>
    </Card>
  </div>
</Col>
          </Row>
        </Container>
          </div>
        </section>

        {/* Mobile Features Section */}
        <section
          id="mobile-features"
          className="section-padding d-lg-none"
          style={{background: 'linear-gradient(135deg,rgb(2, 7, 17) 0%,rgb(18, 28, 44) 50%,#0F172A 100%)'}}
        >
          <Container>
            <div className="text-center mb-5">
              <div 
                className="d-inline-flex align-items-center rounded-pill px-4 py-2 mb-4"
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 0.5)'
                }}
              >
                <span className="text-white small fw-medium font-mono text-uppercase">Platform Features</span>
              </div>
              <h2 className="section-title fw-bold text-white mb-2" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">Everything You Need for</div>
              </h2>
              <h2 className="section-title fw-bold gradient-text mb-4" style={{fontSize: 'clamp(1.3rem, 4.5vw, 2.6rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">Modern Backend Development</div>
              </h2>
            </div>

            <Row className="g-4">
              {mockFeatures.map((feature, index) => (
                <Col md={6} key={feature.title}>
                  <Card className="glass-card border-0 h-100 hover-lift">
                    <div className="position-relative" style={{height: '200px'}}>
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-100 h-100"
                        style={{
                          objectFit: 'cover',
                          borderRadius: '16px 16px 0 0'
                        }}
                      />
                      <div 
                        className="position-absolute top-50 start-50 translate-middle rounded-3 d-flex align-items-center justify-content-center glow-effect"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
                          fontSize: '1.8rem',
                          boxShadow: '0 15px 40px rgba(0, 210, 255, 0.4)'
                        }}
                      >
                        {feature.icon}
                      </div>
                    </div>
                    <Card.Body className="p-4">
                      <h3 className="h5 fw-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-white mb-3" style={{lineHeight: '1.5', fontSize: '0.9rem'}}>
                        {feature.description}
                      </p>
                      <div 
                        className="badge rounded-pill px-3 py-2 font-mono fw-medium"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(58, 123, 213, 0.2) 100%)',
                          border: '1px solid rgba(0, 210, 255, 0.4)',
                          color: '#00D2FF',
                          fontSize: '0.8rem'
                        }}
                      >
                        {feature.stats}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* How It Works Section */}
        <section
          ref={stepsRef}
        id="how-it-works"
          className="section-padding"
          style={{background: 'linear-gradient(135deg, #0F172A 0%,rgb(11, 17, 27) 50%,rgb(18, 22, 29) 100%)'}}
      >
        <Container>
            <div className={`text-center mb-5 animate-fade-up ${isVisible.steps ? 'visible' : ''}`}>
              <div 
                className="d-inline-flex align-items-center rounded-pill px-4 py-2 mb-4"
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 0.5)'
                }}
              >
                <span className="text-white small fw-medium font-mono text-uppercase">How It Works</span>
          </div>
              <h2 className="section-title fw-bold gradient-text mb-2" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">3 Simple Steps</div>
              </h2>
              <h2 className="section-title fw-bold text-white mb-4" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">From Idea to API</div>
              </h2>
            </div>

          <Row className="g-4">
              {steps.map((step, index) => (
                <Col md={4} key={step.title}>
                  <div
                    className={`text-center animate-slide-in ${isVisible.steps ? 'visible' : ''}`}
                    style={{ animationDelay: `${index * 0.3}s` }}
                  >
                    <div className="mb-4">
                      <div className="display-1 fw-bold gradient-text font-mono mb-4">{step.number}</div>
                      <div 
                        className="rounded-3 p-4 hover-lift"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                          border: '1px solid rgba(0, 210, 255, 0.2)',
                          backdropFilter: 'blur(20px)'
                        }}
                      >
                        <img
                          src={step.image}
                          alt={step.title}
                          className="img-fluid rounded-3 mb-3"
                          style={{height: '200px', objectFit: 'cover', width: '100%'}}
                        />
                        <div 
                          className="small text-info font-mono rounded-3 p-2"
                          style={{background: 'rgba(17, 24, 39, 0.5)'}}
                        >
                          {step.mockup}
                        </div>
                      </div>
                    </div>
                    <h3 className="h4 fw-bold text-white mb-3">{step.title}</h3>
                    <p className="text-light" style={{lineHeight: '1.6'}}>{step.description}</p>
                  </div>
              </Col>
            ))}
          </Row>
        </Container>
        </section>

   
        {/* Pricing Section */}
        <section
          ref={pricingRef}
          id="pricing"
          className="section-padding"
          style={{background: 'linear-gradient(135deg, #0F172A 0%,rgb(20, 27, 39) 50%,rgb(15, 21, 29) 100%)'}}
      >
        <Container>
            <div className={`text-center justify-content-center align-items-center d-flex flex-column mb-5 animate-fade-up ${isVisible.pricing ? 'visible' : ''}`}>
              <div 
                className="d-flex  justify-content-center align-items-center rounded-pill px-4 py-2 mb-4"
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 0.5)'
                }}
              >
                <span className="text-white small fw-medium font-mono text-uppercase">Pricing</span> <br />
          </div>
          
              <h2 className="section-title fw-bold gradient-text mb-2" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">Simple Pricing</div>
              </h2>
              <h2 className="section-title fw-bold text-white mb-4" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
                <div className="d-block d-md-inline">for Every Team Size</div>
              </h2>
            </div>

            {plansLoading ? (
              <div className="text-center">
                <div style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '2px solid transparent',
                  borderTop: '2px solid #22d3ee',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p className="text-white mt-3">Loading pricing plans...</p>
              </div>
            ) : (
              <Row className="g-4 justify-content-center">
                {plansToShow.map((plan, index) => (
                  <Col md={4} key={plan.id}>
                    <Card
                      className={`glass-card h-100 hover-lift animate-scale border-0 position-relative ${isVisible.pricing ? 'visible' : ''} ${plan.isPopular ? 'glow-effect popular-plan' : ''}`}
                      style={{ 
                        animationDelay: `${index * 0.2}s`,
                        background: plan.isPopular 
                          ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)'
                          : 'linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: plan.isPopular 
                          ? '2px solid rgba(30, 64, 175, 0.6)' 
                          : '1px solid rgba(0, 210, 255, 0.2)',
                        boxShadow: plan.isPopular 
                          ? '0 20px 40px rgba(30, 64, 175, 0.2), 0 0 0 1px rgba(30, 64, 175, 0.1)'
                          : '0 10px 30px rgba(0, 0, 0, 0.2)',
                        transform: plan.isPopular ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {plan.isPopular && (
                        <div className="position-absolute" style={{top: '-20px', left: '50%', transform: 'translateX(-50%)'}}>
                          <span 
                            className="badge text-white px-4 py-2 rounded-pill small fw-bold font-mono"
                            style={{
                              background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
                              boxShadow: '0 8px 25px rgba(30, 64, 175, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            Most Popular
                          </span>
                        </div>
                      )}

                      <Card.Body className="p-4 text-center">
                        <h3 className="h4 fw-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-white mb-4">{plan.description}</p>
                        <div className="display-4 fw-bold text-white mb-2 font-mono">
                          {typeof plan.price === 'number' ? `₼${plan.price}` : plan.price}
                        </div>
                        {typeof plan.price === 'number' && (
                          <span className="text-white font-mono">/month</span>
                        )}

                        <ul className="list-unstyled my-4">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="d-flex align-items-start text-light mb-3">
                              <svg className="me-3 mt-1 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#22d3ee'}}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          className={`w-100 fw-bold border-0 position-relative overflow-hidden pricing-button ${
                            plan.isPopular ? 'btn-primary glow-effect' : 'btn-outline-light'
                          }`}
                          style={plan.isPopular ? {
                            background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
                            padding: '16px 32px',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            boxShadow: '0 10px 30px rgba(30, 64, 175, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease',
                            transform: 'translateY(0)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          } : {
                            background: 'rgba(31, 41, 55, 0.8)',
                            border: '2px solid rgba(0, 210, 255, 0.3)',
                            padding: '14px 28px',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            color: '#E2E8F0',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                          }}
                          onMouseEnter={(e) => {
                            if (plan.isPopular) {
                              e.target.style.transform = 'translateY(-3px)';
                              e.target.style.boxShadow = '0 15px 40px rgba(30, 64, 175, 0.4)';
                            } else {
                              e.target.style.borderColor = 'rgba(0, 210, 255, 0.6)';
                              e.target.style.background = 'rgba(0, 210, 255, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (plan.isPopular) {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 10px 30px rgba(30, 64, 175, 0.3)';
                            } else {
                              e.target.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                              e.target.style.background = 'rgba(31, 41, 55, 0.8)';
                            }
                          }}
                          onClick={handleStartClick}
                        >
                          {plan.isPopular && (
                            <span className="position-absolute" style={{
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                              transition: 'left 0.5s'
                            }}></span>
                          )}
                          {plan.buttonText}
                        </Button>
                      </Card.Body>
                    </Card>
              </Col>
            ))}
          </Row>
            )}
        </Container>
        </section>

        {/* CTA Section */}
        <section className="section-padding position-relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0F172A 0%,rgb(18, 25, 37) 50%,rgb(27, 33, 42) 100%)'}}>
          <div className="position-absolute w-100 h-100 bg-grid" style={{opacity: '0.3', top: 0, left: 0}}></div>
          <Container className="text-center position-relative" style={{zIndex: 10, maxWidth: '800px'}}>
            <h2 className="section-title fw-bold text-white mb-2" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
              <div className="d-block d-md-inline">Ready to</div>
              <div className="d-block d-md-inline">
                <span className="gradient-text" style={{fontSize: 'clamp(1.3rem, 4.5vw, 2.6rem)', display: 'inline-block', whiteSpace: 'nowrap'}}>Transform</span>
              </div>
            </h2>
            <h2 className="section-title fw-bold text-white mb-4" style={{fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', lineHeight: '1.2'}}>
              <div className="d-block d-md-inline">Your Development Workflow?</div>
            </h2>
            <p className="fs-5 text-light mb-5" style={{lineHeight: '1.6'}}>
              Join thousands of developers who are building APIs 10x faster with Backlify.
              Start your free trial today - no credit card required.
            </p>
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
              <Button 
                size="lg"
                className="btn-primary glow-effect hover-lift border-0 fw-semibold w-100 w-sm-auto"
                onClick={handleStartClick}
                style={{
                  background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
                  padding: '16px 48px',
                  borderRadius: '12px',
                  fontSize: '18px'
                }}
              >
                🚀 Start Free Trial
          </Button>
              <Button 
                variant="outline-light" 
                size="lg"
                className="btn-outline fw-semibold font-mono w-100 w-sm-auto"
                style={{
                  padding: '14px 46px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <svg className="me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Read Documentation
              </Button>
            </div>
        </Container>
        </section>

        {/* Footer */}
        <footer className="section-padding" style={{background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)', borderTop: '1px solid rgba(107, 114, 128, 0.5)'}}>
        <Container>
            <Row className="g-4 mb-5">
              <Col lg={6}>
                <div className="d-flex align-items-center mb-4">
                  <div 
                    className="rounded-3 d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                    }}
                  >
                    <img 
                      src={backlifyIcon} 
                      alt="Backlify Logo" 
                      width="24" 
                      height="24"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
          </div>
                  <span className="h4 fw-bold text-white mb-0">Backlify</span>
                </div>
                <p className="text-white" style={{lineHeight: '1.6'}}>
                  The AI-powered platform for building production-ready APIs with natural language.
                </p>
              </Col>

              <Col md={6} lg={2}>
                <h5 className="text-white fw-semibold mb-3">Platform</h5>
                <ul className="list-unstyled">
                  <li className="mb-2"><a href="#" className="text-white text-decoration-none">API Builder</a></li>
                  <li className="mb-2"><a href="#" className="text-white text-decoration-none">Documentation</a></li>
                  <li className="mb-2"><a href="#" className="text-white text-decoration-none">Integrations</a></li>
                </ul>
              </Col>


              <Col md={6} lg={2}>
                <h5 className="text-white fw-semibold mb-3">Company</h5>
                <ul className="list-unstyled">
                  <li className="mb-2"><a href="/privacy" className="text-white text-decoration-none">Privacy</a></li>
                  <li className="mb-2"><a href="/privacy" className="text-white text-decoration-none">Terms</a></li>
                  <li className="mb-2"><a href="#" className="text-white text-decoration-none">Support</a></li>
                </ul>
              </Col>
            </Row>

            <Row className="pt-4 border-top">
              <Col md={6}>
                <p className="text-white mb-0">© 2025 Backlify. All rights reserved.</p>
              </Col>
              <Col md={6} className="text-md-end">
                <div className="d-flex justify-content-md-end gap-3">
     
                  <a href="https://www.linkedin.com/company/backlify-ai" className="text-white">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
          </div>
              </Col>
            </Row>
        </Container>
      </footer>

        {/* Mobile Warning Modal */}
      <Modal show={showMobileWarning} onHide={() => setShowMobileWarning(false)} centered>
          <Modal.Header closeButton style={{background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
            <Modal.Title className="text-white">💻 For the Best Experience</Modal.Title>
        </Modal.Header>
          <Modal.Body style={{background: '#1a1a1a', color: '#E2E8F0'}}>
            <p className="mb-3">
              Hello! To experience the full power and convenience of the Backlify platform, please try it on a desktop computer.
            </p>
            <p className="text-white small mb-0">
              We're working hard on the mobile version and it will be ready soon. Thanks for your understanding! 🚀
            </p>
        </Modal.Body>
          <Modal.Footer style={{background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
            <Button 
              className="btn-primary border-0"
              onClick={() => setShowMobileWarning(false)}
              style={{
                background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
                padding: '12px 24px',
                borderRadius: '8px'
              }}
            >
            Got It
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default IntroPage;
