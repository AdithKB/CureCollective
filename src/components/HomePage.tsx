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
    confirmPassword: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState('');

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
        password: formData.password
      });

      if (response.success) {
        setSuccess('Registration successful! Please login.');
        setShowSignupModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
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
    <div className="min-h-screen bg-[#f5f7fa] text-[#333]">
      {/* Global Error and Success Messages */}
      <div className="fixed top-4 right-4 z-[1000]">
        {error && (
          <div data-testid="error-message" className="p-4 bg-red-100 border border-red-400 text-red-700 rounded shadow-lg mb-2">
            {error}
          </div>
        )}
        {success && (
          <div data-testid="success-message" className="p-4 bg-green-100 border border-green-400 text-green-700 rounded shadow-lg">
            {success}
          </div>
        )}
      </div>

      <Header user={user} onLogout={handleLogout} />

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 data-testid="page-title" className="text-4xl font-bold mb-4 text-[#333]">
            Join the CureCollective Community
          </h1>
          <p className="text-xl mb-8 text-[#666] max-w-2xl mx-auto">
            Your platform for affordable healthcare through community purchasing power.
          </p>
          <div className="flex justify-center space-x-4">
            {!user ? (
              <>
                <button
                  onClick={openLoginModal}
                  data-testid="login-button"
                  className="px-8 py-3 bg-white text-[#4a6fa5] border border-[#4a6fa5] rounded-lg hover:bg-[#f5f7fa] transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={openSignupModal}
                  data-testid="signup-button"
                  className="px-8 py-3 bg-white text-[#4a6fa5] border border-[#4a6fa5] rounded-lg hover:bg-[#f5f7fa] transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/add-product"
                  className="px-8 py-3 bg-white text-[#4a6fa5] border border-[#4a6fa5] rounded-lg hover:bg-[#f5f7fa] transition-colors"
                >
                  Add Product
                </Link>
                <Link
                  to="/create-community"
                  className="px-8 py-3 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors"
                >
                  Create Community
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center mb-12 text-[#333]">Why Choose MedCare?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#f9f9f9] rounded-lg p-8 text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-4xl mb-5 text-[#4a6fa5]">💰</div>
              <h3 className="text-xl mb-4 text-[#333]">Save Money</h3>
              <p className="text-[#666]">Access wholesale prices through bulk ordering. Save up to 40% on essential medications.</p>
            </div>
            <div className="bg-[#f9f9f9] rounded-lg p-8 text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-4xl mb-5 text-[#4a6fa5]">🔄</div>
              <h3 className="text-xl mb-4 text-[#333]">Direct Connection</h3>
              <p className="text-[#666]">Skip the middlemen and connect directly with pharmacists and manufacturers.</p>
            </div>
            <div className="bg-[#f9f9f9] rounded-lg p-8 text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-4xl mb-5 text-[#4a6fa5]">👥</div>
              <h3 className="text-xl mb-4 text-[#333]">Community Power</h3>
              <p className="text-[#666]">Join with others to increase order volume and unlock bulk discounts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#f5f7fa]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center mb-12 text-[#333]">How It Works</h2>
          <div className="flex flex-wrap justify-between">
            <div className="flex-1 min-w-[250px] m-4 text-center">
              <div className="w-12 h-12 bg-[#4a6fa5] text-white rounded-full flex justify-center items-center mx-auto mb-5 text-xl font-bold">1</div>
              <h3 className="mb-3 text-[#333]">Create an Account</h3>
              <p className="text-[#666]">Sign up as a patient, pharmacist, or manufacturer.</p>
            </div>
            <div className="flex-1 min-w-[250px] m-4 text-center">
              <div className="w-12 h-12 bg-[#4a6fa5] text-white rounded-full flex justify-center items-center mx-auto mb-5 text-xl font-bold">2</div>
              <h3 className="mb-3 text-[#333]">Browse Medications</h3>
              <p className="text-[#666]">Search for medications you need or list products you offer.</p>
            </div>
            <div className="flex-1 min-w-[250px] m-4 text-center">
              <div className="w-12 h-12 bg-[#4a6fa5] text-white rounded-full flex justify-center items-center mx-auto mb-5 text-xl font-bold">3</div>
              <h3 className="mb-3 text-[#333]">Place Bulk Orders</h3>
              <p className="text-[#666]">Join existing group orders or start your own bulk purchase.</p>
            </div>
            <div className="flex-1 min-w-[250px] m-4 text-center">
              <div className="w-12 h-12 bg-[#4a6fa5] text-white rounded-full flex justify-center items-center mx-auto mb-5 text-xl font-bold">4</div>
              <h3 className="mb-3 text-[#333]">Save Money</h3>
              <p className="text-[#666]">Benefit from wholesale pricing and reduced costs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[900]">
          <div className="bg-white p-8 rounded-lg max-w-md w-full relative">
            <button 
              onClick={closeLoginModal}
              data-testid="close-modal-button"
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
            <h2 className="text-2xl text-center mb-6 text-[#333]">Login to Your Account</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <label htmlFor="loginEmail" className="block mb-2 font-medium text-[#555]">Email Address</label>
                <input 
                  type="email" 
                  id="loginEmail" 
                  name="loginEmail"
                  data-testid="email-input"
                  value={loginData.email}
                  onChange={(e) => handleLoginInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required 
                />
              </div>
              <div className="mb-5">
                <label htmlFor="loginPassword" className="block mb-2 font-medium text-[#555]">Password</label>
                <input
                  type="password"
                  id="loginPassword"
                  data-testid="password-input"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={loginData.password}
                  onChange={(e) => handleLoginInputChange('password', e.target.value)}
                  required
                />
              </div>
              <div className="mb-5">
                <button
                  type="button"
                  data-testid="forgot-password-link"
                  className="text-sm text-blue-500 hover:text-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    closeLoginModal();
                    // Handle forgot password
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex justify-between">
                <button 
                  type="button" 
                  onClick={closeLoginModal}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  data-testid="submit-button"
                  className="px-5 py-2 bg-[#4a6fa5] text-white rounded hover:bg-[#3a5a80] transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[900]">
          <div className="bg-white p-8 rounded-lg max-w-md w-full relative">
            <button 
              onClick={closeSignupModal}
              data-testid="close-modal-button"
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
            <h2 className="text-2xl text-center mb-6 text-[#333]">Create Your Account</h2>
            <form onSubmit={handleSignup}>
              <div className="mb-5">
                <label htmlFor="name" className="block mb-2 font-medium text-[#555]">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required 
                />
              </div>
              <div className="mb-5">
                <label htmlFor="email" className="block mb-2 font-medium text-[#555]">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required 
                />
              </div>
              <div className="mb-5">
                <label htmlFor="password" className="block mb-2 font-medium text-[#555]">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  data-testid="password-input"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required 
                />
                {passwordStrength && (
                  <div data-testid="password-strength-indicator" className="mt-1 text-sm">
                    {passwordStrength}
                  </div>
                )}
              </div>
              <div className="mb-5">
                <label htmlFor="confirmPassword" className="block mb-2 font-medium text-[#555]">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  data-testid="confirm-password-input"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required 
                />
              </div>
              <div className="flex justify-between">
                <button 
                  type="button" 
                  onClick={closeSignupModal}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  data-testid="submit-button"
                  className="px-5 py-2 bg-[#4a6fa5] text-white rounded hover:bg-[#3a5a80] transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HomePage; 