import React, { useState,useEffect, useRef  } from "react";
import { Navbar, Nav, Container, Button, Row, Col, Card, Modal, Accordion, Form  } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from 'react-hot-toast'; // Bildirişlər üçün
import backlifyIcon from '../assets/icons/backlify.png';
import subscriptionService from '../utils/subscriptionService';
import IntroThemeSwitch from '../components/common/IntroThemeSwitch';

// Using Bootstrap Icons and Unicode symbols instead of Font Awesome

const IntroPage = () => {
  // State management for the mobile warning modal
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const timeoutIds = useRef([]); // Animasiya timeout'larını saxlamaq üçün ref
  const [loopKey, setLoopKey] = useState(0);
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  // Animasiya mərhələlərini idarə etmək üçün useEffect
  useEffect(() => {
    const runAnimationCycle = () => {
        // Hər yeni döngünün başında "key"i artıraraq yazı animasiyasını təzələyirik
        setLoopKey(prevKey => prevKey + 1);

        timeoutIds.current.forEach(clearTimeout);
        timeoutIds.current = [];

        const sequence = [
            { stage: 1, duration: 2000 },
            { stage: 2, duration: 4000 },
            { stage: 3, duration: 5000 },
            { stage: 4, duration: 4000 },
            { stage: null, duration: 1500 }
        ];

        let totalDelay = 2500;

        sequence.forEach(item => {
            const timeout = setTimeout(() => {
                setAnimationStage(item.stage);
            }, totalDelay);
            timeoutIds.current.push(timeout);
            totalDelay += item.duration;
        });
        
        const loopTimeout = setTimeout(runAnimationCycle, totalDelay);
        timeoutIds.current.push(loopTimeout);
    };

    runAnimationCycle();

    return () => {
        timeoutIds.current.forEach(clearTimeout);
    };
}, []);

  // Load subscription plans
  useEffect(() => {
    const loadSubscriptionPlans = async () => {
      try {
        setPlansLoading(true);
        const plans = await subscriptionService.getSubscriptionPlans();
        setSubscriptionPlans(plans);
      } catch (error) {
        console.error('Error loading subscription plans:', error);
        toast.error('Failed to load pricing plans');
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
  const handleCloseMobileWarning = () => setShowMobileWarning(false);
  const handleShowMobileWarning = () => setShowMobileWarning(true);

  // Handles the "Start for Free" button click
  const handleStartClick = (e) => {
    e.preventDefault();
    // Checks if the screen width is mobile-sized
    if (window.innerWidth < 768) {
      handleShowMobileWarning();
    } else {
      // Redirects to the actual signup page on larger screens
      window.location.href = "/register"; // Replace with your actual signup link
    }
  };

  // --- Mesaj göndərmə simulyasiyası ---
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    // 2 saniyəlik yüklənmə simulyasiyası
    setTimeout(() => {
        toast.success('Successful sending');
        setContactForm({ email: '', message: '' }); // Formu təmizlə
        setIsSending(false); // Yüklənməni dayandır
    }, 2000);
  };
  const css = `
    :root {
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      --secondary-gradient: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      --accent-gradient: linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%);
      --success-gradient: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      --dark-bg: #030712;
      --card-bg: rgba(31, 41, 55, 0.3);
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --text-white: #6b7280;
      --border-color: rgba(255, 255, 255, 0.1);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: var(--dark-bg);
      color: var(--text-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Animations */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-25px); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 0 35px rgba(99, 102, 241, 0.7); }
    }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-25px); } }
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); } 50% { box-shadow: 0 0 35px rgba(99, 102, 241, 0.7); } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
    .animate-slide-up { animation: slide-up 0.8s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
    .gradient-text { background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-section { min-height: 100vh; position: relative; display: flex; align-items: center; padding-top: 6rem; background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.1), transparent); }
    .hero-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 800; line-height: 1.2; margin-bottom: 1.5rem; }
    .hero-subtitle { font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--text-secondary); margin-bottom: 2.5rem; line-height: 1.7; max-width: 550px; }
    /* STYLES FOR THE DYNAMIC VISUAL */
    .dynamic-visual {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 2rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
    
        /* === Düzəliş Edilmiş Typing Animasiyası === */
    .prompt-box {
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        padding: 1.25rem;
        font-family: 'Fira Code', monospace;
        color: #c4b5fd;
        width: 100%;
        overflow-x: auto; /* Daşma zamanı scroll etməyə imkan verir */
        scrollbar-width: none; /* Firefox üçün scrollbar'ı gizlədir */
    }
    .prompt-box::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera üçün scrollbar'ı gizlədir */
    }
    .typing-effect {
        display: inline-block;
        white-space: nowrap; /* Mətni bir sətirdə saxlayır */
        border-right: .15em solid #c4b5fd;
        vertical-align: middle;
        width: 0;
        animation: typing 3.5s steps(55) forwards, blink-caret .75s step-end infinite;
    }
    @keyframes typing {
        from { width: 0; }
        to { width: 55ch; } /* Konteynerin eninə deyil, mətnin uzunluğuna görə animasiya */
    }
    @keyframes blink-caret {
        from, to { border-color: transparent }
        50% { border-color: #c4b5fd; }
    }
   
    
    
    .ai-processor {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 1.5rem 0;
      gap: 1rem;
    }
    .ai-processor .line {
      height: 1px;
      flex-grow: 1;
      background: linear-gradient(90deg, transparent, var(--border-color), transparent);
    }
    .ai-processor-icon {
      font-size: 1.5rem;
      color: var(--text-secondary);
      animation: spin-glow 4s linear infinite;
    }
    @keyframes spin-glow {
      0% { transform: rotate(0deg); text-shadow: 0 0 5px rgba(196, 181, 253, 0.5); }
      50% { transform: rotate(180deg); text-shadow: 0 0 15px rgba(196, 181, 253, 1); }
      100% { transform: rotate(360deg); text-shadow: 0 0 5px rgba(196, 181, 253, 0.5); }
    }
    
    .code-output {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      font-family: 'Fira Code', 'Menlo', monospace;
      font-size: 0.9rem;
      color: #9ca3af;
      position: relative;
    }
    .code-output::before {
      content: '● ● ●';
      position: absolute;
      top: 10px; left: 15px;
      color: #4b5563; font-size: 12px;
    }
    .code-output-content {
      padding-top: 20px;
    }

    @keyframes fadeIn-line {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* === Contact Form Styles === */
    .contact-form-container {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 1.5rem;
        padding: 2.5rem;
        backdrop-filter: blur(12px);
    }
    .form-control-contact {
        background-color: rgba(15, 23, 42, 0.5) !important;
        border: 1px solid var(--border-color) !important;
        color: var(--text-primary) !important;
        border-radius: 0.75rem !important;
        padding: 0.9rem 1rem !important;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .form-control-contact:focus {
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4) !important;
        border-color: #6366f1 !important;
        background-color: rgba(3, 7, 18, 0.7) !important;
    }
    .form-control-contact::placeholder { color: rgba(156, 163, 175, 0.5); }
    .code-output-content span {
      display: block;
      opacity: 0; /* Start hidden */
      animation: fadeIn-line 0.5s ease-out forwards;
      white-space: pre; /* THE FIX: Prevents text from wrapping */
      text-align: left;
    }
    /* Stagger the animation for each line */
    .code-output-content span:nth-child(1) { animation-delay: 4.5s; }
    .code-output-content span:nth-child(2) { animation-delay: 4.7s; }
    .code-output-content span:nth-child(3) { animation-delay: 4.9s; }
    .code-output-content span:nth-child(4) { animation-delay: 5.1s; }
    .code-output-content span:nth-child(5) { animation-delay: 5.3s; }

    .code-keyword { color: #c084fc; font-weight: 600; }
    .code-path { color: #9ca3af; }
    .code-variable { color: #60a5fa; }
    .code-comment { color: #6b7280; font-style: italic; }
    
    /* Other general styles needed for the page */
    p, li, h1, h2, h3, h4, h5, h6, blockquote { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5); }
    .navbar-custom { background: rgba(3, 7, 18, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color); padding: 1rem 0; }
    .navbar-brand { font-size: 1.7rem; font-weight: 800; letter-spacing: -1px; }
    .navbar-toggler { border: none; } .navbar-toggler:focus { box-shadow: none; }
    .navbar-toggler i { color: var(--text-primary); font-size: 1.5rem; }
    .nav-link { font-weight: 500; color: var(--text-secondary) !important; transition: color 0.3s ease; }
    .nav-link:hover { color: var(--text-primary) !important; }
    .btn-gradient { background: var(--primary-gradient); border: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; color: white !important; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3), 0 1px 3px rgba(0,0,0,0.2); }
    .btn-gradient:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4), 0 1px 3px rgba(0,0,0,0.2); }
    .btn-outline-custom { border: 2px solid var(--border-color); padding: 14px 32px; border-radius: 50px; font-weight: 600; color: white !important; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s ease; background: transparent; }
    .btn-outline-custom:hover { background: var(--border-color); }
        /* Ümumi stillər */
    .navbar-custom { background: rgba(3, 7, 18, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color); }
    .hero-section { min-height: 100vh; display: flex; align-items: center; padding-top: 6rem; background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.1), transparent); }
    .hero-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 800; }
    .hero-subtitle { font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--text-secondary); max-width: 550px; }
    .gradient-text { background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .btn-gradient { background: var(--primary-gradient); border: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; color: white !important; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3); }
    .btn-gradient:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4); }
    .btn-outline-custom { border: 2px solid var(--border-color); padding: 14px 32px; border-radius: 50px; font-weight: 600; color: white !important; transition: all 0.3s ease; }
    .btn-outline-custom:hover { background: var(--border-color); }
    
    /* Animasiya üçün stillər */
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
    .animate-float { animation: float 6s ease-in-out infinite; }
    
    .dynamic-visual-container {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 2rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      min-height: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 1.5rem; /* Prompt ilə animasiya arasında məsafə yaradır */
      transition: all 0.5s ease-in-out;
      overflow: hidden;
      position: relative;
    }
    .animation-stages-wrapper {
    width: 100%;
    position: relative;
    min-height: 350px; /* Bütün animasiyalar bu hündürlükdə baş verəcək */
}
    /* --- Typing effect düzəlişi --- */
    .prompt-box {
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 1.25rem;
      font-family: 'Fira Code', monospace;
      color: #c4b5fd;
      width: 100%;
    }
    .typing-effect {
      display: inline-block;
      overflow: hidden;
      white-space: nowrap;
      border-right: .15em solid #c4b5fd;
      vertical-align: middle;
      width: 0;
      animation: typing 2.5s steps(33) forwards, blink-caret .75s step-end infinite;
    }
    @keyframes typing {
      from { width: 0; }
      to { width: 55ch; } /* Cümlədəki simvol sayı qədər (character unit) */
    }
    @keyframes blink-caret {
      from, to { border-color: transparent }
      50% { border-color: #c4b5fd; }
    }

    .animation-stage {
        width: 100%;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: absolute;
        opacity: 0;
        transform: scale(0.95) translateY(20px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        padding: 1rem;
    }
    .animation-stage.active {
        opacity: 1;
        transform: scale(1) translateY(0);
    }

    /* Stage 1: Analyzing */
    @keyframes spin-glow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .ai-processor-icon { font-size: 3rem; color: #a5b4fc; animation: spin-glow 2s linear infinite; }
    .analyzing-text { margin-top: 1rem; color: var(--text-secondary); font-family: 'Fira Code', monospace; }

    /* --- Stage 2: Təkmilləşdirilmiş DB Schema --- */
    .db-schema-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; position: relative; width: 100%; max-width: 500px; }
    .db-table { background: #111827; border: 1px solid var(--border-color); border-top: 4px solid #6366f1; border-radius: 8px; padding: 1rem; font-family: 'Fira Code', monospace; font-size: 0.8rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
    .db-schema-grid .db-table:nth-child(2) {
    transform: translateY(75px); 
}
    .db-table-header { font-weight: bold; color: #a5b4fc; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    .db-column { color: var(--text-secondary); } .db-column span { color: #f59e0b; margin-right: 5px; }
    .db-schema-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .relation-line { stroke: rgba(139, 92, 246, 0.7); stroke-width: 2; fill: none; stroke-dasharray: 200; stroke-dashoffset: 200; animation: draw-line 1s ease-out 0.5s forwards; }
    @keyframes draw-line { to { stroke-dashoffset: 0; } }

    /* Stage 3: API Generation */
    .api-code-block { background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; font-family: 'Fira Code', monospace; font-size: 0.8rem; text-align: left; width: 100%; max-width: 450px; position: relative; }
    .api-code-block::before { content: '● ● ●'; position: absolute; top: 10px; left: 15px; color: #4b5563; font-size: 12px; }
    .api-code-content { padding-top: 20px; }
    @keyframes fadeIn-line { from { opacity: 0; } to { opacity: 1; } }
    .api-code-content > div { opacity: 0; animation: fadeIn-line 0.5s forwards; }
    .code-keyword { color: #c084fc; font-weight: 600; } .code-path { color: #9ca3af; } .code-variable { color: #60a5fa; }
    
    /* --- Stage 4: Təkmilləşdirilmiş Integration --- */
    .integration-container {
    position: relative;
    width: 250px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.api-hub {
    position: relative;
    z-index: 2;
    width: 70px;
    height: 70px;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #6366f1;
}
.api-hub i {
    font-size: 1.8rem;
    color: #a5b4fc;
}
.api-hub::before {
    content: '';
    position: absolute;
    z-index: -1;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #6366f1;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.7; }
    70% { transform: scale(1.5); opacity: 0; }
    100% { transform: scale(0.9); opacity: 0; }
}
.frontend-icon-wrapper {
    position: absolute;
    z-index: 2;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    border: 1px solid var(--border-color);
    border-radius: 50%;
}
.frontend-icon-wrapper.react {
    top: 50%;
    left: -20px; /* Konteynerdən bir qədər kənarda */
    transform: translateY(-50%);
}
.frontend-icon-wrapper.vue {
    top: 0px;
    right: 20px;
}
.frontend-icon-wrapper.angular {
    bottom: 0px;
    right: 20px;
}

.frontend-icon {
    font-size: 1.6rem;
    opacity: 0;
    animation: fadeIn-line 0.5s 0.5s forwards;
}
.frontend-icon.react { color: #61DAFB; }
.frontend-icon.vue { color: #4FC08D; }
.frontend-icon.angular { color: #DD0031; }

.integration-svg {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    overflow: visible;
    pointer-events: none;
}
.integration-svg path {
    fill: none; /* Yolun içini boş saxlayır */
    stroke: rgba(99, 102, 241, 0.3); /* Yola zəif rəng verir */
    stroke-width: 1.5px;
    stroke-dasharray: 4 4; /* Qırıq-qırıq xətt effekti */
}
.data-packet {
    fill: #a5b4fc;
    animation: move-packet 3s ease-in-out infinite;
}
.data-packet.p2 { animation-delay: 1s; }
.data-packet.p3 { animation-delay: 2s; }

@keyframes move-packet {
    from { motion-offset: 0%; opacity: 1; }
    to { motion-offset: 100%; opacity: 0; }
}

   
    @keyframes draw-horiz-line { to { opacity: 1; transform: scaleX(1); } }
    .frontend-icons { display: flex; flex-direction: column; gap: 1rem; }
    .frontend-icon { font-size: 1.8rem; opacity: 0; transform: translateX(20px); animation: fade-in-right 0.5s forwards; }
    .frontend-icon:nth-child(1) { animation-delay: 0.8s; color: #61DAFB; } /* React */
    .frontend-icon:nth-child(2) { animation-delay: 1.0s; color: #4FC08D; } /* Vue */
    .frontend-icon:nth-child(3) { animation-delay: 1.2s; color: #DD0031; } /* Angular */
    @keyframes fade-in-right { to { opacity: 1; transform: translateX(0); } }
    .section-padding { padding: 6rem 0; } .section-header { margin-bottom: 4rem; }
    .section-title { 
      font-size: clamp(2.2rem, 5vw, 3rem); 
      font-weight: 800; 
      margin-bottom: 1rem; 
      text-align: center;
    }
    .section-subtitle { font-size: 1.15rem; color: var(--text-secondary); max-width: 700px; margin: 0 auto; }
    .modal-content { background: #0f172a; border: 1px solid var(--border-color); border-radius: 16px; color: var(--text-primary); }
    .modal-header { border-bottom: 1px solid var(--border-color); }
    .modal-footer { border-top: 1px solid var(--border-color); }
    .btn-close { filter: invert(1) grayscale(100%) brightness(200%); }
    @media (max-width: 991px) { .navbar-collapse { background: rgba(3, 7, 18, 0.95); border-radius: 15px; margin-top: 1rem; padding: 1.5rem; border: 1px solid var(--border-color); } .navbar-nav { text-align: center; } .hero-section { text-align: center; } .hero-subtitle { margin: 0 auto 2.5rem; } .d-flex.gap-3 { justify-content: center; } }

    /* Gradients & Backgrounds */
    .bg-gradient-primary { background: var(--primary-gradient); }
    .gradient-text {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p, li, h1, h2, h3, h4, h5, h6, blockquote {
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    /* Navigation */
    .navbar-custom {
      background: rgba(3, 7, 18, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 1rem 0;
    }
    
    /* Fix navbar spacing issue on IntroPage */
    .navbar.fixed-top {
      background: rgba(3, 7, 18, 0.9) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 0;
    }
    .navbar-brand {
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .navbar-toggler { border: none; }
    .navbar-toggler:focus { box-shadow: none; }
    .navbar-toggler i { color: var(--text-primary); font-size: 1.5rem; }
    .nav-link {
        font-weight: 500;
        color: var(--text-secondary) !important;
        transition: color 0.3s ease;
    }
    .nav-link:hover { color: var(--text-primary) !important; }

    /* Hero Section */
    .hero-section {
      min-height: 100vh;
      position: relative;
      display: flex;
      align-items: center;
      padding-top: 5rem;
      background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.1), transparent);
    }
    
    /* Fix page wrapper to eliminate black space */
    .page-wrapper {
      background: var(--dark-bg);
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    
    /* Ensure no margin/padding issues */
    body {
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    
    /* Fix navbar positioning */
    .navbar.fixed-top {
      z-index: 1030;
      margin: 0;
      padding: 0.75rem 0;
    }
    
    /* Remove any default margins from sections */
    .section {
      margin: 0;
      padding: 0;
    }
    .hero-title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }
    .hero-subtitle {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      color: var(--text-secondary);
      margin-bottom: 2.5rem;
      line-height: 1.7;
      max-width: 550px;
    }

    /* Buttons */
    .btn-gradient {
      background: var(--primary-gradient);
      border: none;
      padding: 14px 32px;
      border-radius: 50px;
      font-weight: 600;
      color: white !important;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3), 0 1px 3px rgba(0,0,0,0.2);
    }
    .btn-gradient:hover {
      transform: translateY(-4px);
      box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4), 0 1px 3px rgba(0,0,0,0.2);
    }
    .btn-outline-custom {
      border: 2px solid var(--border-color);
      padding: 14px 32px;
      border-radius: 50px;
      font-weight: 600;
      color: white !important;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      background: transparent;
    }
    .btn-outline-custom:hover { background: var(--border-color); }

    /* AI Prompt Visual */
    .ai-prompt-visual {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }
    .prompt-input {
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      font-family: 'Fira Code', 'Menlo', monospace;
      font-size: 0.9rem;
      color: #a5b4fc;
    }
    .prompt-arrow {
      font-size: 2rem;
      color: var(--text-white);
      margin: 1.5rem 0;
      transform: rotate(90deg);
    }
    @media (min-width: 992px) { .prompt-arrow { transform: rotate(0deg); } }
    .code-output {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      font-family: 'Fira Code', 'Menlo', monospace;
      font-size: 0.9rem;
      color: #9ca3af;
      position: relative;
      overflow: hidden;
      min-height: 150px;
    }
    .code-output::before {
      content: '● ● ●';
      position: absolute;
      top: 10px;
      left: 15px;
      color: #4b5563;
      font-size: 12px;
    }
    .code-output span { display: block; }
    .code-keyword { color: #c084fc; }
    .code-string { color: #a5b4fc; }
    .code-variable { color: #60a5fa; }
    .code-comment { color: #6b7280; }

    /* Sections & Cards */
    .section-padding { padding: 6rem 0; }
    .section-header { margin-bottom: 4rem; }
    .section-title {
      font-size: clamp(2.2rem, 5vw, 3rem);
      font-weight: 800;
      margin-bottom: 1rem;
      text-align: center;
    }
    .section-subtitle {
      font-size: 1.15rem;
      color: var(--text-secondary);
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
    .feature-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      height: 100%;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .feature-card:hover {
      transform: translateY(-10px);
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .feature-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.7rem;
      margin-bottom: 1.5rem;
      color: white;
    }
    
    /* How it works */
    .step-card { text-align: center; }
    .step-number {
      font-size: 4rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.1);
      margin-bottom: -1.5rem;
    }
    .step-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin-bottom: 1.5rem;
        color: white;
        border: 2px solid var(--border-color);
    }
    
    /* Pricing */
    .pricing-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2.5rem;
      height: 100%;
      transition: all 0.3s ease;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .pricing-card.popular {
      border: 2px solid #6366f1;
      transform: scale(1.05);
      box-shadow: 0 20px 50px rgba(99, 102, 241, 0.2);
    }
    .pricing-card:hover { transform: translateY(-10px); }
    .pricing-card.popular:hover { transform: scale(1.05) translateY(-10px); }
    .popular-badge {
      position: absolute;
      top: -15px; left: 50%;
      transform: translateX(-50%);
      background: var(--primary-gradient);
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .price { font-size: 3.5rem; font-weight: 800; }
    .pricing-card .list-unstyled { margin-bottom: 2rem; flex-grow: 1; }

    /* Testimonials */
    .testimonial-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      height: 100%;
    }
    .avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
    
    /* Footer */
    .footer {
      background: #000;
      border-top: 1px solid var(--border-color);
      padding: 5rem 0 2rem 0;
      margin-top: 6rem;
    }
    .footer-links { color: var(--text-secondary); text-decoration: none; transition: color 0.3s ease; }
    .footer-links:hover { color: var(--text-primary); }
    .social-icon {
      width: 40px; height: 40px;
      
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.3s ease;
    }
    .social-icon:hover {
      
      color: white;
      transform: translateY(-3px);
    }

    /* Modal */
    .modal-content {
        background: #0f172a;
        border: 1px solid var(--border-color);
        border-radius: 16px;
        color: var(--text-primary);
    }
    .modal-header { border-bottom: 1px solid var(--border-color); }
    .modal-footer { border-top: 1px solid var(--border-color); }
    .btn-close {
        filter: invert(1) grayscale(100%) brightness(200%);
    }

    /* About Us Section Styles */
    .about-content {
      padding-right: 2rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-item h4 {
      font-size: 2rem;
      font-weight: 800;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .team-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(12px);
    }
    .team-card:hover {
      transform: translateY(-5px);
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    }
    .team-avatar {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      display: block;
    }
    .mission-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 3rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .value-item {
      text-align: center;
      padding: 1.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
    }
    .value-item:hover {
      transform: translateY(-3px);
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    .value-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: block;
    }

    /* Responsive adjustments */
    @media (max-width: 991px) {
      .navbar-collapse {
        background: rgba(3, 7, 18, 0.95);
        border-radius: 15px;
        margin-top: 1rem;
        padding: 1.5rem;
        border: 1px solid var(--border-color);
      }
      .navbar-nav { text-align: center; }
      .pricing-card.popular { transform: none; }
      .hero-section { text-align: center; }
      .hero-subtitle { margin-left: auto; margin-right: auto; }
      .d-flex.gap-3 { justify-content: center; }
      .about-content { padding-right: 0; margin-bottom: 3rem; }
      .team-grid { grid-template-columns: 1fr; }
      .values-grid { grid-template-columns: repeat(2, 1fr); }
      .mission-card { padding: 2rem; }
    }
    @media (max-width: 576px) {
      .values-grid { grid-template-columns: 1fr; }
      .d-flex.gap-4 { flex-direction: column; gap: 1.5rem !important; }
    }
      .faq-accordion .accordion-item {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 1rem !important;
    margin-bottom: 1rem;
    overflow: hidden; /* For border-radius */
}

.faq-accordion .accordion-header .accordion-button {
    background-color: transparent;
    color: var(--text-primary);
    font-weight: 600;
    box-shadow: none;
}

.faq-accordion .accordion-header .accordion-button:not(.collapsed) {
    background: var(--primary-gradient);
    color: white;
}

.faq-accordion .accordion-header .accordion-button::after {
    filter: invert(1) grayscale(100%) brightness(200%);
}

.faq-accordion .accordion-body {
    color: var(--text-secondary);
    background-color: rgba(0,0,0,0.2);
}
  `;

  // --- renderAnimationStage funksiyasının yeni versiyası ---
const renderAnimationStage = () => (
  <>
      {/* Stage 0 (Prompt) buradan çıxarıldı, çünki artıq sabitdir */}

             <div className={`animation-stage ${animationStage === 1 ? 'active' : ''}`}>
           <div className="ai-processor-icon">⚫</div>
           <p className="analyzing-text">Analyzing Prompt...</p>
       </div>

      <div className={`animation-stage ${animationStage === 2 ? 'active' : ''}`}>
          {/* ... Database Schema JSX kodu burada qalır ... */}
                     <h5 className="mb-3 fw-bold">🗄️ Database Schema</h5>
          <div className="db-schema-grid">
               <div className="db-table">
                  <div className="db-table-header">Users</div>
                  <div className="db-column"><span>PK</span> id</div>
                  <div className="db-column">username</div>
              </div>
              <div className="db-table">
                  <div className="db-table-header">Posts</div>
                  <div className="db-column"><span>PK</span> id</div>
                  <div className="db-column"><span>FK</span> user_id</div>
              </div>
              <div className="db-table">
                  <div className="db-table-header">Comments</div>
                  <div className="db-column"><span>PK</span> id</div>
                  <div className="db-column"><span>FK</span> post_id</div>
              </div>
              <svg className="db-schema-svg">
                  <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(139, 92, 246, 0.7)" />
                      </marker>
                  </defs>
              </svg>
          </div>
      </div>

      <div className={`animation-stage ${animationStage === 3 ? 'active' : ''}`}>
          {/* ... Generated API JSX kodu burada qalır ... */}
                     <h5 className="mb-3 fw-bold">📡 Generated API</h5>
          <div className="api-code-block">
            <div className="api-code-content">
              <div style={{animationDelay: '0.3s'}}><span><span className="code-keyword">GET </span> <span className="code-path">/api/v1/users</span></span></div>
              <div style={{animationDelay: '0.8s'}}><span><span className="code-keyword">POST</span> <span className="code-path">/api/v1/users</span></span></div>
              <div style={{animationDelay: '1.3s'}}><span><span className="code-keyword">GET </span> <span className="code-path">/api/v1/posts</span></span></div>
              <div style={{animationDelay: '1.8s'}}><span><span className="code-keyword">POST</span> <span className="code-path">/api/v1/posts</span></span></div>
              <div style={{animationDelay: '2.3s'}}><span><span className="code-keyword">GET </span> <span className="code-path">/api/v1/posts/&#123;<span className="code-variable">id</span>&#125;/comments</span></span></div>
            </div>
          </div>
      </div>

      <div className={`animation-stage ${animationStage === 4 ? 'active' : ''}`}>
           {/* ... Ready to Integrate JSX kodu burada qalır ... */}
                     <h5 className="mb-4 fw-bold">🔗 Ready to Integrate</h5>
          <div className="integration-container">
                             <div className="api-hub">🖥️</div>
                             <div className="frontend-icon-wrapper react"><span className="frontend-icon react">🟦</span></div>
               <div className="frontend-icon-wrapper vue"><span className="frontend-icon vue">🟩</span></div>
               <div className="frontend-icon-wrapper angular"><span className="frontend-icon angular">🟥</span></div>
              <svg className="integration-svg">
    {/* Mərkəzdən ikonlara gedən yeni yollar */}
    <path id="path-react" d="M 125,100 C 80,100 40,100 0,100" />
    <path id="path-vue"   d="M 125,100 C 150,50 200,30 230,20" />
    <path id="path-angular" d="M 125,100 C 150,150 200,170 230,180" />
    
    {/* Data paketləri (bunlar dəyişmir) */}
    <circle r="4" className="data-packet p1">
        <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
            <mpath href="#path-react"/>
        </animateMotion>
    </circle>
    <circle r="4" className="data-packet p2">
        <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
            <mpath href="#path-vue"/>
        </animateMotion>
    </circle>
    <circle r="4" className="data-packet p3">
        <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
            <mpath href="#path-angular"/>
        </animateMotion>
    </circle>
</svg>
          </div>
      </div>
  </>
);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      
      {/* Special Theme Switch for Intro Page */}
      <IntroThemeSwitch />
      
      {/* Professional Navigation */}
      <Navbar expand="lg" className="navbar fixed-top" variant="dark">
        <Container>
          <Navbar.Brand href="#" className="navbar-brand">
            <img 
              src={backlifyIcon} 
              alt="Backlify Logo" 
              width="32" 
              height="32"
              style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(78%) saturate(2476%) hue-rotate(235deg) brightness(102%) contrast(97%)' }}
            /> 
            Backlify
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="navbarNav" className="border-0" />
          <Navbar.Collapse id="navbarNav">
            <Nav className="mx-auto">
              <Nav.Link href="#features" className="nav-link">Features</Nav.Link>
              <Nav.Link href="#how-it-works" className="nav-link">How It Works</Nav.Link>
              <Nav.Link href="#about" className="nav-link">About</Nav.Link>
              <Nav.Link href="#pricing" className="nav-link">Pricing</Nav.Link>
              <Nav.Link href="#faq" className="nav-link">FAQ</Nav.Link>
              <Nav.Link href="/privacy" className="nav-link">Privacy</Nav.Link>
            </Nav>
            
            <div className="d-flex gap-3 align-items-center">
              <Button 
                variant="outline" 
                href="/login" 
                className="btn btn-outline d-none d-lg-flex"
              >
                Log In
              </Button>
              <Button 
                variant="primary" 
                href="/register" 
                className="btn btn-primary"
                onClick={handleStartClick}
              >
                🚀 Start for Free
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="page-wrapper">
        {/* Professional Hero Section */}
        <section className="hero-section section" style={{ marginTop: 0, paddingTop: '5rem' }}>
        <Container>
          <Row className="align-items-center min-vh-100 landing-page">
            <Col lg={6} className="text-center text-lg-start">
              <div className="hero-content">
                <h1 className="heading-1 mb-6">
                  Less Code, <span className="text-gradient">Build Fast.</span><br />
                  Instantly.
                </h1>
                <p className="body-large text-light mb-8" style={{ maxWidth: '500px' }}>
                  Backlify is the AI-powered platform that eliminates the need for backend coding. 
                  Simply describe your idea, and let our AI generate the database schema and ready-to-use APIs for you.
                </p>
                <div className="d-flex gap-4 flex-wrap justify-content-center justify-content-lg-start">
                  <Button 
                    variant="primary" 
                    size="lg"
                    href="/register" 
                    className="btn btn-primary btn-lg"
                    onClick={handleStartClick}
                  >
                    ✨ Start Building with AI
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    href="#how-it-works" 
                    className="btn btn-outline btn-lg"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="animate-float">
    <div className="dynamic-visual-container">
        {/* YUXARIDA SABİT QALAN PROMPT HİSSƏSİ */}
        <div style={{ width: '100%' }}>
                         <h5 className="mb-3 fw-bold text-center">💻 Your Prompt</h5>
            <div className="prompt-box">
              <span key={loopKey} className="typing-effect">Build a blog API where users can write posts, comments</span>
            </div>
        </div>

        {/* AŞAĞIDA DƏYİŞƏN ANİMASİYA HİSSƏSİ */}
        <div className="animation-stages-wrapper">
            {renderAnimationStage()}
        </div>
    </div>
</div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding">
        <Container>
          <div className="section-header text-center">
            <h2 className="section-title">Everything You Need for a <span className="gradient-text">Powerful Backend</span></h2>
            <p className="section-subtitle">From rapid prototyping to enterprise-level applications, Backlify provides the tools for success.</p>
          </div>
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="feature-card">
                <div className="feature-icon bg-gradient-primary">🚀</div>
                <h5 className="mb-3 text-white">Fast Development</h5>
                <p className="text-secondary">Go from idea to a production-ready backend in minutes, not weeks. Accelerate your workflow by up to 90%.</p>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="feature-card">
                                 <div className="feature-icon" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'}}>♾️</div>
                <h5 className="mb-3  text-white">Unlimited Integration</h5>
                <p className="text-secondary">Connect to any frontend framework. Your generated REST API works seamlessly with React, Vue, Angular, and more.</p>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="feature-card">
                                 <div className="feature-icon" style={{background: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)'}}>🛡️</div>
                <h5 className="mb-3  text-white" >Built-in Security</h5>
                <p className="text-secondary">Enterprise-grade security out-of-the-box with JWT-based authentication, authorization, and secure endpoints.</p>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="feature-card">
                                 <div className="feature-icon" style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}>📈</div>
                <h5 className="mb-3  text-white">Automatic Scalability</h5>
                <p className="text-secondary">Built on a serverless architecture that automatically scales from zero to millions of requests without any configuration.</p>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="section-padding" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
        <Container>
          <div className="section-header text-center">
            <h2 className="section-title">From Prompt to API in <span className="gradient-text">3 Simple Steps</span></h2>
          </div>
          <Row className="g-5 align-items-center">
            <Col md={4}>
              <div className="step-card">
                <div className="step-number">01</div>
                                 <div className="step-icon bg-gradient-primary mx-auto animate-pulse-glow">💡</div>
                <h4 className="mb-3">Describe Your Idea</h4>
                <p className="text-secondary">Write in plain English how your backend should work. For example: "Users can order products."</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="step-card">
                <div className="step-number">02</div>
                                 <div className="step-icon mx-auto animate-pulse-glow" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'}}>🤖</div>
                <h4 className="mb-3">Let AI Do the Work</h4>
                <p className="text-secondary">Backlify's AI analyzes your text and instantly generates all the database tables, relationships, and API endpoints.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="step-card">
                <div className="step-number">03</div>
                                 <div className="step-icon mx-auto animate-pulse-glow" style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}>🔗</div>
                <h4 className="mb-3">Integrate & Launch</h4>
                <p className="text-secondary">Your API is live! Connect it to your frontend application and launch your project in record time.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* About Us Section */}
      <section id="about" className="section-padding" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
        <Container>
          <div className="section-header text-center">
            <h2 className="section-title">About <span className="gradient-text">Backlify</span></h2>
            <p className="section-subtitle">
              We're on a mission to democratize backend development and make it accessible to everyone.
            </p>
          </div>
          <Row className="g-5 align-items-center">
            <Col lg={6}>
              <div className="about-content">
                <h3 className="mb-4 text-white">Our Story</h3>
                <p className="text-secondary mb-4">
                  Backlify was born from a simple observation: while frontend development has become increasingly visual and accessible, 
                  backend development remains complex and time-consuming. We believe that great ideas shouldn't be held back by technical barriers.
                </p>
                <p className="text-secondary mb-4">
                  Our team of experienced developers and AI researchers came together to create a platform that bridges this gap. 
                  We've combined cutting-edge artificial intelligence with intuitive design to make backend development as simple as describing your idea.
                </p>
                <div className="d-flex gap-4 mb-4">
                  <div className="stat-item">
                    <h4 className="gradient-text mb-1">10K+</h4>
                    <p className="text-secondary small mb-0">APIs Generated</p>
                  </div>
                  <div className="stat-item">
                    <h4 className="gradient-text mb-1">500+</h4>
                    <p className="text-secondary small mb-0">Happy Developers</p>
                  </div>
                  <div className="stat-item">
                    <h4 className="gradient-text mb-1">99.9%</h4>
                    <p className="text-secondary small mb-0">Uptime</p>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="about-visual">
                <div className="team-grid">
                  <div className="team-card">
                    <div className="team-avatar">👨‍💻</div>
                    <h6 className="text-white mb-1">AI Engineers</h6>
                    <p className="text-secondary small">Building the future of development</p>
                  </div>
                  <div className="team-card">
                    <div className="team-avatar">🎨</div>
                    <h6 className="text-white mb-1">UX Designers</h6>
                    <p className="text-secondary small">Creating intuitive experiences</p>
                  </div>
                  <div className="team-card">
                    <div className="team-avatar">🔧</div>
                    <h6 className="text-white mb-1">DevOps Experts</h6>
                    <p className="text-secondary small">Ensuring reliability & scale</p>
                  </div>
                  <div className="team-card">
                    <div className="team-avatar">🚀</div>
                    <h6 className="text-white mb-1">Product Team</h6>
                    <p className="text-secondary small">Driving innovation forward</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <Row className="mt-5">
            <Col lg={12}>
              <div className="mission-statement">
                <div className="mission-card">
                  <h4 className="text-white mb-3">Our Mission</h4>
                  <p className="text-secondary mb-4">
                    To eliminate the complexity of backend development and empower creators, entrepreneurs, and developers 
                    to focus on what matters most: building amazing products that solve real-world problems.
                  </p>
                  <div className="values-grid">
                    <div className="value-item">
                      <div className="value-icon">🎯</div>
                      <h6 className="text-white mb-2">Innovation</h6>
                      <p className="text-secondary small">Pushing the boundaries of what's possible with AI</p>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">🤝</div>
                      <h6 className="text-white mb-2">Accessibility</h6>
                      <p className="text-secondary small">Making advanced technology available to everyone</p>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">⚡</div>
                      <h6 className="text-white mb-2">Speed</h6>
                      <p className="text-secondary small">Delivering results in minutes, not months</p>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">🛡️</div>
                      <h6 className="text-white mb-2">Reliability</h6>
                      <p className="text-secondary small">Enterprise-grade security and performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
{/* Pricing Section */}
<section id="pricing" className="section-padding">
  <Container>
    <div className="section-header text-center">
      <h2 className="section-title">Simple Pricing for <span className="gradient-text">Every Need</span></h2>
      <p className="section-subtitle">Choose the plan that fits your project. Scale as you grow. No hidden fees.</p>
    </div>
    
    {plansLoading ? (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary mt-3">Loading pricing plans...</p>
      </div>
    ) : (
      <Row className="g-4 justify-content-center">
        {subscriptionPlans.map((plan, index) => (
          <Col md={6} lg={4} key={plan.id}>
            <div className={`pricing-card ${plan.id === 'pro' ? 'popular' : ''}`}>
              {plan.id === 'pro' && <div className="popular-badge">Most Popular</div>}
              <h5 className="mb-3">{plan.name}</h5>
              <div className="price mb-3 gradient-text">
                {subscriptionService.formatPrice(plan.price, plan.currency)}
                {plan.price > 0 && <span className="text-secondary fs-5">/mo</span>}
              </div>
              <p className="text-white small mb-3">
                {plan.id === 'basic' && 'Perfect for getting started'}
                {plan.id === 'pro' && 'For growing applications'}
                {plan.id === 'enterprise' && 'For advanced functionality'}
              </p>
              <ul className="list-unstyled text-secondary">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="mb-2">
                    <span className="text-success me-2">•</span>{feature}
                  </li>
                ))}
              </ul>
              <a 
                href={plan.price === 0 ? "/register" : "/payment/plans"} 
                className={`${plan.id === 'pro' ? 'btn-gradient' : 'btn-outline-custom'} w-100 mt-auto`} 
                onClick={handleStartClick}
              >
                {plan.price === 0 ? 'Start for Free' : 'Choose Plan'}
              </a>
            </div>
          </Col>
        ))}
      </Row>
    )}
  </Container>
</section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="section-padding">
        <Container>
          <div className="section-header text-center">
            <h2 className="section-title">Loved by <span className="gradient-text">Developers</span> Worldwide</h2>
          </div>
          <Row className="g-4">
            <Col md={4}>
              <Card className="testimonial-card h-100">
                <blockquote className="mb-4 text-secondary fst-italic">"Backlify changed the game for us. What used to take weeks of backend development now takes a few hours. Absolutely brilliant!"</blockquote>
                <div className="d-flex align-items-center">
                  <img src="https://i.pravatar.cc/50?img=1" alt="Alex Chen - VP Engineering at TechCorp" className="avatar me-3" loading="lazy" width="50" height="50" />
                  <div>
                    <h6 className="mb-0 text-white">Alex Chen</h6>
                    <small className="text-light">VP Engineering, TechCorp</small>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="testimonial-card h-100">
                <blockquote className="mb-4 text-secondary fst-italic">"The AI schema generation is magical. Now our entire team can rapidly prototype ideas, not just our backend engineers."</blockquote>
                <div className="d-flex align-items-center">
                  <img src="https://i.pravatar.cc/50?img=2" alt="Sarah Johnson - CTO at StartupHub" className="avatar me-3" loading="lazy" width="50" height="50" />
                  <div>
                    <h6 className="mb-0 text-white">Sarah Johnson</h6>
                    <small className="text-light">CTO, StartupHub</small>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="testimonial-card h-100">
                <blockquote className="mb-4 text-secondary fst-italic">"The security and scalability were critical for us. We scaled our startup quickly with Backlify without worrying about infrastructure."</blockquote>
                <div className="d-flex align-items-center">
                  <img src="https://i.pravatar.cc/50?img=3" alt="Mike Kim - Founder at AppBuilders" className="avatar me-3" loading="lazy" width="50" height="50" />
                  <div>
                    <h6 className="mb-0 text-white">Mike Kim</h6>
                    <small className="text-light">Founder, AppBuilders</small>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </section> */}
      

      

      {/* Final CTA Section */}
      {/* === YENİ FAQ BÖLMƏSİ === */}
      <section id="faq" className="section-padding">
    <Container>
        <div className="section-header text-center">
            <h2 className="section-title">Frequently Asked <span className="gradient-text">Questions</span></h2>
            <p className="section-subtitle">
                Got questions? We've got answers. If you have any other questions, feel free to contact us.
            </p>
        </div>
        <Row className="justify-content-center">
            <Col lg={8}>
                <Accordion defaultActiveKey="0" className="faq-accordion">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Do I need coding skills to use Backlify?</Accordion.Header>
                        <Accordion.Body>
                            Not at all. Backlify is designed as a no-code / low-code backend platform.  
                            You simply describe what you want, and our AI generates the database schema and API endpoints automatically.  
                            Developers, however, can still fine-tune everything if needed.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header>How does Backlify generate APIs?</Accordion.Header>
                        <Accordion.Body>
                            Backlify uses AI to analyze your prompt and automatically create a database schema, relationships, and fully documented REST endpoints.  
                            You can preview and edit the schema visually before deploying.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>What kind of projects can I build with Backlify?</Accordion.Header>
                        <Accordion.Body>
                            Anything from MVPs and prototypes to production-grade apps.  
                            Backlify is ideal for SaaS products, internal dashboards, mobile apps, and startups who need a backend fast without hiring a full team.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="3">
                        <Accordion.Header>How does pricing work?</Accordion.Header>
                        <Accordion.Body>
                            Backlify follows a usage-based pricing model.  
                            Your first <b>1K API requests are free</b>. After that, you only pay for what you use – making it cost-effective for both small projects and enterprise applications.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="4">
                        <Accordion.Header>Can I integrate Backlify with my existing systems?</Accordion.Header>
                        <Accordion.Body>
                            Yes. Backlify APIs are standard REST endpoints, making it easy to connect with any frontend (React, Vue, Angular, mobile apps) or third-party service.  
                            Soon, we’ll also add GraphQL support and external integrations.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="5">
                        <Accordion.Header>Is my data secure?</Accordion.Header>
                        <Accordion.Body>
                            Security is a top priority.  
                            Your data is hosted on enterprise-grade cloud infrastructure, isolated per project.  
                            You always retain full ownership of your data and can export it anytime in JSON or CSV formats.
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Col>
        </Row>
    </Container>
</section>
<section id="contact" className="section-padding" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
        <Container>
            <div className="section-header text-center">
                <h2 className="section-title">Get In <span className="gradient-text">Touch</span></h2>
                <p className="section-subtitle">
                    Have a question or want to work together? Send us a message.
                </p>
            </div>
            <Row className="justify-content-center">
                <Col lg={7}>
                    <div className="contact-form-container">
                        <Form onSubmit={handleContactSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary">Your Email</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    name="email"
                                    placeholder="you@example.com" 
                                    required 
                                    className="form-control-contact"
                                    value={contactForm.email}
                                    onChange={handleContactChange}
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="text-secondary">Message</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    name="message"
                                    rows={5} 
                                    placeholder="Let us know how we can help!" 
                                    required 
                                    className="form-control-contact"
                                    value={contactForm.message}
                                    onChange={handleContactChange}
                                />
                            </Form.Group>
                            <div className="text-center">
                                <Button type="submit" className="btn-gradient px-5" disabled={isSending}>
                                    {isSending ? 'Sending...' : 'Send Message'}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="footer">
        <Container>
          <Row className="g-4" style={{justifyContent:"center", textAlign:"center"}}>
            <Col lg={4} md={6} style={{justifyContent:"center", textAlign:"center"}}>
                             <a href="#" style={{justifyContent:"center", textAlign:"center"}} className="navbar-brand gradient-text mb-3 d-inline-block d-flex align-items-center">
                 <img 
                   src={backlifyIcon} 
                   alt="Backlify Logo" 
                   width="20" 
                   height="20" 
                   className="me-2"
                   style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(78%) saturate(2476%) hue-rotate(235deg) brightness(102%) contrast(97%)' }}
                 />
                 Backlify
               </a>
              <p className="text-secondary mb-4">The platform that makes backend creation visual and effortless. Build professional APIs without coding.</p>
              <div className="d-flex gap-2" style={{justifyContent:"center", textAlign:"cente"}}>
                <a href="https://www.linkedin.com/company/backlify-ai" className="social-icon"><img className="social-icon" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/LinkedIn_icon_circle.svg/640px-LinkedIn_icon_circle.svg.png" alt="Backlify LinkedIn Company Page" loading="lazy" width="24" height="24"/></a>
              </div>
            </Col>
          </Row>
          <hr className="my-4" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
          <Row className="align-items-center">
            <Col md={6}>
              <p className="text-secondary small mb-0">© {new Date().getFullYear()} Backlify. All rights reserved.</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="text-secondary small mb-0">Less Code, <span className="gradient-text">Build Fast.</span></p>
            </Col>
          </Row>
        </Container>
      </footer>
      
      {/* Mobile Experience Warning Modal */}
      <Modal show={showMobileWarning} onHide={handleCloseMobileWarning} centered>
                 <Modal.Header closeButton>
           <Modal.Title>💻 For the Best Experience</Modal.Title>
         </Modal.Header>
        <Modal.Body>
          <p>Hello! To experience the full power and convenience of the Backlify platform, please try it on a desktop computer.</p>
          <p className="text-secondary mb-0">We're working hard on the mobile version and it will be ready soon. Thanks for your understanding! 🚀</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseMobileWarning} className="btn-gradient">
            Got It
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </>
  );
};

export default IntroPage;