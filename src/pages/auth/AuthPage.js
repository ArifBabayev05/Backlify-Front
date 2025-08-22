import React, { useState, useEffect, useRef,createContext,useContext } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import * as THREE from 'three';
import { useAuth } from '../../components/auth/AuthContext';
// Router funksionallığı üçün lazımi importlar
import { MemoryRouter, Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';

//=================================================================
// 1. AuthContext (İstifadəçi məlumatlarını saxlamaq üçün)
//=================================================================
const AuthContext = createContext(null);



const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData);
        // Real proyektlərdə token-ləri localStorage və ya sessionStorage-da saxlamaq olar
        console.log("User data saved in context:", userData);
    };

    const logout = () => {
        setUser(null);
    };

    const value = { user, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


//=================================================================
// 2. 3D Animasya Komponenti 
//=================================================================
const ThreeAnimation = () => {
    const mountRef = useRef(null);
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);

        const primaryColor = 0x6366f1;
        const secondaryColor = 0x8b5cf6;
        const geometry = new THREE.IcosahedronGeometry(1.5, 1);
        const material = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.2, metalness: 0.7, wireframe: true });
        const crystal = new THREE.Mesh(geometry, material);
        scene.add(crystal);

        const torusGeometry = new THREE.TorusGeometry(2.5, 0.05, 16, 100);
        const torusMaterial = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.1, metalness: 0.9 });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.rotation.x = Math.PI / 2;
        scene.add(torus);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

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

        const clock = new THREE.Clock();
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

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'grab' }} />;
};

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


    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateRegisterForm = () => {
        const { username, password, confirmPassword } = registerFormData;
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(username)) { setRegisterError('Username can only contain letters and numbers.'); return false; }
        if (username.length > 20) { setRegisterError('Username cannot be longer than 20 characters.'); return false; }
        if (password !== confirmPassword) { setRegisterError('Passwords do not match.'); return false; }
        if (password.length < 8) { setRegisterError('Password must be at least 8 characters long.'); return false; }
        setRegisterError('');
        return true;
    };

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

    const pageStyles = `
        :root {
            --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            --dark-bg: #030712;
            --card-bg: rgba(31, 41, 55, 0.3);
            --text-primary: #f9fafb;
            --text-secondary: #9ca3af;
            --border-color: rgba(255, 255, 255, 0.2);
        }
        .auth-container { min-height: 100vh; background-color: var(--dark-bg); display: grid; grid-template-columns: 1fr; color: var(--text-primary); }
        @media (min-width: 992px) { .auth-container { grid-template-columns: 1fr 1fr; } }
        
        .auth-left-panel { display: none; position: relative; background: linear-gradient(180deg, rgba(3, 7, 18, 0.9), rgba(3, 7, 18, 1)); padding: 3rem; text-align: center; flex-direction: column; justify-content: center; align-items: center; }
        @media (min-width: 992px) { .auth-left-panel { display: flex; } }
        
        .auth-left-panel .brand-logo { font-size: 2rem; font-weight: 800; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; position: absolute; top: 2rem; left: 2rem; text-decoration: none; }
        .auth-left-panel h2 { font-weight: 700; margin-bottom: 1rem; }
        .auth-left-panel p { color: var(--text-secondary); max-width: 400px; }
        .animation-container { width: 100%; height: 50vh; position: relative; }

        .auth-right-panel { display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; min-height: 100vh; }
        .form-card { width: 100%; max-width: 500px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 1.5rem; padding: 2rem; backdrop-filter: blur(12px); }
        @media (min-width: 576px) { .form-card { padding: 2.5rem; } }

        .auth-tabs { display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; }
        .auth-tab { flex: 1; text-align: center; padding: 1rem; color: var(--text-secondary); font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease; text-decoration: none; }
        .auth-tab:hover { color: var(--text-primary); }
        .auth-tab.active { color: var(--text-primary); border-bottom-color: #6366f1; }

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
            box-shadow: 0 8px 15px rgba(99, 102, 241, 0.25);
        }
        .btn-gradient:hover {
            background-position: right center;
            transform: translateY(-2px);
            box-shadow: 0 12px 20px rgba(99, 102, 241, 0.4);
        }
    `;

    return (
        <>
            <style>{pageStyles}</style>
            <div className="auth-container">
                <div className="auth-left-panel">
                    <Link to="/" className="brand-logo z-3">
                        <i className="fa-solid fa-bolt me-2 z-3"></i>Backlify
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
                                    <div className="d-grid">
                                        <Button type="submit" disabled={loginLoading} className="btn-gradient">
                                            {loginLoading ? 'Signing In...' : 'Sign In'}
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