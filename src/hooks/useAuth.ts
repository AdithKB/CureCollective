import { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { MESSAGES } from '../constants';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  country: string;
}

interface ServerResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await authService.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          // Only clear token if the profile fetch explicitly fails
          if (response.error === 'Invalid token' || response.error === 'Token expired') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // Only clear token on network errors or server errors
        if (err instanceof Error && (
          err.message.includes('Network Error') || 
          err.message.includes('500') ||
          err.message.includes('401')
        )) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login({
        email,
        password
      });
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return true;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('An error occurred during login');
      return false;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return true;
      }
      return false;
    } catch (err) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}; 