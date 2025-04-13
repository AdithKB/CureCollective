import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { communityService, productService } from '../services/api';
import { Community, User, Product } from '../types';
import CommunityFilters from './CommunityFilters';
import '../styles/Communities.css';
import { useAuth } from '../hooks/useAuth';
import { healthConditions } from '../data/healthConditions';
import { locations } from '../data/locations';
import Header from './Header';
import Footer from './Footer';
import { MESSAGES } from '../constants';

interface Location {
  value: string;
  label: string;
}

interface Filters {
  location: string;
  condition: string;
  privacy: string;
  medication: string;
}

interface LocationState {
  selectedProduct?: string;
}

const Communities: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    location: '',
    condition: '',
    privacy: '',
    medication: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }
    
    fetchCommunities();
    fetchProducts();
  }, [navigate]);

  // Handle initial product selection from state
  useEffect(() => {
    if (products.length > 0 && (location.state as LocationState)?.selectedProduct) {
      const selectedProduct = (location.state as LocationState).selectedProduct!;
      setFilters(prev => ({ ...prev, medication: selectedProduct }));
      // Filter communities immediately
      const filtered = communities.filter(community => 
        community.relatedMedications && community.relatedMedications.some(med => {
          if (typeof med === 'string') {
            return med.toLowerCase() === selectedProduct.toLowerCase();
          } else if (med.name) {
            return med.name.toLowerCase() === selectedProduct.toLowerCase();
          }
          return false;
        })
      );
      setFilteredCommunities(filtered);
    }
  }, [products, location.state, communities]);

  useEffect(() => {
    filterCommunities();
  }, [searchTerm, filters, communities]);

  const filterCommunities = () => {
    let results = [...communities];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(community => 
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply product filter
    if (filters.medication) {
      results = results.filter(community => 
        community.relatedMedications && community.relatedMedications.some(med => {
          if (typeof med === 'string') {
            return med.toLowerCase() === filters.medication.toLowerCase();
          } else if (med.name) {
            return med.name.toLowerCase() === filters.medication.toLowerCase();
          }
          return false;
        })
      );
    }
    
    // Apply location filter
    if (filters.location) {
      results = results.filter(community => 
        community.locations && community.locations.includes(filters.location)
      );
    }
    
    // Apply health condition filter
    if (filters.condition) {
      results = results.filter(community => 
        community.healthConditions && community.healthConditions.includes(filters.condition)
      );
    }
    
    // Apply privacy filter
    if (filters.privacy) {
      results = results.filter(community => 
        community.privacy === filters.privacy
      );
    }
    
    setFilteredCommunities(results);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await communityService.getAll();
      if (response.success && response.data) {
        const communitiesData = response.data;
        setCommunities(communitiesData);
        setFilteredCommunities(communitiesData);
        
        // Filter communities where the user is the creator
        if (authUser) {
          const userCommunities = communitiesData.filter(
            (community: Community) => community.creator._id === authUser._id
          );
          setMyCommunities(userCommunities);
        }
      } else {
        setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
      console.error('Error fetching communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await communityService.join(communityId);
      if (response.success) {
        fetchCommunities();
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
        fetchCommunities();
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
        fetchCommunities();
      } else {
        setError(response.error || 'Failed to delete community');
      }
    } catch (err) {
      setError('Failed to delete community');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#333]">
      <Header user={authUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Communities</h1>
            <div className="flex gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search communities..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => navigate('/create-community')}
                className="px-4 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c] transition-colors whitespace-nowrap"
              >
                Create Community
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
              {error}
            </div>
          )}

          <CommunityFilters 
            onFilterChange={handleFilterChange} 
            products={products} 
            initialFilters={filters}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map(community => (
              <div key={community._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{community.name}</h3>
                  <p className="text-gray-600 mb-4">{community.description}</p>
                  <div className="info-section">
                    <h2>Related Products</h2>
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
                          <i className="fas fa-pills"></i> No products added yet
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-sm text-gray-500">
                      {community.members.length} members
                    </span>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => navigate(`/communities/${community.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        className="flex-1 px-4 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c]"
                      >
                        View Community
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCommunities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No communities found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Communities; 