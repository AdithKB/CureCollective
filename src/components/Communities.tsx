import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { communityService, productService } from '../services/api';
import { Community, User, Product } from '../types/index';
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
  product: string;
  membership: string;
}

interface LocationState {
  selectedProduct?: string;
}

const Communities: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const { productId } = useParams();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    location: '',
    condition: '',
    privacy: '',
    product: '',
    membership: ''
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

  useEffect(() => {
    if (productId) {
      fetchCommunities();
    }
  }, [productId]);

  // Handle initial product selection from state
  useEffect(() => {
    if (products.length > 0 && (location.state as LocationState)?.selectedProduct) {
      const selectedProduct = (location.state as LocationState).selectedProduct!;
      setFilters(prev => ({ ...prev, product: selectedProduct }));
      // Filter communities immediately
      const filtered = communities.filter(community => 
        community.relatedMedications && community.relatedMedications.some((med: string | { _id: string; name: string }) => {
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
  }, [searchQuery, filters, communities]);

  const filterCommunities = () => {
    let results = [...communities];
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(community => 
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.communityId && community.communityId.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply membership filter
    if (filters.membership) {
      results = results.filter(community => {
        if (filters.membership === 'joined') {
          return community.members?.some((member: User) => member._id === authUser?._id);
        } else if (filters.membership === 'requested') {
          return community.joinRequests?.some((request) => request.user._id === authUser?._id);
        }
        return true;
      });
    }
    
    // Apply product filter
    if (filters.product) {
      results = results.filter(community => 
        community.relatedMedications && community.relatedMedications.some((med: string | { _id: string; name: string }) => {
          if (typeof med === 'string') {
            return med.toLowerCase() === filters.product.toLowerCase();
          } else if (med.name) {
            return med.name.toLowerCase() === filters.product.toLowerCase();
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
      let filteredCommunities = response.data;

      // If productId is present, filter communities by the product
      if (productId) {
        filteredCommunities = filteredCommunities.filter((community: Community) =>
          community.relatedMedications.some(med => {
            if (typeof med === 'string') {
              return med === productId;
            }
            return med._id === productId;
          })
        );
      }

      if (response.success && response.data) {
        const communitiesData = response.data;
        setCommunities(communitiesData);
        setFilteredCommunities(filteredCommunities);
        
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
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7fa] to-white text-[#333]">
      <Header user={authUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-[#2c3e50]">Communities</h1>
              <p className="text-gray-600">Connect with others and share experiences</p>
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
                placeholder="Search communities..."
                  className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-lg bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              </div>
              <button
                onClick={() => navigate('/create-community')}
                className="px-6 py-3 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors whitespace-nowrap shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Community
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-8 shadow-sm">
              {error}
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#2c3e50]">Filters</h2>
              <button
                onClick={() => handleFilterChange({
                  location: '',
                  condition: '',
                  privacy: '',
                  product: '',
                  membership: ''
                })}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Product Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={filters.product}
                  onChange={(e) => handleFilterChange({ ...filters, product: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Products</option>
                  {products.map(product => (
                    <option key={product._id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange({ ...filters, location: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Health Condition Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) => handleFilterChange({ ...filters, condition: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Conditions</option>
                  {healthConditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Privacy Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy
                </label>
                <select
                  value={filters.privacy}
                  onChange={(e) => handleFilterChange({ ...filters, privacy: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Privacy Settings</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Membership Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Status
                </label>
                <select
                  value={filters.membership}
                  onChange={(e) => handleFilterChange({ ...filters, membership: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Communities</option>
                  <option value="joined">Joined</option>
                  <option value="requested">Requested to Join</option>
                </select>
              </div>
            </div>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCommunities.map(community => {
              const isMember = community.members?.some((member: User) => member._id === authUser?._id);
              const hasRequested = community.joinRequests?.some((request) => request.user._id === authUser?._id);
              
              return (
                <div key={community._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200 relative">
                  {/* Membership Status Badge */}
                  {(isMember || hasRequested) && (
                    <div className="absolute top-4 right-4">
                      {isMember && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Member
                        </span>
                      )}
                      {hasRequested && !isMember && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Requested
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-[#2c3e50]">{community.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{community.description}</p>
                    <p className="text-sm text-gray-500 mb-4 font-mono">ID: {community.communityId}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Related Products</h4>
                      <div className="flex flex-wrap gap-2">
                        {community.relatedMedications && community.relatedMedications.length > 0 ? (
                          community.relatedMedications.map((medicine: string | { _id: string; name: string }) => {
                            const medicineName = typeof medicine === 'string' ? medicine : medicine.name;
                            const medicineId = typeof medicine === 'string' ? medicine : medicine._id;
                            return (
                              <span key={medicineId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                                {medicineName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-500 text-sm italic">
                            No products added yet
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {community.members.length} members
                      </span>
                        <button
                          onClick={() => navigate(`/communities/${community.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        className="w-full px-4 py-2.5 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors flex items-center justify-center gap-2"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                          View Community
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCommunities.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No communities found matching your search.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Communities; 