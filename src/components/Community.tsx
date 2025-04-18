import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communityService, authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/Community.css';
import { productService } from '../services/api';
import { Community as CommunityType, Product } from '../types/index';
import Header from './Header';
import Footer from './Footer';

const Community: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPost, setNewPost] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    guidelines: string;
    privacy: 'public' | 'private';
    relatedMedications: string[];
    locations: string[];
    communityId: string;
  }>({
    name: '',
    description: '',
    guidelines: '',
    privacy: 'public',
    relatedMedications: [],
    locations: [],
    communityId: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [availableLocations] = useState([
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'chennai', label: 'Chennai' }
  ]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
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
    if (slug) {
      loadCommunity();
      loadProducts();
    }
  }, [slug, user]);

  // Check if user is a member and get join request status
  useEffect(() => {
    const checkMembership = async () => {
      if (!community || !community._id) return;
      
      try {
        // Only check membership and join requests if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          setIsMember(false);
          setHasPendingRequest(false);
          return;
        }

        // Check membership status
        const membershipRes = await communityService.checkMembership(community._id);
        if (membershipRes.success) {
          setIsMember(membershipRes.isMember);
        }

        // Only check join request if user is not a member
        if (!membershipRes.success || !membershipRes.isMember) {
          try {
            const joinRequestRes = await communityService.getUserJoinRequest(community._id);
            if (joinRequestRes.success) {
              setHasPendingRequest(joinRequestRes.data.status === 'pending');
            }
          } catch (error) {
            // If join request check fails, just set hasPendingRequest to false
            setHasPendingRequest(false);
          }
        } else {
          setHasPendingRequest(false);
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setIsMember(false);
        setHasPendingRequest(false);
      }
    };

    checkMembership();
  }, [community]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getBySlug(slug!);
      
      if (response.success && response.data) {
        const communityData = response.data;
        setCommunity(communityData);
        
        // Only check creator status if user is authenticated
        if (user) {
          // Check if current user is the creator
          const isUserCreator = communityData.creator._id === user._id;
          setIsCreator(isUserCreator);
        }
      } else {
        setError('Community not found');
      }
    } catch (err) {
      console.error('Error loading community:', err);
      setError('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setEditForm(prev => ({
      ...prev,
      [name]: selectedValues
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure relatedMedications are strings (product IDs)
      const formData = {
        ...editForm,
        communityId: community!.communityId,
        relatedMedications: editForm.relatedMedications.map((med: string | { _id: string; name: string }) => {
          if (typeof med === 'string') {
            return med;
          }
          return med._id;
        }),
        locations: editForm.locations
      };
      
      const response = await communityService.update(community!._id, formData);
      if (response.success) {
        // Map the product IDs to their names using the products state
        const updatedRelatedMedications = formData.relatedMedications.map((medId: string) => {
          const product = products.find(p => p._id === medId);
          return product ? { _id: medId, name: product.name } : medId;
        });

        // Update the community state with the new data
        setCommunity(prev => ({
          ...prev!,
          name: formData.name,
          description: formData.description,
          guidelines: formData.guidelines,
          privacy: formData.privacy,
          relatedMedications: updatedRelatedMedications,
          locations: formData.locations,
          communityId: formData.communityId
        }));

        setIsEditing(false);
        setSuccess('Community updated successfully');
        setError('');
      } else {
        setError(response.error || 'Failed to update community');
      }
    } catch (error) {
      console.error('Error updating community:', error);
      setError('Failed to update community');
    }
  };

  const handleJoinCommunity = async () => {
    try {
      if (hasPendingRequest) {
        setError('You already have a pending join request for this community');
        return;
      }

      const response = await communityService.join(community!._id);
      if (response.success) {
        if (community!.privacy === 'private') {
          setHasPendingRequest(true);
          setSuccess('Join request sent successfully!');
        } else {
          setIsMember(true);
          setSuccess('Successfully joined the community!');
        }
        await loadCommunity();
      } else {
        setError(response.message || response.error || 'Failed to join community');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join community');
    }
  };

  const handleCancelJoinRequest = async () => {
    try {
      const response = await communityService.cancelJoinRequest(community!._id);
      if (response.success) {
        setHasPendingRequest(false);
        setSuccess('Join request cancelled successfully');
        await loadCommunity();
      } else {
        setError(response.error || 'Failed to cancel join request');
      }
    } catch (err) {
      setError('Failed to cancel join request');
    }
  };

  const handleLeaveCommunity = async () => {
    if (window.confirm('Are you sure you want to leave this community?')) {
      try {
        const response = await communityService.leave(community!._id);
        if (response.success) {
          setIsMember(false);
          setSuccess('Successfully left the community');
          await loadCommunity();
        } else {
          setError(response.error || 'Failed to leave community');
        }
      } catch (err) {
        setError('Failed to leave community');
      }
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      // TODO: Implement create post API call
      setNewPost('');
      await loadCommunity();
    } catch (err) {
      setError('Failed to create post');
    }
  };

  const handleDeleteCommunity = async () => {
    if (window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      try {
        const response = await communityService.delete(community!._id);
        if (response.success) {
          setSuccess('Community deleted successfully');
          navigate('/communities');
        } else {
          setError(response.error || 'Failed to delete community');
        }
      } catch (err) {
        setError('Failed to delete community');
      }
    }
  };

  const handleEditClick = () => {
    if (community) {
      setEditForm({
        name: community.name,
        description: community.description,
        guidelines: community.guidelines || '',
        privacy: community.privacy,
        relatedMedications: community.relatedMedications.map((med: any) => 
          typeof med === 'string' ? med : med._id
        ),
        locations: community.locations || [],
        communityId: community.communityId
      });
    }
    setIsEditing(true);
  };

  const handleJoinClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    handleJoinCommunity();
  };

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
        window.location.reload();
      } else {
        setLoginError(response.error || 'Login failed');
      }
    } catch (error: any) {
      setLoginError(error.error || 'An error occurred during login');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

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
        setSignupSuccess('Registration successful! Please login.');
        setShowSignupModal(false);
        setShowLoginModal(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          country: ''
        });
      } else {
        setSignupError(response.error || 'Registration failed');
      }
    } catch (err) {
      setSignupError('An error occurred during registration');
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignupInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
      if (strength === 'Weak') {
        setSignupError('Password is too weak. Please use a stronger password.');
      } else {
        setSignupError('');
      }
    }
  };

  const checkPasswordStrength = (password: string): 'Weak' | 'Medium' | 'Strong' => {
    if (password.length < 8) return 'Weak';
    if (password.length < 12) return 'Medium';
    if (!/[A-Z]/.test(password)) return 'Medium';
    if (!/[0-9]/.test(password)) return 'Medium';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Medium';
    return 'Strong';
  };

  if (loading) {
    return (
      <div className="community-container">
        <div className="loading">Loading community...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="community-container">
        <div className="error-message">Community not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header 
        user={user} 
        onLogout={() => {
          logout();
          navigate('/');
        }} 
      />
      
      <div className="community-container">
        <div className="community-header">
          <h1>{community.name}</h1>
          <div className="community-actions">
            {isCreator ? (
              <>
                {isEditing ? (
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="cancel-btn"
                  >
                    Cancel Edit
                  </button>
                ) : (
                  <button 
                    onClick={handleEditClick}
                    className="edit-btn"
                  >
                    Edit Community
                  </button>
                )}
                <button 
                  onClick={handleDeleteCommunity}
                  className="delete-btn"
                >
                  Delete Community
                </button>
              </>
            ) : (
              <>
                {isMember ? (
                  <button className="leave-button" onClick={handleLeaveCommunity}>
                    Leave Community
                  </button>
                ) : hasPendingRequest ? (
                  <button className="cancel-request-button" onClick={handleCancelJoinRequest}>
                    Cancel Join Request
                  </button>
                ) : (
                  <button className="join-button" onClick={handleJoinClick}>
                    Join Community
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="community-content">
          <div className="community-info">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="edit-form">
                <div className="form-group">
                  <label htmlFor="name">Community Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="relatedMedications">Related Products</label>
                  <select
                    id="relatedMedications"
                    name="relatedMedications"
                    multiple
                    size={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                    value={editForm.relatedMedications}
                    onChange={handleMultiSelectChange}
                  >
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="mr-2">Selected: {editForm.relatedMedications.length} products</span>
                    <span>• Hold Ctrl/Cmd to select multiple products</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="locations">Locations</label>
                  <select
                    id="locations"
                    name="locations"
                    multiple
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                    value={editForm.locations}
                    onChange={handleMultiSelectChange}
                  >
                    {availableLocations.map(location => (
                      <option key={location.value} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple locations</p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="privacy">Privacy Setting</label>
                  <select
                    id="privacy"
                    name="privacy"
                    value={editForm.privacy}
                    onChange={handleEditChange}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="guidelines">Community Guidelines</label>
                  <textarea
                    id="guidelines"
                    name="guidelines"
                    value={editForm.guidelines}
                    onChange={handleEditChange}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-btn">Save Changes</button>
                </div>
              </form>
            ) : (
              <>
                <div className="info-section">
                  <h2>Description</h2>
                  <p>{community.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Community ID: {community.communityId}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {community.members?.length || 0} {community.members?.length === 1 ? 'member' : 'members'}
                  </p>
                </div>

                <div className="info-section">
                  <h2>Health Conditions</h2>
                  <div className="tags">
                    {community.healthConditions && community.healthConditions.length > 0 ? (
                      community.healthConditions.map((condition, index) => (
                        <span key={index} className="tag">
                          {condition}
                        </span>
                      ))
                    ) : (
                      <span className="no-tags">No health conditions specified</span>
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <h2>Related Products</h2>
                  <div className="tags">
                    {community.relatedMedications && community.relatedMedications.length > 0 ? (
                      community.relatedMedications.map((medication: string | { _id: string; name: string }) => (
                        <span 
                          key={typeof medication === 'string' ? medication : medication._id} 
                          className="tag"
                        >
                          {typeof medication === 'string' ? medication : medication.name}
                        </span>
                      ))
                    ) : (
                      <span className="no-tags">No related products specified</span>
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <h2>Locations</h2>
                  <div className="tags">
                    {community.locations && community.locations.length > 0 ? (
                      community.locations.map((location, index) => (
                        <span key={index} className="tag">
                          {location}
                        </span>
                      ))
                    ) : (
                      <span className="no-tags">No locations specified</span>
                    )}
                  </div>
                </div>

                {community.guidelines && (
                  <div className="info-section">
                    <h2>Community Guidelines</h2>
                    <p>{community.guidelines}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="community-posts">
            <h2>Community Posts</h2>
            
            {isMember && (
              <form onSubmit={handlePostSubmit} className="post-form">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts with the community..."
                  rows={3}
                />
                <button type="submit">Post</button>
              </form>
            )}

            <div className="posts-list">
              {community.posts && community.posts.length > 0 ? (
                community.posts.map((post) => (
                  <div key={post._id} className="post-card">
                    <div className="post-header">
                      <span className="author">{post.author.name}</span>
                      <span className="date">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="post-content">{post.content}</p>
                  </div>
                ))
              ) : (
                <p className="no-posts">No posts yet. Be the first to share!</p>
              )}
            </div>
          </div>
        </div>

        <div className="community-footer">
          <div className="flex flex-col items-start gap-2">
            <div className="flex gap-2 w-full">
              {isMember && (
                <button
                  onClick={() => navigate(`/communities/${community.name.toLowerCase().replace(/\s+/g, '-')}/place-order`)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Place Order
                </button>
              )}
              {isCreator && (
                <button
                  onClick={() => navigate(`/communities/${community.name.toLowerCase().replace(/\s+/g, '-')}/manage`)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Manage Community
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <button 
                onClick={() => setShowLoginModal(false)}
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
                    setShowLoginModal(false);
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
                    onChange={(e) => handleSignupInputChange('name', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('country', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('email', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('password', e.target.value)}
                    className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
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
                    onChange={(e) => handleSignupInputChange('confirmPassword', e.target.value)}
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
              
              {signupSuccess && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-lg mb-4 flex items-center animate-fade-in">
                  <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {signupSuccess}
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
                    setShowSignupModal(false);
                    setShowLoginModal(true);
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

export default Community; 