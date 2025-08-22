import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  loginUser as apiLoginUser, 
  logoutUser as apiLogoutUser, 
  setTokens,
  getAccessToken,
  getRefreshToken,
  setXAuthUserId
} from '../../utils/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = () => {
            try {
                const username = localStorage.getItem('username');
                const email = localStorage.getItem('email');
                const savedAccessToken = localStorage.getItem('accessToken');
                const savedRefreshToken = localStorage.getItem('refreshToken');
                
                if (savedAccessToken && savedRefreshToken) {
                    setTokens(savedAccessToken, savedRefreshToken);
                }
                
                if (username) {
                    setXAuthUserId(username);
                }
                
                if (username && email && savedAccessToken) {
                    setUser({ username, email });
                }
            } catch (error) {
                console.error('Error initializing auth state:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUserData();
    }, []);

    const login = (userData) => {
        const currentUser = {
            username: userData.XAuthUserId,
            email: userData.email
        };
        setUser(currentUser);
        
        localStorage.setItem('username', userData.XAuthUserId);
        localStorage.setItem('email', userData.email);
        setXAuthUserId(userData.XAuthUserId);
        
        if (userData.accessToken && userData.refreshToken) {
            localStorage.setItem('accessToken', userData.accessToken);
            localStorage.setItem('refreshToken', userData.refreshToken);
            setTokens(userData.accessToken, userData.refreshToken);
        }
    };

    const logout = async () => {
        try {
            await apiLogoutUser();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setTokens(null, null);
            setXAuthUserId(null);
        }
    };

    const isAuthenticated = () => {
        return !!user && !!getAccessToken();
    };

    const value = { user, loading, login, logout, isAuthenticated, getAccessToken, getRefreshToken };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



export default AuthContext; 