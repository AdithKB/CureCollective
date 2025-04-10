import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Product } from '../types';
import { authService, productService, communityService } from '../services/api';
import '../styles/Profile.css';

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

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getProfile();
        console.log('Profile response:', response);
        if (response.success && response.user) {
          const userData = response.user;
          setUser(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          console.error('Failed to load profile:', response.error);
          setError(response.error || 'Failed to load profile. Please try again.');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const response = await authService.updateProfile({
        name: formData.name,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.success) {
        setSuccess('Profile updated successfully');
        if (response.user) {
          setUser(response.user);
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while updating profile');
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

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="header-with-back">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h2>Profile</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-content">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>{user?.name}</h3>
            </div>
          </div>

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

          {/* Products Section */}
          <div className="section">
            <div className="section-header">
              <h3>My Products</h3>
              <button 
                className="add-product-button"
                onClick={() => navigate('/add-product')}
              >
                Add Product
              </button>
            </div>
            {loading ? (
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
                        disabled={loading}
                      >
                        ×
                      </button>
                    </div>
                    <p className="product-description">{product.description}</p>
                    <div className="product-details">
                      <div className="price-info">
                        <span className="regular-price">₹{product.regularPrice}</span>
                        <span className="bulk-price">₹{product.bulkPrice}</span>
                      </div>
                      <div className="quantity-info">
                        Min. Order: {product.minOrderQuantity} units
                      </div>
                      <div className="manufacturer-info">
                        Manufacturer: {product.manufacturer}
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

          <div className="section">
            <h3>My Communities</h3>
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
                          onClick={() => navigate(`/communities/${community._id}`)}
                          className="view-button"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteCommunity(community._id)}
                          className="delete-button"
                        >
                          Delete
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
              <p>No communities found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 