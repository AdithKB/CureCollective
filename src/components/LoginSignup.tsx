import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '../contexts/AuthModalContext';
import { toast } from 'react-hot-toast';

// List of countries for the dropdown
const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'South Korea',
  'Singapore'
];

const LoginSignup: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { isModalOpen, closeModal, isLogin, openModal } = useAuthModal();
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
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Medium' | 'Strong' | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, closeModal]);

  // Add click handler for the backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await login(loginData.email, loginData.password);
      if (response.success) {
        toast.success('Login successful!');
        closeModal();
        // Refresh the page after successful login
        window.location.reload();
      } else {
        setLoginError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setLoginError(err.message || 'An error occurred');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordStrength === 'Weak') {
      setSignupError('Please choose a stronger password');
      return;
    }

    try {
      console.log('Attempting registration with data:', {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        passwordLength: formData.password.length
      });

      const response = await register(formData);
      console.log('Registration response:', response);

      if (response.success) {
        toast.success('Registration successful!');
        closeModal();
        // Refresh the page after successful registration
        window.location.reload();
      } else {
        // Log the full error response
        console.error('Registration failed:', response);
        setSignupError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      // Log the full error object
      console.error('Registration error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setSignupError(err.error || 'Failed to connect to the server. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkPasswordStrength = (password: string): 'Weak' | 'Medium' | 'Strong' => {
    if (password.length < 8) return 'Weak';
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (hasLetter && hasNumber && hasSpecial) return 'Strong';
    if ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial)) return 'Medium';
    return 'Weak';
  };

  if (!isModalOpen) return null;

  return (
    <>
      {/* Login Modal */}
      {isLogin && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <button 
                onClick={closeModal}
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
              
              {loginError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-lg mb-4 flex items-center animate-fade-in">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {loginError}
                </div>
              )}
              
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
                  onClick={() => openModal(false)}
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
      {!isLogin && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 my-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-900">Create Account</h2>
              <button 
                onClick={closeModal}
                className="text-gray-700 hover:text-gray-900 focus:outline-none transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-600">Join our community to access affordable healthcare products.</p>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-3">
              {signupError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm text-sm">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Registration Error</p>
                      <p className="mt-1">{signupError}</p>
                      {signupError.includes('already exists')}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-gray-700 mb-0.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="signup-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="signup-country" className="block text-xs font-medium text-gray-700 mb-0.5">Country</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <select
                    id="signup-country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent appearance-none bg-white text-sm"
                    required
                  >
                    <option value="">Select your country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter email or phone number"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  You can use either your email address or phone number to sign up
                </p>
              </div>
              
              <div>
                <label htmlFor="signup-password" className="block text-xs font-medium text-gray-700 mb-0.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="signup-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent text-sm"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                
                {passwordStrength && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'Weak' ? 'text-red-500' : 
                        passwordStrength === 'Medium' ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength === 'Weak' ? 'bg-red-500 w-1/3' : 
                          passwordStrength === 'Medium' ? 'bg-yellow-500 w-2/3' : 
                          'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {passwordStrength === 'Weak' && 'Use at least 8 characters with a mix of letters, numbers & symbols'}
                      {passwordStrength === 'Medium' && 'Good, but could be stronger with more variety'}
                      {passwordStrength === 'Strong' && 'Excellent! Your password is secure'}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-gray-700 mb-0.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="signup-confirm-password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent text-sm"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full py-1.5 text-sm font-medium mt-2"
              >
                Create Account
              </button>
            </form>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => openModal(true)}
                  className="text-[#4a6fa5] hover:text-[#3a5a8c] font-medium bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                >
                  Log In
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginSignup; 