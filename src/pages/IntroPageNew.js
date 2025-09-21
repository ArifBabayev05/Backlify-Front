import React, { useState, useEffect, useRef } from 'react';
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

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const pricingRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
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
          background: rgba(11, 13, 23, 0.85);
        }

        .typing-animation {
          overflow: hidden;
          border-right: 3px solid rgba(0, 210, 255, 0.75);
          white-space: nowrap;
          animation: typing 4s steps(50, end), blink-caret 0.75s step-end infinite;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: rgba(0, 210, 255, 0.75) }
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

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-16 { margin-bottom: 4rem; }
        .mb-20 { margin-bottom: 5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .py-8 { padding: 2rem 0; }
        .py-16 { padding: 4rem 0; }
        .py-20 { padding: 5rem 0; }
        .py-32 { padding: 8rem 0; }
        .px-4 { padding: 0 1rem; }
        .px-6 { padding: 0 1.5rem; }
        .p-6 { padding: 1.5rem; }
        .p-8 { padding: 2rem; }

        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .gap-8 { gap: 2rem; }
        .gap-12 { gap: 3rem; }

        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .space-x-6 > * + * { margin-left: 1.5rem; }
        .space-x-8 > * + * { margin-left: 2rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }

        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }
        .text-4xl { font-size: 2.25rem; }
        .text-5xl { font-size: 3rem; }
        .text-6xl { font-size: 3.75rem; }
        .text-7xl { font-size: 4.5rem; }

        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }

        .text-white { color: #ffffff; }
        .text-gray-300 { color: #d1d5db; }
        .text-gray-400 { color: #9ca3af; }
        .text-cyan-400 { color: #22d3ee; }

        .w-full { width: 100%; }
        .w-12 { width: 3rem; }
        .w-20 { width: 5rem; }
        .h-12 { height: 3rem; }
        .h-20 { height: 5rem; }
        .h-40 { height: 10rem; }

        .rounded-xl { border-radius: 0.75rem; }
        .rounded-2xl { border-radius: 1rem; }
        .rounded-full { border-radius: 9999px; }

        .fixed { position: fixed; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .top-0 { top: 0; }
        .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .z-50 { z-index: 50; }

        .overflow-hidden { overflow: hidden; }
        .min-h-screen { min-height: 100vh; }

        @media (max-width: 768px) {
          .md\\:text-5xl { font-size: 3rem; }
          .md\\:text-6xl { font-size: 3.75rem; }
          .md\\:text-7xl { font-size: 4.5rem; }
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .md\\:flex-row { flex-direction: row; }
          .md\\:space-x-8 > * + * { margin-left: 2rem; }
          .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sm\\:flex-row { flex-direction: row; }
          
          .hero-bg {
            padding-top: 80px;
          }
          
          .text-5xl {
            font-size: 2.5rem;
          }
          
          .text-7xl {
            font-size: 3.5rem;
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

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 nav-blur" style={{borderBottom: '1px solid rgba(107, 114, 128, 0.2)'}}>
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <img 
                      src={backlifyIcon} 
                      alt="Backlify Logo" 
                      width="24" 
                      height="24"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-white">Backlify</span>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-mono">AI</span>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                  <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">Platform</a>
                  <a href="#how-it-works" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">How it Works</a>
                  <a href="#pricing" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">Pricing</a>
                  <button className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">Login</button>
                </div>
              </div>

              <button 
                className="btn-primary glow-effect font-medium"
                onClick={handleStartClick}
              >
                Start Building
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          ref={heroRef}
          id="hero"
          className="hero-bg bg-grid py-32 relative overflow-hidden"
          style={{ paddingTop: '144px', paddingBottom: '96px' }}
        >
          <div className="container text-center relative z-10">
            <div className={`animate-fade-up ${isVisible.hero ? 'visible' : ''}`}>
              <div className="inline-flex items-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-full px-6 py-3 mb-8">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-3"></span>
                <span className="text-cyan-400 text-sm font-medium font-mono">AI-Powered Backend Generation</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{lineHeight: '1.1'}}>
                Build Backends with
                <br />
                <span className="gradient-text typing-animation font-mono">Natural Language</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8" style={{lineHeight: '1.6', maxWidth: '800px', margin: '0 auto 2rem'}}>
                Transform your ideas into production-ready APIs in minutes, not months.
                <br />
                <span className="gradient-text-alt font-medium">Code Less, Build More – Instant Backend at Your Fingertips!</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                <button 
                  className="btn-primary glow-effect hover-lift"
                  onClick={handleStartClick}
                >
                  ✨ Start Building Free
                </button>
                <button className="btn-outline">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12l-4-4 1.41-1.41L10 9.17l2.59-2.58L14 8l-4 4z"/>
                  </svg>
                  View Demo
                </button>
              </div>

              <div className="flex items-center justify-center space-x-8 mb-16 text-sm text-gray-400">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  <span className="font-mono">99.9% Uptime</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                  <span className="font-mono">10x Faster Development</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  <span className="font-mono">Enterprise Security</span>
                </div>
              </div>

              <div
                className="relative animate-float"
                style={{ 
                  transform: `translateY(${scrollY * 0.15}px)`,
                  maxWidth: '1200px',
                  margin: '0 auto'
                }}
              >
                <div className="api-card p-6 glow-effect">
                  <div className="code-snippet">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-400 text-sm font-mono">backlify-ai-generator</span>
                    </div>
                    <div className="space-y-3 text-left">
                      <div className="api-endpoint">
                        <span className="text-green-400 font-mono">POST</span>
                        <span className="text-cyan-400 font-mono" style={{marginLeft: '16px'}}>/api/users</span>
                        <span className="text-gray-400" style={{marginLeft: '16px'}}>// Create new user</span>
                      </div>
                      <div className="api-endpoint">
                        <span className="text-blue-400 font-mono">GET</span>
                        <span className="text-cyan-400 font-mono" style={{marginLeft: '20px'}}>/api/products</span>
                        <span className="text-gray-400" style={{marginLeft: '16px'}}>// Fetch products</span>
                      </div>
                      <div className="api-endpoint">
                        <span className="text-purple-400 font-mono">POST</span>
                        <span className="text-cyan-400 font-mono" style={{marginLeft: '16px'}}>/api/orders</span>
                        <span className="text-gray-400" style={{marginLeft: '16px'}}>// Process orders</span>
                      </div>
                      <div className="text-cyan-400 font-mono text-sm mt-4">
                        + 15 more endpoints generated automatically
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          ref={featuresRef}
          id="features"
          className="py-32"
          style={{background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.3), rgba(31, 41, 55, 0.2))'}}
        >
          <div className="container">
            <div className={`text-center mb-20 animate-fade-up ${isVisible.features ? 'visible' : ''}`}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(55, 65, 81, 0.5)',
                borderRadius: '9999px',
                padding: '8px 24px',
                marginBottom: '24px'
              }}>
                <span className="text-gray-400 text-sm font-medium font-mono" style={{textTransform: 'uppercase', letterSpacing: '0.1em'}}>Platform Features</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Everything You Need for
                <br />
                <span className="gradient-text">Modern Backend Development</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {mockFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`glass-card p-8 hover-lift animate-scale ${isVisible.features ? 'visible' : ''}`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
                    <div style={{flexShrink: '0'}}>
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4 glow-effect">
                        {feature.icon}
                      </div>
                      <div className="metric-card rounded-xl p-3 mb-4">
                        <div className="text-cyan-400 font-mono text-sm font-medium">{feature.stats}</div>
                      </div>
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-40 object-cover rounded-xl"
                        style={{
                          border: '1px solid rgba(55, 65, 81, 0.5)',
                          maxWidth: '250px'
                        }}
                      />
                    </div>
                    <div style={{flex: '1'}}>
                      <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                      <p className="text-gray-300 text-lg" style={{lineHeight: '1.6'}}>{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          ref={stepsRef}
          id="how-it-works"
          className="py-32"
          style={{background: 'linear-gradient(to bottom, rgba(31, 41, 55, 0.2), rgba(17, 24, 39, 0.3))'}}
        >
          <div className="container">
            <div className={`text-center mb-20 animate-fade-up ${isVisible.steps ? 'visible' : ''}`}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(55, 65, 81, 0.5)',
                borderRadius: '9999px',
                padding: '8px 24px',
                marginBottom: '24px'
              }}>
                <span className="text-gray-400 text-sm font-medium font-mono" style={{textTransform: 'uppercase', letterSpacing: '0.1em'}}>How It Works</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="gradient-text">3 Simple Steps</span>
                <br />
                From Idea to API
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`text-center animate-slide-in ${isVisible.steps ? 'visible' : ''}`}
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  <div className="relative mb-8">
                    <div className="text-6xl font-bold gradient-text font-mono mb-6">{step.number}</div>
                    <div className="api-card p-6 hover-lift">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-40 object-cover rounded-xl mb-4"
                      />
                      <div className="text-xs text-cyan-400 font-mono rounded p-2" style={{background: 'rgba(17, 24, 39, 0.5)'}}>
                        {step.mockup}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-300 text-lg" style={{lineHeight: '1.6'}}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20" style={{background: 'linear-gradient(to right, rgba(17, 24, 39, 0.4), rgba(31, 41, 55, 0.4))'}}>
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Trusted by <span className="gradient-text">10,000+</span> Developers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.name} className="glass-card p-6 hover-lift">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className="text-white font-semibold">{testimonial.name}</div>
                      <div className="text-gray-400 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-300" style={{fontStyle: 'italic'}}>"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          ref={pricingRef}
          id="pricing"
          className="py-32"
          style={{background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.3), rgba(0, 0, 0, 0.4))'}}
        >
          <div className="container">
            <div className={`text-center mb-20 animate-fade-up ${isVisible.pricing ? 'visible' : ''}`}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(55, 65, 81, 0.5)',
                borderRadius: '9999px',
                padding: '8px 24px',
                marginBottom: '24px'
              }}>
                <span className="text-gray-400 text-sm font-medium font-mono" style={{textTransform: 'uppercase', letterSpacing: '0.1em'}}>Pricing</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="gradient-text">Simple Pricing</span>
                <br />
                for Every Team Size
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
                <p className="text-gray-400 mt-4">Loading pricing plans...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{maxWidth: '1200px', margin: '0 auto'}}>
                {plansToShow.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`glass-card p-8 relative hover-lift animate-scale ${isVisible.pricing ? 'visible' : ''} ${plan.isPopular ? 'glow-effect' : ''}`}
                    style={{ 
                      animationDelay: `${index * 0.2}s`,
                      border: plan.isPopular ? '1px solid rgba(34, 211, 238, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {plan.isPopular && (
                      <div className="absolute" style={{top: '-16px', left: '50%', transform: 'translateX(-50%)'}}>
                        <span className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold font-mono">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 mb-4">{plan.description}</p>
                      <div className="text-5xl font-bold text-white mb-2 font-mono">
                        {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                      </div>
                      {typeof plan.price === 'number' && (
                        <span className="text-gray-400 font-mono">/month</span>
                      )}
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-gray-300">
                          <svg className="w-5 h-5 text-cyan-400 mr-3" style={{flexShrink: '0', marginTop: '2px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 glow-effect'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      style={!plan.isPopular ? {
                        background: 'rgba(31, 41, 55, 1)',
                        border: '1px solid rgba(55, 65, 81, 1)'
                      } : {}}
                      onClick={handleStartClick}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden" style={{background: 'linear-gradient(to right, rgba(8, 145, 178, 0.2), rgba(37, 99, 235, 0.2))'}}>
          <div className="absolute inset-0 bg-grid" style={{opacity: '0.3'}}></div>
          <div className="container text-center relative z-10" style={{maxWidth: '800px'}}>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to <span className="gradient-text">Transform</span>
              <br />
              Your Development Workflow?
            </h2>
            <p className="text-xl text-gray-300 mb-12" style={{lineHeight: '1.6'}}>
              Join thousands of developers who are building APIs 10x faster with Backlify.
              Start your free trial today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                className="btn-primary glow-effect hover-lift"
                onClick={handleStartClick}
                style={{fontSize: '18px', padding: '16px 48px'}}
              >
                🚀 Start Free Trial
              </button>
              <button className="btn-outline font-mono" style={{fontSize: '18px', padding: '14px 46px'}}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Read Documentation
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20" style={{background: 'rgba(0, 0, 0, 0.6)', borderTop: '1px solid rgba(107, 114, 128, 0.5)'}}>
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center space-x-8 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <img 
                      src={backlifyIcon} 
                      alt="Backlify Logo" 
                      width="24" 
                      height="24"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-white">Backlify</span>
                </div>
                <p className="text-gray-400" style={{lineHeight: '1.6'}}>
                  The AI-powered platform for building production-ready APIs with natural language.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">API Builder</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Integrations</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Templates</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Community</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Status</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>

            <div style={{borderTop: '1px solid rgba(107, 114, 128, 1)', paddingTop: '32px'}} className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-400 mb-4 md:mb-0">© 2024 Backlify. All rights reserved.</p>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/backlify-ai" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile Warning Modal */}
        {showMobileWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(0, 0, 0, 0.5)'}}>
            <div className="glass-card p-6 w-full" style={{maxWidth: '400px'}}>
              <h3 className="text-xl font-bold text-white mb-4">💻 For the Best Experience</h3>
              <p className="text-gray-300 mb-4">
                Hello! To experience the full power and convenience of the Backlify platform, please try it on a desktop computer.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                We're working hard on the mobile version and it will be ready soon. Thanks for your understanding! 🚀
              </p>
              <button 
                className="btn-primary w-full"
                onClick={() => setShowMobileWarning(false)}
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IntroPage;
