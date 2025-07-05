import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

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
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const fetchProfile = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile/');
          setUser(response && response.data ? response.data : response);
        } catch {
          // Try to refresh token if refresh_token exists
          if (refreshToken) {
            const refreshed = await api.refreshToken();
            if (refreshed) {
              try {
                const response = await api.get('/auth/profile/');
                setUser(response && response.data ? response.data : response);
              } catch {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
              }
            } else {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setUser(null);
            }
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else if (refreshToken) {
        // No access token but refresh token exists, try to refresh
        const refreshed = await api.refreshToken();
        if (refreshed) {
          try {
            const response = await api.get('/auth/profile/');
            setUser(response && response.data ? response.data : response);
          } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      // Some backends may not return user, access, refresh on login
      if (response && response.user && response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        setUser(response.user);
        return { success: true };
      } else {
        // If backend returns error in response
        let errorMsg = 'Login failed';
        if (response && response.detail) {
          errorMsg = response.detail;
        }
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      let errorMsg = 'Login failed';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          errorMsg = Object.values(error.response.data).flat().join(' ');
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      
      if (response && response.success !== false) {
        return { success: true, message: 'Registration successful' };
      } else {
        return { success: false, error: response?.error || response?.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg = 'Registration failed';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          errorMsg = Object.values(error.response.data).flat().join(' ');
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken: localStorage.getItem('refresh_token'),
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

