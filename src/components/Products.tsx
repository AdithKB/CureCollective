import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { productService, communityService, orderService, authService } from '../services/api';
import { MESSAGES } from '../constants';
import { User, Product, Community } from '../types/index';
import { formatCurrency, calculateSavings } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

interface PriceRange {
  min: string;
  max: string;
}

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'date-desc' | 'date-asc';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<string[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'buy' | 'cart' | 'community';
    product?: Product;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });
  const [signupError, setSignupError] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'India',
    'Japan',
    'Brazil',
    'Mexico'
  ];

  const checkPasswordStrength = (password: string): string => {
    if (password.length < 8) return 'Weak';
    if (password.length < 12) return 'Medium';
    if (!/[A-Z]/.test(password)) return 'Medium';
    if (!/[0-9]/.test(password)) return 'Medium';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Medium';
    return 'Strong';
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await productService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
        const uniqueCategories = Array.from(new Set(response.data.map((product: Product) => product.category))) as string[];
        setCategories(uniqueCategories);
      } else {
        throw new Error(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadUserCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const response = await communityService.getAll();
      if (response.success && response.data) {
        const userCommunities = response.data.filter((community: Community) => 
          community.members?.some((member: any) => member._id === authUser?._id)
        );
        setUserCommunities(userCommunities);
      } else {
        throw new Error(response.error || 'Failed to fetch communities');
      }
    } catch (error) {
      console.error('Error loading user communities:', error);
      throw error;
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  const initializeData = async () => {
    try {
      setIsInitializing(true);
      setShowContent(false);
      setError(null);
      await Promise.all([
        fetchProducts(),
        loadUserCommunities()
      ]);
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setShowContent(true);
      }, 100);
    } catch (error: any) {
      setError(error.message || 'Failed to initialize data');
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle initial load and authentication
  useEffect(() => {
    initializeData();
  }, [isAuthenticated, authUser]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle location state changes
  useEffect(() => {
    console.log('Location state changed:', location.state);
    if (location.state && (location.state as any).selectedProduct) {
      const selectedProduct = (location.state as any).selectedProduct;
      console.log('Setting search term to product ID:', selectedProduct);
      setSearchTerm(selectedProduct);
      // Clear the location state to prevent re-filtering on navigation
      navigate('/products', { replace: true });
    }
  }, [location.state, navigate]);

  const handleLogout = () => {
    // Clear all local storage data
    localStorage.clear();
    // Call the logout function from auth context
    logout();
    // Use a small timeout to ensure the logout function completes before navigation
    setTimeout(() => {
      // Navigate to homepage
      navigate('/');
    }, 100);
  };

  const handlePriceRangeChange = (value: string) => {
    const [min, max] = value.split('-').map(v => v.replace('$', '').trim());
    setPriceRange({ min, max: max || '' });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleAddToCommunity = async (productId: string) => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'community', product: products.find(p => p._id === productId) });
      setShowLoginModal(true);
      return;
    }

    if (!selectedCommunity) {
      setError('Please select a community');
      return;
    }

    try {
      const response = await communityService.linkProduct(selectedCommunity, productId);
      if (response.success) {
        setError(null);
        setShowCommunityDropdown(false);
        setSelectedCommunity('');
      } else {
        setError(response.error || 'Failed to add product to community');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'cart', product });
      setShowLoginModal(true);
      return;
    }

    setSuccess(null);
    setError(null);
    
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.product._id === product._id);
    
    if (existingItemIndex >= 0) {
      // Product already in cart, increment quantity
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
      setCartItems(updatedCart);
      addToast(`${product.name} quantity updated in cart`, 'success');
    } else {
      // Add new product to cart
      setCartItems([...cartItems, { product, quantity: 1 }]);
      addToast(`${product.name} added to cart`, 'success');
    }
  };

  const handleBuyNow = (product: Product) => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'buy', product });
      setShowLoginModal(true);
      return;
    }
    // Navigate to the place-order page with the product slug
    navigate(`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}/order`);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingAction) {
      switch (pendingAction.type) {
        case 'buy':
          if (pendingAction.product) {
            navigate(`/products/${pendingAction.product.name.toLowerCase().replace(/\s+/g, '-')}/order`);
          }
          break;
        case 'cart':
          if (pendingAction.product) {
            handleAddToCart(pendingAction.product);
          }
          break;
        case 'community':
          if (pendingAction.product) {
            handleAddToCommunity(pendingAction.product._id);
          }
          break;
      }
      setPendingAction(null);
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
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    if (formData.password !== formData.confirmPassword) {
      setSignupError('Passwords do not match');
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
        setShowSignupModal(false);
        addToast('Registration successful! Please log in.', 'success');
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          country: ''
        });
      } else {
        // Display the exact error message from the server
        const errorMessage = response.error || 'Registration failed';
        setSignupError(errorMessage);
        addToast(errorMessage, 'error');
      }
    } catch (err: any) {
      // Handle both error response formats
      const errorMessage = err.response?.data?.error || err.error || 'An error occurred during registration';
      setSignupError(errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  const openLoginModal = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => setShowLoginModal(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setLoginError('Please fill in all fields');
      return;
    }

    try {
      const response = await authService.login(loginData);
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setLoginError('');
        setShowLoginModal(false);
        addToast('Login successful!', 'success');
        // Refresh the page after successful login
        window.location.reload();
      } else {
        setLoginError(response.error || 'Login failed');
      }
    } catch (error: any) {
      setLoginError(error.error || 'An error occurred during login');
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredProducts = products.filter(product => {
    // If no search term, return all products that match category
    if (!searchTerm) {
      return !selectedCategory || product.category === selectedCategory;
    }

    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const searchTermLower = searchTerm.toLowerCase().trim();

    // Check for product ID match first
    if (product.productId) {
      // Check for exact match (case-sensitive)
      if (product.productId === searchTerm) {
        console.log('Found exact product ID match:', product.productId);
        return matchesCategory;
      }
      
      // Check for case-insensitive match
      if (product.productId.toLowerCase() === searchTermLower) {
        console.log('Found case-insensitive product ID match:', product.productId);
        return matchesCategory;
      }
      
      // Check for partial match
      if (product.productId.toLowerCase().includes(searchTermLower)) {
        console.log('Found partial product ID match:', product.productId);
        return matchesCategory;
      }
    }
    
    // Check for name match
    if (product.name.toLowerCase().includes(searchTermLower)) {
      return matchesCategory;
    }
    
    // Check for description match
    if (product.description.toLowerCase().includes(searchTermLower)) {
      return matchesCategory;
    }
    
    // No match found
    return false;
  });

  // Apply price range and sorting to filtered products
  const processedProducts = [...filteredProducts].filter(product => {
    // Apply price range filter
    if (priceRange.min !== '' && product.bulkPrice < Number(priceRange.min)) {
      return false;
    }
    if (priceRange.max !== '' && product.bulkPrice > Number(priceRange.max)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch(sortBy) {
      case 'name':
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'price-asc':
        return sortOrder === 'asc'
          ? a.regularPrice - b.regularPrice
          : b.regularPrice - a.regularPrice;
      case 'price-desc':
        return sortOrder === 'asc'
          ? b.regularPrice - a.regularPrice
          : a.regularPrice - b.regularPrice;
      case 'date-desc':
        return sortOrder === 'asc'
          ? b._id.localeCompare(a._id)
          : a._id.localeCompare(b._id);
      case 'date-asc':
        return sortOrder === 'asc'
          ? a._id.localeCompare(b._id)
          : b._id.localeCompare(a._id);
      default:
        return 0;
    }
  });

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: ''
    });
    setPasswordStrength('');
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <Header user={authUser} onLogout={handleLogout} onLogin={openLoginModal} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
                <div className="h-10 bg-gray-200 rounded w-72"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7fa] to-white text-[#333]">
      <Header user={authUser} onLogout={handleLogout} onLogin={openLoginModal} />
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      
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
                className="w-full px-4 py-2 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors"
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
                    setShowSignupModal(true);
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
                onClick={() => setShowSignupModal(false)}
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
              
              {signupError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-lg mb-4 flex items-center animate-fade-in">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {signupError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors"
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
      
      <main className={`container mx-auto px-4 py-12 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-[#2c3e50]">Products</h1>
              <p className="text-gray-600">Browse and manage your products</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-grow md:flex-grow-0 md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-lg bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => navigate('/add-product')}
                className="px-6 py-3 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors whitespace-nowrap shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-8 shadow-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg mb-8 shadow-sm">
              {success}
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#2c3e50]">Filters</h2>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={`${priceRange.min}-${priceRange.max}`}
                  onChange={(e) => handlePriceRangeChange(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Prices</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="name">Name</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedProducts.map(product => (
              <div key={product._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-[#2c3e50]">{product.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <p className="text-sm text-gray-500 mb-4 font-mono">ID: {product.productId}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatCurrency(product.regularPrice)}
                    </span>
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => navigate('/communities', { state: { selectedProduct: product.name } })}
                        className="w-full px-4 py-2 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Communities
                      </button>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="w-full px-4 py-2 bg-[#2ecc71] text-white rounded-lg hover:bg-[#27ae60] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Buy Now
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full px-4 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {processedProducts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No products found matching your search.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products; 