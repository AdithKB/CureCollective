import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Product, Order } from '../types/index';
import { authService, productService, communityService, orderService, walletService } from '../services/api';
import '../styles/Profile.css';
import { MESSAGES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';
import toast from '../utils/toast';
import AlternativePayment from './AlternativePayment';
import WalletPayment from './WalletPayment';

interface Community {
  _id: string;
  name: string;
  description: string;
  healthConditions: string[];
  relatedMedications: (string | { _id: string; name: string })[];
  privacy: string;
  locations: string[];
  memberCount?: number;
  createdAt: string;
}

type TabType = 'profile' | 'products' | 'communities' | 'orders' | 'order-requests' | 'wallet' | 'cart';

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: string;
  reference: string;
  status: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(
    (location.state as any)?.activeTab || 'profile'
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    phone: '',
    address: '',
    country: '',
    pincode: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productOrders, setProductOrders] = useState<Order[]>([]);
  const [productOrdersLoading, setProductOrdersLoading] = useState(true);
  const [productOrdersError, setProductOrdersError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('walletBalance');
    return savedBalance ? parseFloat(savedBalance) : 0;
  });
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(true);
  const [isWithdrawingMoney, setIsWithdrawingMoney] = useState(false);
  const [cartItems, setCartItems] = useState<Array<{
    product: Product;
    quantity: number;
  }>>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];
      const parsedCart = JSON.parse(savedCart);
      // Filter out any invalid cart items during initialization
      return Array.isArray(parsedCart) ? parsedCart.filter((item: any) => 
        item && 
        item.product && 
        item.product._id && 
        item.product.name && 
        typeof item.quantity === 'number'
      ) : [];
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
      localStorage.removeItem('cart'); // Clear invalid cart data
      return [];
    }
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showAlternativePayment, setShowAlternativePayment] = useState(false);
  const [showWalletPayment, setShowWalletPayment] = useState(false);

  // List of countries for the dropdown
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ];

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await orderService.getMyOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      } else {
        setOrdersError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setOrdersError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProductOrders = async () => {
    try {
      setProductOrdersLoading(true);
      const response = await orderService.getMyProductOrders();
      if (response.success) {
        setProductOrders(response.data);
      } else {
        setProductOrdersError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setProductOrdersError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setProductOrdersLoading(false);
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getProfile();
        if (response.success && response.user) {
          // Initialize form data with user data
          const user = response.user;
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            country: user.country || '',
            pincode: user.pincode || ''
          }));
          setLoading(false);
        } else {
          setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
        }
      } catch (err) {
        setError(MESSAGES.ERRORS.GENERIC_ERROR);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
    fetchOrders();
  }, []);

  // Add event listener for order creation
  useEffect(() => {
    const handleOrderCreated = () => {
      fetchOrders();
    };

    window.addEventListener('orderCreated', handleOrderCreated);
    return () => {
      window.removeEventListener('orderCreated', handleOrderCreated);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProducts();
      loadUserCommunities();
    }
  }, [user]);

  useEffect(() => {
    console.log('Profile render - Products:', products);
  }, [products]);

  const loadUserProducts = async () => {
    try {
      setProductsLoading(true);
      console.log('Loading user products...');
      const response = await productService.getMyProducts();
      console.log('Products response:', response);
      if (response.success && response.data) {
        setProducts(response.data);
        console.log('Products loaded:', response.data);
      } else {
        console.error('Failed to load products:', response.error);
        setError('Failed to load products. Please try again.');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadUserCommunities = async () => {
    try {
      setCommunitiesLoading(true);
      console.log('Loading communities for user:', user?._id);
      const response = await communityService.getAll();
      console.log('Raw communities response:', response);
      
      if (response.success && response.data) {
        console.log('All communities:', response.data);
        // Filter communities where the user is the creator
        const userCommunities = response.data.filter((community: any) => {
          console.log('Checking community:', community);
          console.log('Community creator:', community.creator);
          console.log('User ID:', user?._id);
          return community.creator && community.creator._id === user?._id;
        });
        console.log('Filtered user communities:', userCommunities);
        setCommunities(userCommunities);
      } else {
        console.error('Failed to load communities:', response.error);
        setError('Failed to load communities. Please try again.');
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Failed to load communities. Please try again.');
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate mandatory fields
    if (!formData.country) {
      setError('Country is required');
      return;
    }

    if (!formData.pincode) {
      setError('Pincode is required');
      return;
    }

    try {
      const response = await authService.updateProfile({
        name: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        pincode: formData.pincode
      });

      if (response.success) {
        setSuccess('Profile updated successfully');
        
        // Refresh user data after successful update
        const profileResponse = await authService.getProfile();
        if (profileResponse.success && profileResponse.user) {
          // Update the user state in localStorage
          localStorage.setItem('user', JSON.stringify(profileResponse.user));
          
          // Update the user state in the auth context
          if (user) {
            Object.assign(user, profileResponse.user);
          }
          
          // Reset password fields
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          
          // Exit edit mode
          setIsEditing(false);
        }
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating your profile');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await productService.delete(productId);
      if (response.success) {
        setSuccess('Product deleted successfully');
        await loadUserProducts();
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product. Please try again.');
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    if (window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      try {
        const response = await communityService.delete(communityId);
        if (response.success) {
          loadUserCommunities();
          setSuccess('Community deleted successfully');
        } else {
          setError(response.error || 'Failed to delete community');
        }
      } catch (err) {
        console.error('Error deleting community:', err);
        setError('Failed to delete community');
      }
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      navigate('/');
    } catch (err) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsDeleting(true);
      const response = await orderService.deleteOrder(orderId);
      if (response.success) {
        // Find the order to get its total amount
        const deletedOrder = orders.find(order => order._id === orderId);
        if (deletedOrder) {
          // Use walletService to add the refund to the wallet in the database
          const refundResponse = await walletService.addMoney(deletedOrder.total);
          
          if (refundResponse.success) {
            // Update the wallet balance state with the new balance from the server
            setWalletBalance(refundResponse.data.newBalance);
            
            // Show success message with refund amount
            setSuccess(`Order deleted successfully. ₹${deletedOrder.total.toFixed(2)} has been refunded to your wallet.`);
            
            // Update orders list
            setOrders(orders.filter(order => order._id !== orderId));
            setDeleteOrderId(null);
            
            // Force a refresh of the wallet balance if on the wallet tab
            if (activeTab === 'wallet') {
              fetchWalletBalance();
            }
          } else {
            setOrdersError('Failed to process refund. Please contact support.');
          }
        }
      } else {
        setOrdersError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setOrdersError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'order-requests') {
      fetchProductOrders();
    }
  }, [activeTab]);

  const fetchWalletBalance = async () => {
    try {
      const response = await walletService.getBalance();
      if (response && response.balance !== undefined) {
        setWalletBalance(response.balance);
        localStorage.setItem('walletBalance', response.balance.toString());
      } else {
        console.error('Invalid response format from wallet balance API:', response);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      // Fetch current wallet balance from server
      fetchWalletBalance();
    }
  }, [activeTab]);

  const handleAddMoney = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      setWalletError('Please enter a valid amount');
      return;
    }

    setShowWalletPayment(true);
  };

  const handleWalletPaymentComplete = async () => {
    try {
      const amount = parseFloat(addAmount);
      // Remove the duplicate API call since it's already handled in WalletPayment component
      setWalletBalance(prevBalance => prevBalance + amount);
      setAddAmount('');
      toast.success('Money added successfully');
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      setWalletError('Failed to update wallet balance');
    } finally {
      setShowWalletPayment(false);
    }
  };

  const handleWithdrawMoney = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWalletError('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > walletBalance) {
      setWalletError('Insufficient balance');
      return;
    }

    setIsWithdrawingMoney(true);
    setWalletError(null);

    try {
      const amount = parseFloat(withdrawAmount);
      const response = await walletService.withdrawMoney(amount);
      
      if (response.success) {
        // Fetch the latest balance from the server
        await fetchWalletBalance();
        setWithdrawAmount('');
        toast.success('Money withdrawn successfully');
      } else {
        setWalletError(response.message || 'Failed to withdraw money from wallet');
      }
    } catch (error) {
      console.error('Error withdrawing money:', error);
      setWalletError('Failed to withdraw money from wallet');
    } finally {
      setIsWithdrawingMoney(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWalletBalance();
    }
  }, [activeTab]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      // Filter out any invalid items before saving
      const validCartItems = cartItems.filter(item => 
        item && 
        item.product && 
        item.product._id && 
        item.product.name && 
        typeof item.quantity === 'number'
      );
      localStorage.setItem('cart', JSON.stringify(validCartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (!productId || newQuantity < 1) return;
    setCartItems(prev => 
      prev.filter(item => item && item.product && item.product._id).map(item => 
        item.product._id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    if (!productId) return;
    setCartItems(prev => prev.filter(item => 
      item && 
      item.product && 
      item.product._id && 
      item.product._id !== productId
    ));
  };

  const calculateCartTotal = () => {
    return cartItems
      .filter(item => 
        item && 
        item.product && 
        item.product._id && 
        item.product.name && 
        typeof item.quantity === 'number' && 
        typeof item.product.regularPrice === 'number'
      )
      .reduce((total, item) => {
        return total + (item.product.regularPrice * item.quantity);
      }, 0);
  };

  const handleCheckout = async () => {
    try {
      // Check for mandatory user details
      if (!user?.address) {
        setError('Please add your pincode, address and phone no. before placing an order');
        return;
      }
      if (!user?.phone) {
        setError('Please add your pincode, address and phone no. before placing an order');
        return;
      }
      if (!user?.pincode) {
        setError('Please add your pincode, address and phone no. before placing an order');
        return;
      }

      // Get wallet balance from localStorage
      const savedBalance = localStorage.getItem('walletBalance');
      const walletBalance = savedBalance ? parseFloat(savedBalance) : 0;
      const totalAmount = calculateCartTotal();

      // Always show payment options
      setShowAlternativePayment(true);
    } catch (error) {
      setError('An error occurred while processing your order');
    }
  };

  const handleAlternativePaymentComplete = async () => {
    try {
      // Create order items from cart
      const orderItems = cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.regularPrice
      }));

      // Create the order
      const response = await orderService.createDirectOrder(orderItems);

      if (response.success) {
        // Clear the cart
        setCartItems([]);
        localStorage.removeItem('cart');
        
        // Show success message
        setSuccess('Order placed successfully!');
        
        // Navigate to orders tab
        setActiveTab('orders');
        
        // Refresh orders list
        fetchOrders();
      } else {
        setError(response.error || 'Failed to place order');
      }
    } catch (error) {
      setError('An error occurred while processing your order');
    } finally {
      setShowAlternativePayment(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      setError('');
      const response = await authService.deleteAccount();
      
      if (response.success) {
        setSuccess('Account deleted successfully');
        // Clear all local storage
        localStorage.clear();
        // Logout and redirect to home
        logout();
        navigate('/');
      } else {
        setError(response.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('An error occurred while deleting your account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="profile-container">
          <div className="profile-card">
            <div className="header-with-back">
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="profile-content">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-avatar">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h3 className="text-xl font-bold">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs-wrapper">
                <div className="tabs-container">
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      Profile
                    </button>
                    <button 
                      className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                      onClick={() => setActiveTab('products')}
                    >
                      Products
                    </button>
                    <button 
                      className={`tab ${activeTab === 'communities' ? 'active' : ''}`}
                      onClick={() => setActiveTab('communities')}
                    >
                      Communities
                    </button>
                    <button 
                      className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
                      onClick={() => setActiveTab('orders')}
                    >
                      My Orders
                    </button>
                    <button 
                      className={`tab ${activeTab === 'order-requests' ? 'active' : ''}`}
                      onClick={() => setActiveTab('order-requests')}
                    >
                      Order Requests
                    </button>
                    <button 
                      className={`tab ${activeTab === 'wallet' ? 'active' : ''}`}
                      onClick={() => setActiveTab('wallet')}
                    >
                      Wallet
                    </button>
                    <button 
                      className={`tab ${activeTab === 'cart' ? 'active' : ''}`}
                      onClick={() => setActiveTab('cart')}
                    >
                      Cart
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="profile-tab">
                    <form onSubmit={handleSubmit} className="profile-form">
                      <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="form-input"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          disabled={!isEditing}
                          className="form-input"
                          rows={3}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="country">Country <span className="text-red-500">*</span></label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="form-input"
                        >
                          <option value="">Select a country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="pincode">Pincode <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="form-input"
                        />
                      </div>

                      {isEditing && (
                        <>
                          <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                              type="password"
                              id="currentPassword"
                              name="currentPassword"
                              value={formData.currentPassword}
                              onChange={handleChange}
                              placeholder="Enter current password to change"
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                              type="password"
                              id="newPassword"
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleChange}
                              placeholder="Enter new password"
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="Confirm new password"
                              className="form-input"
                            />
                          </div>
                        </>
                      )}

                      <div className="form-actions">
                        {!isEditing ? (
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => setIsEditing(true)}
                          >
                            Edit Profile
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="cancel-button"
                              onClick={() => {
                                setIsEditing(false);
                                setFormData(prev => ({
                                  ...prev,
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmPassword: ''
                                }));
                              }}
                            >
                              Cancel
                            </button>
                            <button type="submit" className="save-button">
                              Save Changes
                            </button>
                          </>
                        )}
                      </div>
                    </form>

                    {/* Delete Account Section */}
                    <div className="delete-account-section">
                      <h3 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h3>
                      <p className="text-gray-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                        All your data including profile information, orders, and community memberships will be permanently deleted.
                      </p>
                      <button
                        type="button"
                        className="delete-account-button"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                      >
                        {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div className="products-tab">
                    <div className="section-header">
                      <h3>My Products</h3>
                      <button 
                        className="add-product-button"
                        onClick={() => navigate('/add-product')}
                      >
                        Add Product
                      </button>
                    </div>
                    {productsLoading ? (
                      <div className="loading">Loading products...</div>
                    ) : products.length > 0 ? (
                      <div className="products-list">
                        {products.map(product => (
                          <div 
                            key={product._id} 
                            className="product-card"
                            onClick={() => {
                              console.log('Navigating to products with ID:', product.productId);
                              navigate('/products', { 
                                state: { selectedProduct: product.productId || '' }
                              });
                            }}
                          >
                            <div className="product-info">
                              <h4>{product.name}</h4>
                              <p className="product-id">ID: <span className="font-mono">{product.productId}</span></p>
                              <p>{product.description}</p>
                              <div className="product-price">
                                <span className="regular-price">₹{product.regularPrice}</span>
                                <span className="bulk-price">₹{product.bulkPrice}</span>
                                <span className="min-order">Min: {product.minOrderQuantity}</span>
                              </div>
                            </div>
                            <button 
                              className="delete-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product._id);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-products">
                        <p>You haven't added any products yet.</p>
                        <button 
                          className="add-first-product-button"
                          onClick={() => navigate('/add-product')}
                        >
                          Add Your First Product
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Communities Tab */}
                {activeTab === 'communities' && (
                  <div className="communities-tab">
                    <div className="section-header">
                      <h3>My Communities</h3>
                      <button 
                        className="add-product-button"
                        onClick={() => navigate('/create-community')}
                      >
                        Create Community
                      </button>
                    </div>
                    {communitiesLoading ? (
                      <div className="loading">Loading communities...</div>
                    ) : communities.length > 0 ? (
                      <div className="communities-list">
                        {communities.map(community => (
                          <div key={community._id} className="community-card">
                            <div className="community-header">
                              <h4>{community.name}</h4>
                              <div className="community-actions">
                                <button 
                                  onClick={() => navigate(`/communities/${community.name.toLowerCase().replace(/\s+/g, '-')}`)}
                                  className="view-button"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                            <p>{community.description}</p>
                            <div className="community-details">
                              <div className="community-tags">
                                <h5>Health Conditions:</h5>
                                <div className="tags">
                                  {community.healthConditions && community.healthConditions.length > 0 ? (
                                    community.healthConditions.map((condition, index) => (
                                      <span key={index} className="tag">{condition}</span>
                                    ))
                                  ) : (
                                    <span className="no-tags">No conditions specified</span>
                                  )}
                                </div>
                              </div>
                              <div className="community-tags">
                                <h5>Medicines:</h5>
                                <div className="tags">
                                  {community.relatedMedications && community.relatedMedications.length > 0 ? (
                                    community.relatedMedications.map((medicine) => {
                                      const medicineName = typeof medicine === 'string' ? medicine : medicine.name;
                                      const medicineId = typeof medicine === 'string' ? medicine : medicine._id;
                                      return (
                                        <span key={medicineId} className="tag">
                                          {medicineName}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="no-tags">
                                      <i className="fas fa-pills"></i> No medications added yet
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="community-tags">
                                <h5>Locations:</h5>
                                <div className="tags">
                                  {community.locations && community.locations.length > 0 ? (
                                    community.locations.map((location, index) => (
                                      <span key={index} className="tag">{location}</span>
                                    ))
                                  ) : (
                                    <span className="no-tags">No locations specified</span>
                                  )}
                                </div>
                              </div>
                              <span className="privacy-badge">{community.privacy}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-products">
                        <p>You haven't created any communities yet.</p>
                        <button 
                          className="add-first-product-button"
                          onClick={() => navigate('/create-community')}
                        >
                          Create Your First Community
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="orders-tab">
                    <h3 className="text-xl font-bold mb-4">My Orders</h3>
                    {ordersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading orders...</p>
                      </div>
                    ) : ordersError ? (
                      <div className="text-red-500 p-4 bg-red-50 rounded-lg">{ordersError}</div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">No orders found</p>
                        <p className="mt-2">When you place an order, it will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order._id} className="order-card">
                            <div className="order-header">
                              <div>
                                <h3 className="font-semibold text-lg">Order #{order.orderId}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                {order.user ? (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      {order.user.name}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm text-gray-600">
                                        {order.user.email}
                                      </p>
                                      {order.user.phone && (
                                        <p className="text-sm text-gray-600">
                                          Phone: {order.user.phone}
                                        </p>
                                      )}
                                      {order.user.address && (
                                        <p className="text-sm text-gray-600">
                                          Address: {order.user.address}
                                        </p>
                                      )}
                                      {order.user.country && (
                                        <p className="text-sm text-gray-600">
                                          Country: {order.user.country}
                                        </p>
                                      )}
                                      {order.user.pincode && (
                                        <p className="text-sm text-gray-600">
                                          Pincode: {order.user.pincode}
                                        </p>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-600">Customer information not available</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">₹{order.total.toFixed(2)}</p>
                                <p className={`text-sm font-medium ${
                                  order.status === 'completed' ? 'text-green-500' : 
                                  order.status === 'pending' ? 'text-yellow-500' : 
                                  'text-red-500'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </p>
                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => setDeleteOrderId(order._id)}
                                    className="mt-2 text-red-500 hover:text-red-700 flex items-center justify-end"
                                    title="Delete Order"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="order-items">
                              <h4 className="font-medium mb-2">Items:</h4>
                              <ul className="space-y-2">
                                {order.items.map((item: { _id: string; product: Product; quantity: number; price: number }) => (
                                  <li key={item._id} className="order-item">
                                    <span>{item.product?.name || 'Product not available'} x {item.quantity}</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Requests Tab */}
                {activeTab === 'order-requests' && (
                  <div className="orders-tab">
                    <h3 className="text-xl font-bold mb-4">Order Requests</h3>
                    {productOrdersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading order requests...</p>
                      </div>
                    ) : productOrdersError ? (
                      <div className="text-red-500 p-4 bg-red-50 rounded-lg">{productOrdersError}</div>
                    ) : productOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">No order requests found</p>
                        <p className="mt-2">When users place orders on your products, they will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productOrders.map((order) => (
                          <div key={order._id} className="order-card">
                            <div className="order-header">
                              <div>
                                <h3 className="font-semibold text-lg">Order #{order.orderId}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                {order.user ? (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      {order.user.name}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm text-gray-600">
                                        {order.user.email}
                                      </p>
                                      {order.user.phone && (
                                        <p className="text-sm text-gray-600">
                                          Phone: {order.user.phone}
                                        </p>
                                      )}
                                      {order.user.address && (
                                        <p className="text-sm text-gray-600">
                                          Address: {order.user.address}
                                        </p>
                                      )}
                                      {order.user.country && (
                                        <p className="text-sm text-gray-600">
                                          Country: {order.user.country}
                                        </p>
                                      )}
                                      {order.user.pincode && (
                                        <p className="text-sm text-gray-600">
                                          Pincode: {order.user.pincode}
                                        </p>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-600">Customer information not available</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">₹{order.items
                                  .filter(item => products.some(product => product._id === item.product._id))
                                  .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                                  .toFixed(2)}</p>
                                <p className={`text-sm font-medium ${
                                  order.status === 'completed' ? 'text-green-500' : 
                                  order.status === 'pending' ? 'text-yellow-500' : 
                                  'text-red-500'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="order-items">
                              <h4 className="font-medium mb-2">Items:</h4>
                              <ul className="space-y-2">
                                {order.items
                                  .filter(item => products.some(product => product._id === item.product._id))
                                  .map((item: { _id: string; product: Product; quantity: number; price: number }) => (
                                    <li key={item._id} className="order-item">
                                      <span>{item.product?.name || 'Product not available'} x {item.quantity}</span>
                                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Wallet Tab */}
                {activeTab === 'wallet' && (
                  <div className="wallet-tab">
                    <div className="wallet-container">
                      <div className="wallet-balance">
                        <h3>Current Balance</h3>
                        <div className="balance-amount">₹{walletBalance.toFixed(2)}</div>
                      </div>

                      <div className="wallet-actions">
                        <div className="wallet-action-section">
                          <h4 data-icon="💰">Wallet Actions</h4>
                          <div className="action-toggle">
                            <button 
                              className={`toggle-button ${isAddingMoney ? 'active' : ''}`}
                              onClick={() => setIsAddingMoney(true)}
                            >
                              Add Money
                            </button>
                            <button 
                              className={`toggle-button ${!isAddingMoney ? 'active' : ''}`}
                              onClick={() => setIsAddingMoney(false)}
                            >
                              Withdraw Money
                            </button>
                          </div>
                          <div className="amount-input">
                            <input
                              type="number"
                              placeholder={`Enter amount to ${isAddingMoney ? 'add' : 'withdraw'}`}
                              value={isAddingMoney ? addAmount : withdrawAmount}
                              onChange={(e) => {
                                if (isAddingMoney) {
                                  setAddAmount(e.target.value);
                                } else {
                                  setWithdrawAmount(e.target.value);
                                }
                              }}
                              min="0"
                              step="0.01"
                            />
                            <button
                              className={isAddingMoney ? 'add-money-button' : 'withdraw-money-button'}
                              onClick={isAddingMoney ? handleAddMoney : handleWithdrawMoney}
                              disabled={isAddingMoney ? !addAmount || parseFloat(addAmount) <= 0 : !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletBalance}
                            >
                              {isAddingMoney ? 'Add Money' : 'Withdraw Money'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="wallet-info">
                        <h4>Wallet Information</h4>
                        <ul>
                          <li>Maximum wallet balance: ₹50,000</li>
                          <li>Transactions are instant</li>
                          <li>24/7 customer support available</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Tab */}
                {activeTab === 'cart' && (
                  <div className="cart-tab">
                    <div className="section-header">
                      <h3>Shopping Cart</h3>
                      {cartItems.length > 0 && (
                        <button 
                          className="checkout-button"
                          onClick={handleCheckout}
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                    {cartItems.length === 0 ? (
                      <div className="empty-cart">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg text-gray-500">Your cart is empty</p>
                        <button 
                          className="browse-products-button"
                          onClick={() => navigate('/products')}
                        >
                          Browse Products
                        </button>
                      </div>
                    ) : (
                      <div className="cart-items">
                        {cartItems.filter(item => item && item.product).map(item => (
                          <div key={item.product._id} className="cart-item">
                            <div className="cart-item-info">
                              <h4>{item.product.name}</h4>
                              <p className="product-id">ID: <span className="font-mono">{item.product.productId}</span></p>
                              <div className="price-quantity">
                                <span className="price">₹{item.product.regularPrice}</span>
                                <div className="quantity-controls">
                                  <button 
                                    onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                                    className="quantity-button"
                                  >
                                    -
                                  </button>
                                  <span className="quantity">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                                    className="quantity-button"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveFromCart(item.product._id)}
                              className="remove-button"
                              title="Remove from cart"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <div className="cart-summary">
                          <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>₹{calculateCartTotal().toFixed(2)}</span>
                          </div>
                          <div className="summary-row">
                            <span>Shipping:</span>
                            <span>Free</span>
                          </div>
                          <div className="summary-row total">
                            <span>Total:</span>
                            <span>₹{calculateCartTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {deleteOrderId && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Delete Order</h3>
              <p className="modal-text">
                Are you sure you want to delete this order? This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  onClick={() => setDeleteOrderId(null)}
                  className="modal-cancel-button"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteOrder(deleteOrderId)}
                  className="modal-delete-button"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAlternativePayment && (
          <AlternativePayment
            totalAmount={calculateCartTotal()}
            onPaymentComplete={handleAlternativePaymentComplete}
            onCancel={() => setShowAlternativePayment(false)}
          />
        )}

        {showWalletPayment && (
          <WalletPayment
            amount={parseFloat(addAmount)}
            onPaymentComplete={handleWalletPaymentComplete}
            onCancel={() => setShowWalletPayment(false)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile; 