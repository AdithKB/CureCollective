import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { communityService } from '../services/api';
import { Community, User } from '../types';
import CommunityFilters from './CommunityFilters';
import '../styles/Communities.css';
import { useAuth } from '../hooks/useAuth';
import { healthConditions } from '../data/healthConditions';
import { locations } from '../data/locations';

interface Location {
  value: string;
  label: string;
}

interface Filters {
  location: string;
  condition: string;
  medication: string;
}

const Communities: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHealthCondition, setSelectedHealthCondition] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await communityService.getAll();
      console.log('API Response:', response); // Debug log
      
      if (response.success && Array.isArray(response.data)) {
        // Add isAdmin flag to communities where user is the creator
        const communitiesWithAdmin = response.data.map((community: any) => ({
          ...community,
          isAdmin: user && community.creator && community.creator._id === user._id,
          isMember: user && (
            (community.creator && community.creator._id === user._id) ||
            (community.members && community.members.some((member: any) => member._id === user._id))
          ),
          memberCount: community.members?.length || 0
        }));
        
        console.log('Processed Communities:', communitiesWithAdmin); // Debug log
        
        setCommunities(communitiesWithAdmin);
        setFilteredCommunities(communitiesWithAdmin);
        
        // Filter communities where the user is the creator
        if (user) {
          const userCommunities = communitiesWithAdmin.filter(
            (community: Community) => community.creator._id === user._id
          );
          setMyCommunities(userCommunities);
        }
      } else {
        console.error('Invalid response format:', response); // Debug log
        setError(response.error || 'Failed to load communities');
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await communityService.join(communityId);
      if (response.success) {
        loadCommunities();
      } else {
        setError(response.error || 'Failed to join community');
      }
    } catch (err) {
      setError('Failed to join community');
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      const response = await communityService.leave(communityId);
      if (response.success) {
        loadCommunities();
      } else {
        setError(response.error || 'Failed to leave community');
      }
    } catch (err) {
      setError('Failed to leave community');
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    try {
      const response = await communityService.delete(communityId);
      if (response.success) {
        loadCommunities();
      } else {
        setError(response.error || 'Failed to delete community');
      }
    } catch (err) {
      setError('Failed to delete community');
    }
  };

  const handleFilterChange = (filters: Filters) => {
    const filtered = communities.filter(community => {
      // Location filter
      if (filters.location && community.locations && community.locations.length > 0) {
        const hasLocation = community.locations.some(location => 
          location.toLowerCase() === filters.location.toLowerCase()
        );
        if (!hasLocation) {
          return false;
        }
      }

      // Condition filter
      if (filters.condition && community.healthConditions && community.healthConditions.length > 0) {
        const hasCondition = community.healthConditions.some(condition => 
          condition.toLowerCase() === filters.condition.toLowerCase()
        );
        if (!hasCondition) {
          return false;
        }
      }

      // Medication filter
      if (filters.medication && community.relatedMedications && community.relatedMedications.length > 0) {
        const hasMedication = community.relatedMedications.some(medicine => {
          const medicineName = typeof medicine === 'string' ? medicine : medicine.name;
          return medicineName.toLowerCase() === filters.medication.toLowerCase();
        });
        if (!hasMedication) {
          return false;
        }
      }

      return true;
    });

    setFilteredCommunities(filtered);
  };

  if (loading) {
    return (
      <div className="communities-container">
        <div className="loading">Loading communities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="communities-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="communities-container">
      <header className="communities-header">
        <div className="header-with-back">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1>Communities</h1>
        </div>
        {isAuthenticated ? (
          <Link to="/create-community" className="create-community-btn">
            Create New Community
          </Link>
        ) : (
          <Link to="/" className="create-community-btn">
            Login to Create Community
          </Link>
        )}
      </header>

      {isAuthenticated && myCommunities.length > 0 && (
        <div className="my-communities-section">
          <h2>My Communities</h2>
          <div className="communities-grid">
            {myCommunities.map(community => (
              <div key={community._id} className="community-card">
                <div className="community-header">
                  <h2>{community.name}</h2>
                  <span className={`privacy-badge ${community.privacy}`}>
                    {community.privacy}
                  </span>
                </div>
                <p className="community-description">{community.description}</p>
                <div className="community-meta">
                  <div className="community-tags">
                    <div className="tag-group">
                      <h4>Health Conditions</h4>
                      <div className="tags">
                        {community.healthConditions && community.healthConditions.length > 0 ? (
                          community.healthConditions.map(condition => (
                            <span key={condition} className="tag">{condition}</span>
                          ))
                        ) : (
                          <span className="no-tags">No conditions specified</span>
                        )}
                      </div>
                    </div>
                    <div className="tag-group">
                      <h4>Locations</h4>
                      <div className="tags">
                        {community.locations && community.locations.length > 0 ? (
                          community.locations.map(location => {
                            const locationData = locations.find((l: Location) => l.value === location);
                            return (
                              <span key={location} className="tag">
                                {locationData ? locationData.label : location}
                              </span>
                            );
                          })
                        ) : (
                          <span className="no-tags">No locations specified</span>
                        )}
                      </div>
                    </div>
                    <div className="tag-group">
                      <h4>Related Medications</h4>
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
                  </div>
                  {community.memberCount !== undefined && (
                    <span className="member-count">{community.memberCount} members</span>
                  )}
                </div>
                <div className="community-actions">
                  <Link to={`/communities/${community._id}`} className="view-community-btn">
                    View Community
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2>All Communities</h2>
      <CommunityFilters onFilterChange={handleFilterChange} />

      <div className="communities-grid">
        {filteredCommunities.length > 0 ? (
          filteredCommunities.map(community => (
            <div key={community._id} className="community-card">
              <div className="community-header">
                <h2>{community.name}</h2>
                <span className={`privacy-badge ${community.privacy}`}>
                  {community.privacy}
                </span>
              </div>
              <p className="community-description">{community.description}</p>
              <div className="community-meta">
                <div className="community-tags">
                  <div className="tag-group">
                    <h4>Health Conditions</h4>
                    <div className="tags">
                      {community.healthConditions && community.healthConditions.length > 0 ? (
                        community.healthConditions.map(condition => (
                          <span key={condition} className="tag">{condition}</span>
                        ))
                      ) : (
                        <span className="no-tags">No conditions specified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4>Locations</h4>
                    <div className="tags">
                      {community.locations && community.locations.length > 0 ? (
                        community.locations.map(location => {
                          const locationData = locations.find((l: Location) => l.value === location);
                          return (
                            <span key={location} className="tag">
                              {locationData ? locationData.label : location}
                            </span>
                          );
                        })
                      ) : (
                        <span className="no-tags">No locations specified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4>Related Medications</h4>
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
                </div>
                {community.memberCount !== undefined && (
                  <span className="member-count">{community.memberCount} members</span>
                )}
              </div>
              <div className="community-actions">
                <Link to={`/communities/${community._id}`} className="view-community-btn">
                  View Community
                </Link>
                {isAuthenticated && community.isAdmin && (
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
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No communities found matching your filters.</p>
            <button 
              className="clear-filters-button"
              onClick={() => setFilteredCommunities(communities)}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities; 