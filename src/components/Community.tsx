import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communityService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/Community.css';

interface Community {
  _id: string;
  name: string;
  description: string;
  healthConditions: string[];
  relatedMedications: (string | { _id: string; name: string })[];
  privacy: string;
  locations: string[];
  guidelines?: string;
  createdAt: string;
  members?: {
    _id: string;
    name: string;
  }[];
  posts?: {
    _id: string;
    content: string;
    author: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }[];
}

const Community: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPost, setNewPost] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (id) {
      loadCommunity();
    }
  }, [id, user]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const response = await communityService.getById(id!);
      if (response.success && response.data) {
        setCommunity(response.data);
        // Check if current user is a member
        const isUserMember = response.data.members?.some(
          (member: { _id: string }) => member._id === user?._id
        );
        setIsMember(isUserMember);
        // Check if current user is the creator
        setIsCreator(response.data.creator?._id === user?._id);
      } else {
        setError('Failed to load community');
      }
    } catch (err) {
      console.error('Error loading community:', err);
      setError('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    try {
      const response = await communityService.join(id!);
      if (response.success) {
        setIsMember(true);
        setSuccess('Successfully joined the community!');
        await loadCommunity(); // Reload community data to update member count
      } else {
        setError(response.error || 'Failed to join community');
      }
    } catch (err) {
      setError('Failed to join community');
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      const response = await communityService.leave(id!);
      if (response.success) {
        setIsMember(false);
        setSuccess('Successfully left the community');
        await loadCommunity(); // Reload community data to update member count
      } else {
        setError(response.error || 'Failed to leave community');
      }
    } catch (err) {
      setError('Failed to leave community');
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

  const handleDeleteCommunity = async (communityId: string) => {
    try {
      const response = await communityService.delete(communityId);
      if (response.success) {
        setSuccess('Community deleted successfully');
        navigate('/communities');
      } else {
        setError(response.error || 'Failed to delete community');
      }
    } catch (err) {
      setError('Failed to delete community');
    }
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
    <div className="community-container">
      <div className="community-header">
        <button className="back-button" onClick={() => navigate('/communities')}>
          ← Back to Communities
        </button>
        <h1>{community.name}</h1>
        <div className="community-actions">
          {isCreator ? (
            <>
              <Link to={`/communities/${community._id}/edit`} className="edit-btn">
                Edit Community
              </Link>
              <button 
                onClick={() => handleDeleteCommunity(community._id)}
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

      <div className="community-content">
        <div className="community-info">
          <div className="info-section">
            <h2>About</h2>
            <p>{community.description}</p>
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
                <span className="no-tags">No conditions specified</span>
              )}
            </div>
          </div>

          <div className="info-section">
            <h2>Related Medications</h2>
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
    </div>
  );
};

export default Community; 