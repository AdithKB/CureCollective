import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Product } from '../types';
import { authService, productService, communityService, orderService } from '../services/api';
import '../styles/Profile.css';
import { MESSAGES } from '../constants';
import { Order } from '../types';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

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

type TabType = 'profile' | 'products' | 'communities' | 'orders';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        address: formData.address,
        country: formData.country,
        pincode: formData.pincode
      });

      if (response.success) {
        setSuccess('Profile updated successfully');
        
        // Refresh user data after successful update
        const profileResponse = await authService.getProfile();
        if (profileResponse.success && profileResponse.user) {
          // Update the user state in the auth context
          if (user) {
            user.name = profileResponse.user.name;
            user.email = profileResponse.user.email;
            user.address = profileResponse.user.address;
            user.country = profileResponse.user.country;
            user.pincode = profileResponse.user.pincode;
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
        setOrders(orders.filter(order => order._id !== orderId));
        setDeleteOrderId(null);
      } else {
        setOrdersError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setOrdersError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setIsDeleting(false);
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
      <main className="container mx-auto px-4 py-8">
        <div className="profile-container">
          <div className="profile-card">
            <div className="header-with-back">
              <button className="back-button" onClick={() => navigate('/')}>
                ← Back to Home
              </button>
              <h2 className="text-2xl font-bold">My Account</h2>
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
                    Orders
                  </button>
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
                      <div className="products-grid">
                        {products.map(product => (
                          <div key={product._id} className="product-card">
                            <div className="product-header">
                              <h4>{product.name}</h4>
                              <button 
                                className="delete-button"
                                onClick={() => handleDeleteProduct(product._id)}
                                disabled={productsLoading}
                                title="Delete Product"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <p className="product-description">{product.description}</p>
                            <div className="product-details">
                              <div className="price-info">
                                <span className="regular-price">₹{product.regularPrice}</span>
                                <span className="bulk-price">₹{product.bulkPrice}</span>
                              </div>
                              <div className="quantity-info">
                                <span>Min. Order: {product.minOrderQuantity} units</span>
                              </div>
                              {product.category && (
                                <div className="category-info">
                                  Category: {product.category}
                                </div>
                              )}
                            </div>
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
                                <button 
                                  onClick={() => handleDeleteCommunity(community._id)}
                                  className="delete-button"
                                  title="Delete Community"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
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
                                {order.items.map((item) => (
                                  <li key={item._id} className="order-item">
                                    <span>{item.product.name} x {item.quantity}</span>
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Order Confirmation Modal */}
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

      <Footer />
    </div>
  );
};

export default Profile; 