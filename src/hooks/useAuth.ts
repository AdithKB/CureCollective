import { useState, useEffect } from 'react';
import { User } from '../types/index';
import { authService } from '../services/api';
import { MESSAGES } from '../constants';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  country: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  token?: string;
  user?: User;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.token && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setUser(response.user);
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || MESSAGES.ERRORS.GENERIC_ERROR
      };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await authService.register(data);
      if (response.success && response.token && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setUser(response.user);
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || MESSAGES.ERRORS.GENERIC_ERROR
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };
}; 