import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserMenu from './UserMenu';
import { User, AuthResponse } from '../types';
import { authService } from '../services/api';
import Header from './Header';
import Footer from './Footer';

interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const countries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'India',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Japan',
    'China',
    'Brazil',
    'Mexico',
    'South Africa',
    'Nigeria'
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const openLoginModal = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };
  
  const closeLoginModal = () => setShowLoginModal(false);
  const openSignupModal = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };
  const closeSignupModal = () => setShowSignupModal(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await authService.login({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setSuccess('Login successful!');
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setTimeout(() => {
          setShowLoginModal(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(response.error || 'Login failed');
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid email or password';
      setError(errorMessage);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        country: formData.country
      });

      if (response.success) {
        setSuccess('Registration successful! Please login.');
        setShowSignupModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          country: ''
        });
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
      if (strength === 'Weak') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError('');
      }
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) return 'Weak';
    if (password.length < 12) return 'Medium';
    if (!/[A-Z]/.test(password)) return 'Medium';
    if (!/[0-9]/.test(password)) return 'Medium';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 text-gray-800 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a6fa5' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Global Error and Success Messages */}
      <div className="fixed top-4 right-4 z-[1000]">
        {error && (
          <div 
            data-testid="error-message" 
            className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-lg mb-2 flex items-center animate-fade-in"
          >
            <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div 
            data-testid="success-message" 
            className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-lg flex items-center animate-fade-in"
          >
            <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}
      </div>

      <Header user={user} onLogout={handleLogout} onLogin={openLoginModal} />

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 opacity-70"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234a6fa5' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          opacity: 0.3
        }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              data-testid="page-title" 
              className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight"
            >
              Join the <span className="text-[#4a6fa5]">Cure</span><span className="text-black">Collective</span> Community
            </h1>
            <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your platform for affordable healthcare through community purchasing power.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {!user ? (
                <>
                  <button
                    onClick={openLoginModal}
                    data-testid="login-button"
                    className="btn btn-primary px-8 py-3 text-lg font-medium"
                  >
                    Log In
                  </button>
                  <button
                    onClick={openSignupModal}
                    data-testid="signup-button"
                    className="btn btn-secondary px-8 py-3 text-lg font-medium"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    to="/products"
                    className="btn btn-primary px-8 py-3 text-lg font-medium"
                  >
                    Browse Products
                  </Link>
                  <Link
                    to="/communities"
                    className="btn btn-primary px-8 py-3 text-lg font-medium"
                  >
                    Browse Communities
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-[#4a6fa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Join a Community</h3>
              <p className="text-gray-600">Connect with others who share your health needs and interests.</p>
            </div>
            <div className="card text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-[#4a6fa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Browse Products</h3>
              <p className="text-gray-600">Discover healthcare products at community-discounted prices.</p>
            </div>
            <div className="card text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-[#4a6fa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Save Money</h3>
              <p className="text-gray-600">Benefit from bulk purchasing discounts and special offers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">About CureCollective</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  CureCollective is a community-driven healthcare platform that connects individuals with similar health needs to access affordable medications and healthcare products through the power of collective purchasing.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Our mission is to make healthcare more accessible and affordable for everyone by leveraging the buying power of communities. By joining together, members can access significant discounts on medications and healthcare products that would otherwise be prohibitively expensive.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Founded in 2023, CureCollective has grown to serve thousands of members across multiple communities, helping them save on essential healthcare products while connecting with others who share similar health journeys.
                </p>
                <div className="pt-4">
                  <Link
                    to="/about"
                    className="inline-flex items-center text-[#4a6fa5] font-medium hover:text-[#3a5a8c] transition-colors"
                  >
                    Learn more about our story
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#4a6fa5]/20 to-[#3a5a8c]/20 rounded-lg transform rotate-3"></div>
                <div className="bg-white p-6 rounded-lg shadow-lg relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-[#4a6fa5] mb-1">10K+</div>
                      <div className="text-sm text-gray-600">Active Members</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-[#4a6fa5] mb-1">50+</div>
                      <div className="text-sm text-gray-600">Communities</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-[#4a6fa5] mb-1">$2M+</div>
                      <div className="text-sm text-gray-600">Saved by Members</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-[#4a6fa5] mb-1">1000+</div>
                      <div className="text-sm text-gray-600">Products Available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <button 
                onClick={closeLoginModal}
                className="text-gray-700 hover:text-gray-900 focus:outline-none transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">Log in to access your account and manage your healthcare purchases.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email or Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="login-email"
                    value={loginData.email}
                    onChange={(e) => handleLoginInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                    placeholder="Enter your email or phone number"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  You can use either your email address or phone number to log in
                </p>
              </div>
              
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="login-password"
                    value={loginData.password}
                    onChange={(e) => handleLoginInputChange('password', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#4a6fa5] focus:ring-[#4a6fa5] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="text-[#4a6fa5] hover:text-[#3a5a8c] font-medium">
                    Forgot password?
                  </a>
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full py-3 text-lg font-medium mt-6"
              >
                Log In
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    closeLoginModal();
                    openSignupModal();
                  }}
                  className="text-[#4a6fa5] hover:text-[#3a5a8c] font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <button 
                onClick={closeSignupModal}
                className="text-gray-700 hover:text-gray-900 focus:outline-none transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">Join our community to access affordable healthcare products and connect with others.</p>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="signup-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="signup-country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <select
                    id="signup-country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent appearance-none bg-white"
                    required
                  >
                    <option value="">Select your country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter email or phone number"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  You can use either your email address or phone number to sign up
                </p>
              </div>
              
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="signup-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'Weak' ? 'text-red-500' : 
                        passwordStrength === 'Medium' ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength === 'Weak' ? 'bg-red-500 w-1/3' : 
                          passwordStrength === 'Medium' ? 'bg-yellow-500 w-2/3' : 
                          'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {passwordStrength === 'Weak' && 'Use at least 8 characters with a mix of letters, numbers & symbols'}
                      {passwordStrength === 'Medium' && 'Good, but could be stronger with more variety'}
                      {passwordStrength === 'Strong' && 'Excellent! Your password is secure'}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="signup-confirm-password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full py-3 text-lg font-medium mt-6"
              >
                Create Account
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    closeSignupModal();
                    openLoginModal();
                  }}
                  className="text-[#4a6fa5] hover:text-[#3a5a8c] font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                >
                  Log In
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HomePage; 