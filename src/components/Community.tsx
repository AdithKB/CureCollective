import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communityService } from '../services/api';
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

  useEffect(() => {
    if (slug) {
      loadCommunity();
      loadProducts();
    }
  }, [slug, user]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getBySlug(slug!);
      
      if (response.success && response.data) {
        const communityData = response.data;
        setCommunity(communityData);
        
        // Check if current user is a member
        const isUserMember = communityData.members?.some(
          (member: any) => member._id === user?._id
        );
        setIsMember(isUserMember);
        
        // Check if current user is the creator
        const isUserCreator = communityData.creator._id === user?._id;
        setIsCreator(isUserCreator);
        
        // For private communities, check if user has a pending request
        if (communityData.privacy === 'private' && !isUserMember && !isUserCreator) {
          try {
            const requestsResponse = await communityService.getJoinRequests(communityData._id);
            if (requestsResponse.success) {
              const hasRequest = requestsResponse.data.some(
                (request: any) => request.user._id === user?._id && request.status === 'pending'
              );
              setHasPendingRequest(hasRequest);
            }
          } catch (err) {
            // If we get a permission error, try to get user's own join request
            try {
              const userRequestResponse = await communityService.getUserJoinRequest(communityData._id);
              if (userRequestResponse.success && userRequestResponse.data) {
                setHasPendingRequest(userRequestResponse.data.status === 'pending');
              } else {
                setHasPendingRequest(false);
              }
            } catch (err) {
              setHasPendingRequest(false);
            }
          }
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
                  <button className="join-button" onClick={handleJoinCommunity}>
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

      <Footer />
    </div>
  );
};

export default Community; 