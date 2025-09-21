import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
// Import only required THREE.js modules for better bundle size
import { 
  Scene, 
  PerspectiveCamera, 
  WebGLRenderer, 
  IcosahedronGeometry, 
  MeshStandardMaterial, 
  Mesh, 
  TorusGeometry, 
  AmbientLight, 
  DirectionalLight,
  Clock 
} from 'three';
import { useAuth } from '../../components/auth/AuthContext';
// Router funksionallığı üçün lazımi importlar
import { MemoryRouter, Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
// Google OAuth import
import { useGoogleLogin } from '@react-oauth/google';

//=================================================================
// 1. AuthContext (İstifadəçi məlumatlarını saxlamaq üçün)
//=================================================================
const AuthContext = createContext(null);



const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData);
        // Real proyektlərdə token-ləri localStorage və ya sessionStorage-da saxlamaq olar
        if (process.env.NODE_ENV === 'development') {
            console.log("User data saved in context:", userData);
        }
    };

    const logout = () => {
        setUser(null);
    };

    const value = { user, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


//=================================================================
// 2. 3D Animasya Komponenti - Memoized for performance
//=================================================================
const ThreeAnimation = React.memo(() => {
    const mountRef = useRef(null);
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;

        const scene = new Scene();
        const camera = new PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);

        const primaryColor = 0x00D2FF;
        const secondaryColor = 0x3A7BD5;
        const geometry = new IcosahedronGeometry(1.5, 1);
        const material = new MeshStandardMaterial({ 
            color: primaryColor, 
            roughness: 0.1, 
            metalness: 0.3, 
            wireframe: true,
            emissive: 0x001122,
            emissiveIntensity: 0.3
        });
        const crystal = new Mesh(geometry, material);
        scene.add(crystal);

        const torusGeometry = new TorusGeometry(2.5, 0.05, 16, 100);
        const torusMaterial = new MeshStandardMaterial({ 
            color: secondaryColor, 
            roughness: 0.05, 
            metalness: 0.8,
            emissive: 0x001133,
            emissiveIntensity: 0.2
        });
        const torus = new Mesh(torusGeometry, torusMaterial);
        torus.rotation.x = Math.PI / 2;
        scene.add(torus);

        const ambientLight = new AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        
        // Add additional blue-tinted light for more vibrant colors
        const blueLight = new DirectionalLight(0x00D2FF, 0.3);
        blueLight.position.set(-3, 2, 3);
        scene.add(blueLight);

        const handleMouseMove = (event) => {
            if (!currentMount) return;
            const rect = currentMount.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        };
        window.addEventListener('mousemove', handleMouseMove);

        const handleResize = () => {
            if (!currentMount) return;
            const width = currentMount.clientWidth;
            const height = currentMount.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const clock = new Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const targetRotationX = mouse.current.y * 0.5;
            const targetRotationY = mouse.current.x * 0.5;
            const lerpFactor = 0.05;
            crystal.rotation.x += (targetRotationX - crystal.rotation.x) * lerpFactor;
            crystal.rotation.y += (targetRotationY - crystal.rotation.y) * lerpFactor;
            torus.rotation.x = crystal.rotation.x + (Math.PI / 2);
            torus.rotation.y = crystal.rotation.y;
            const elapsedTime = clock.getElapsedTime();
            torus.rotation.z = elapsedTime * 0.15;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }} />;
});

//=================================================================
// 3. Əsas AuthPage komponenti (Bütün məntiq burada cəmlənib)
//=================================================================
const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth(); 
    const activeTab = location.pathname === '/login' ? 'login' : 'register';
    const from = location.state?.from?.pathname || '/landing';

    // Register Form State
    const [registerFormData, setRegisterFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerError, setRegisterError] = useState('');

    // Login Form State
    const [loginFormData, setLoginFormData] = useState({ username: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);


    const handleRegisterChange = useCallback((e) => {
        const { name, value } = e.target;
        setRegisterFormData(prev => ({ ...prev, [name]: value }));
    }, []);
    
    const handleLoginChange = useCallback((e) => {
        const { name, value } = e.target;
        setLoginFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const validateRegisterForm = useCallback(() => {
        const { username, password, confirmPassword } = registerFormData;
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(username)) { setRegisterError('Username can only contain letters and numbers.'); return false; }
        if (username.length > 20) { setRegisterError('Username cannot be longer than 20 characters.'); return false; }
        if (password !== confirmPassword) { setRegisterError('Passwords do not match.'); return false; }
        if (password.length < 8) { setRegisterError('Password must be at least 8 characters long.'); return false; }
        if (!privacyAccepted) { setRegisterError('You must accept the privacy policy to continue.'); return false; }
        setRegisterError('');
        return true;
    }, [registerFormData, privacyAccepted]);

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!validateRegisterForm()) return toast.error(registerError);
        
        setRegisterLoading(true);
        setRegisterError('');
        try {
            const { username, email, password } = registerFormData;
            const response = await fetch('https://backlify-v2.onrender.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || data.error || 'Registration failed');
            toast.success('Registration successful! Please sign in.');
            navigate('/login');
        } catch (error) {
            setRegisterError(error.message);
            toast.error(error.message || 'Registration failed.');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        
        
        setLoginLoading(true);
        setLoginError('');
        try {
            const response = await fetch('https://backlify-v2.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginFormData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || data.error || 'Authentication failed');
            }
            
            login({
                XAuthUserId: data.XAuthUserId || loginFormData.username,
                email: data.email,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            });

            toast.success('Login successful!');
            
            navigate(from, { replace: true });

        } catch (error) {
            setLoginError(error.message);
            toast.error(error.message || 'Login failed. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    // Google OAuth login handler
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setLoginLoading(true);
                setLoginError('');
                
                // Get user info from Google API
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                });
                
                if (!userInfoResponse.ok) {
                    throw new Error('Failed to get user information from Google');
                }
                
                const googleUserInfo = await userInfoResponse.json();
                
                // Send Google token to your backend for verification and login
                const response = await fetch('https://backlify-v2.onrender.com/auth/google-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        google_token: tokenResponse.access_token,
                        email: googleUserInfo.email,
                        name: googleUserInfo.name,
                        picture: googleUserInfo.picture,
                        google_id: googleUserInfo.id
                    }),
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // If backend doesn't have Google login endpoint, fall back to auto-registration
                    if (response.status === 404) {
                        // Auto-create user account with Google info
                        const username = googleUserInfo.email.split('@')[0] + '_google';
                        login({
                            XAuthUserId: username,
                            email: googleUserInfo.email,
                            accessToken: tokenResponse.access_token,
                            refreshToken: tokenResponse.refresh_token || ''
                        });
                        toast.success('Google login successful!');
                        navigate(from, { replace: true });
                        return;
                    }
                    throw new Error(data.details || data.error || 'Google authentication failed');
                }
                
                login({
                    XAuthUserId: data.XAuthUserId || googleUserInfo.email.split('@')[0],
                    email: data.email || googleUserInfo.email,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken
                });

                toast.success('Google login successful!');
                navigate(from, { replace: true });
                
            } catch (error) {
                setLoginError(error.message);
                toast.error(error.message || 'Google login failed. Please try again.');
            } finally {
                setLoginLoading(false);
            }
        },
        onError: (error) => {
            if (process.env.NODE_ENV === 'development') {
                console.error('Google Login Failed:', error);
            }
            setLoginError('Google login failed');
            toast.error('Google login failed. Please try again.');
        },
    });

    const pageStyles = useMemo(() => `
        :root {
            --primary-gradient: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 50%, #8B5CF6 100%);
            --dark-bg: #0B0D17;
            --card-bg: rgba(31, 41, 55, 0.3);
            --text-primary: #E2E8F0;
            --text-secondary: #9ca3af;
            --border-color: rgba(0, 210, 255, 0.2);
        }
        .auth-container { min-height: 100vh; background-color: var(--dark-bg); display: grid; grid-template-columns: 1fr; color: var(--text-primary); }
        @media (min-width: 992px) { .auth-container { grid-template-columns: 1fr 1fr; } }
        
        .auth-left-panel { display: none; position: relative; background: linear-gradient(135deg, #0F172A 0%, rgb(20, 27, 39) 50%, rgb(15, 21, 29) 100%); padding: 3rem; text-align: center; flex-direction: column; justify-content: center; align-items: center; }
        @media (min-width: 992px) { .auth-left-panel { display: flex; } }
        
        .auth-left-panel .brand-logo { 
            font-size: 2.2rem; 
            font-weight: 900; 
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 50%, #8B5CF6 100%);
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            background-clip: text; 
            position: absolute; 
            top: 2rem; 
            left: 2rem; 
            text-decoration: none; 
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: all 0.3s ease;
            letter-spacing: -0.02em;
            text-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
        }
        .auth-left-panel .brand-logo:hover {
            transform: scale(1.05);
            filter: brightness(1.2);
        }
        .brand-logo-icon {
            width: 36px;
            height: 36px;
            filter: brightness(0) invert(1);
            transition: all 0.3s ease;
        }
        .auth-left-panel .brand-logo:hover .brand-logo-icon {
            transform: scale(1.1);
            filter: brightness(0) invert(1) drop-shadow(0 0 10px rgba(0, 210, 255, 0.5));
        }
        .auth-left-panel h2 { font-weight: 700; margin-bottom: 1rem; }
        .auth-left-panel p { color: var(--text-secondary); max-width: 400px; }
        .animation-container { width: 100%; height: 50vh; position: relative; }

        .auth-right-panel { display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; min-height: 100vh; }
        .form-card { width: 100%; max-width: 500px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 1.5rem; padding: 2rem; backdrop-filter: blur(12px); }
        @media (min-width: 576px) { .form-card { padding: 2.5rem; } }

        .auth-tabs { display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; }
        .auth-tab { flex: 1; text-align: center; padding: 1rem; color: var(--text-secondary); font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease; text-decoration: none; }
        .auth-tab:hover { color: var(--text-primary); }
        .auth-tab.active { color: var(--text-primary); border-bottom-color: #00D2FF; }

        .form-label-custom { color: var(--text-secondary); font-size: 0.9rem; text-align: left; padding-left: 0; }
        @media (min-width: 576px) { .form-label-custom { text-align: right; padding-right: 1rem; } }

        .form-control-custom {
            background-color: rgba(15, 23, 42, 0.5) !important;
            border: 1px solid transparent !important;
            color: var(--text-primary) !important;
            border-radius: 0.5rem !important;
            padding: 0.9rem 1rem !important;
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .form-control-custom:focus {
            box-shadow: none !important;
            outline: none !important;
            background-color: rgba(3, 7, 18, 0.7) !important;
            border-color: transparent !important;
        }
        .form-control-custom::placeholder { color: rgba(156, 163, 175, 0.5); }
        
        .btn-gradient {
            background: var(--primary-gradient);
            background-size: 200% auto;
            border: none;
            padding: 0.9rem;
            border-radius: 0.75rem;
            font-weight: 600;
            transition: all 0.4s ease-in-out;
            box-shadow: 0 8px 15px rgba(0, 210, 255, 0.25);
        }
        .btn-gradient:hover {
            background-position: right center;
            transform: translateY(-2px);
            box-shadow: 0 12px 20px rgba(0, 210, 255, 0.4);
        }
        
        .btn-google {
            background: #ffffff;
            color: #3c4043;
            border: 1px solid #dadce0;
            padding: 0.9rem;
            border-radius: 0.75rem;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .btn-google:hover {
            background: #f8f9fa;
            color: #3c4043;
            border-color: #dadce0;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .btn-google:focus {
            background: #f8f9fa;
            color: #3c4043;
            border-color: #4285f4;
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        
        .divider {
            position: relative;
            text-align: center;
            margin: 1.5rem 0;
        }
        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--border-color);
        }
        .divider span {
            background: var(--card-bg);
            padding: 0 1rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
    `, []);

    return (
        <>
            <style>{pageStyles}</style>
            <div className="auth-container">
                <div className="auth-left-panel">
                    <Link to="/" className="brand-logo z-3">
                        <img 
                            src="/backlify.png" 
                            alt="Backlify Logo" 
                            className="brand-logo-icon"
                        />
                        Backlify AI
                    </Link>
                    <div className="animation-container">
                        <ThreeAnimation />
                    </div>
                    <h2>Automate Your Backend</h2>
                    <p>Go from a simple idea to a fully functional, scalable backend in minutes. Let AI handle the complexity.</p>
                </div>
                <div className="auth-right-panel">
                    <div className="form-card">
                        <div className="auth-tabs">
                            <Link to="/login" className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}>
                                Sign In
                            </Link>
                            <Link to="/register" className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}>
                                Sign Up
                            </Link>
                        </div>
                        
                        {activeTab === 'login' ? (
                            <div>
                                <div className="text-center mb-4">
                                    <h1 className="h2 fw-bold text-white mb-2">Welcome Back</h1>
                                    <p className="text-secondary">Sign in to continue to your account.</p>
                                </div>

                                <Form onSubmit={handleLoginSubmit}>
                                     <Form.Group as={Row} className="mb-3 align-items-center">
                                        <Form.Label column sm={4} className="form-label-custom">Username</Form.Label>
                                        <Col sm={8}>
                                           <Form.Control type="text" name="username" placeholder="Enter your username" value={loginFormData.username} onChange={handleLoginChange} required className="form-control-custom" />
                                        </Col>
                                    </Form.Group>
                                     <Form.Group as={Row} className="mb-4 align-items-center">
                                        <Form.Label column sm={4} className="form-label-custom">Password</Form.Label>
                                        <Col sm={8}>
                                            <Form.Control type="password" name="password" placeholder="Enter your password" value={loginFormData.password} onChange={handleLoginChange} required className="form-control-custom" />
                                        </Col>
                                    </Form.Group>
                                    
                                    
                                    
                                    <div className="d-grid mb-3">
                                        <Button type="submit" disabled={loginLoading} className="btn-gradient">
                                            {loginLoading ? 'Signing In...' : 'Sign In'}
                                        </Button>
                                    </div>
                                    
                                    <div className="divider">
                                        <span>OR</span>
                                    </div>
                                    
                                    <div className="d-grid">
                                        <Button 
                                            type="button" 
                                            disabled={loginLoading} 
                                            className="btn-google"
                                            onClick={() => handleGoogleLogin()}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 48 48">
                                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                                            </svg>
                                            {loginLoading ? 'Signing in with Google...' : 'Continue with Google'}
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        ) : (
                            <div>
                                <div className="text-center mb-4">
                                    <h1 className="h2 fw-bold text-white mb-2">Create an Account</h1>
                                    <p className="text-secondary">Join us and start building faster today.</p>
                                </div>
                                <Form onSubmit={handleRegisterSubmit}>
                                    <Form.Group as={Row} className="mb-3 align-items-center">
                                        <Form.Label column sm={4} className="form-label-custom">Username</Form.Label>
                                        <Col sm={8}>
                                            <Form.Control type="text" name="username" placeholder="e.g., devmaster" value={registerFormData.username} onChange={handleRegisterChange} required className="form-control-custom"/>
                                        </Col>
                                    </Form.Group>
                                    <Form.Group as={Row} className="mb-3 align-items-center">
                                        <Form.Label column sm={4} className="form-label-custom">Email</Form.Label>
                                        <Col sm={8}>
                                            <Form.Control type="email" name="email" placeholder="you@example.com" value={registerFormData.email} onChange={handleRegisterChange} required className="form-control-custom"/>
                                        </Col>
                                    </Form.Group>
                                    <Form.Group as={Row} className="mb-3 align-items-center">
                                        <Form.Label column sm={4} className="form-label-custom">Password</Form.Label>
                                        <Col sm={8}>
                                            <Form.Control type="password" name="password" placeholder="Min. 8 characters" value={registerFormData.password} onChange={handleRegisterChange} required className="form-control-custom"/>
                                        </Col>
                                    </Form.Group>
                                    <Form.Group as={Row} className="mb-4 align-items-center">
                                        <Form.Label column sm={4} className="form-label-custom">Confirm Password</Form.Label>
                                        <Col sm={8}>
                                            <Form.Control type="password" name="confirmPassword" placeholder="Re-enter password" value={registerFormData.confirmPassword} onChange={handleRegisterChange} required className="form-control-custom"/>
                                        </Col>
                                    </Form.Group>
                                    
                                    {/* Privacy Policy Checkbox */}
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="privacy-policy-register"
                                            checked={privacyAccepted}
                                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                            label={
                                                <span className="text-light" style={{ fontSize: '0.9rem' }}>
                                                    I have read and accept the{' '}
                                                    <Link 
                                                        to="/privacy" 
                                                        className="text-decoration-none" 
                                                        style={{ color: '#00D2FF' }}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Privacy Policy
                                                    </Link>
                                                    <span className="text-danger ms-1">*</span>
                                                </span>
                                            }
                                            className="d-flex align-items-start"
                                            required
                                        />
                                    </Form.Group>

                                    {/* Newsletter Checkbox */}
                                    <Form.Group className="mb-4">
                                        <Form.Check
                                            type="checkbox"
                                            id="newsletter-register"
                                            checked={newsletterSubscribed}
                                            onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                                            label={
                                                <span className="text-light" style={{ fontSize: '0.9rem' }}>
                                                    I agree to receive updates and information via email
                                                </span>
                                            }
                                            className="d-flex align-items-start"
                                        />
                                    </Form.Group>
                                    
                                    <div className="d-grid">
                                        <Button type="submit" disabled={registerLoading} className="btn-gradient">
                                            {registerLoading ? 'Creating Account...' : 'Create Account'}
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
export default AuthPage;