import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, communityService } from '../services/api';
import type { Product, User, Community } from '../types';
import { MESSAGES } from '../constants';
import { formatCurrency, calculateSavings } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

type SortOption = 'name' | 'price' | 'savings';

const ProductListing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<string[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  
  // Fetch products and user data when component mounts
  useEffect(() => {
    const loadUserCommunities = async (userId: string) => {
      try {
        const response = await communityService.getAll();
        if (response.success && response.data) {
          const userCommunities = response.data.filter((community: Community) => 
            community.members && community.members.some(member => member._id === userId)
          );
          setUserCommunities(userCommunities);
        } else {
          setError(response.error || 'Failed to load communities');
        }
      } catch (err) {
        setError('Failed to load communities');
      }
    };

    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAll();
        if (response.success && response.data) {
          setProducts(response.data);
          setFilteredProducts(response.data);
          // Extract unique categories from products
          const uniqueCategories = Array.from(new Set(response.data.map(product => product.category)));
          setCategories(uniqueCategories);
        } else {
          setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
        }
      } catch (err) {
        setError(MESSAGES.ERRORS.GENERIC_ERROR);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    if (authUser?._id) {
      loadUserCommunities(authUser._id);
    }
    loadProducts();
  }, [authUser]);

  // Apply filters when any filter state changes
  useEffect(() => {
    let results = [...products];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(product => product.category === selectedCategory);
    }
    
    // Apply price range filter
    if (priceRange.min !== '') {
      results = results.filter(product => product.bulkPrice >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      results = results.filter(product => product.bulkPrice <= Number(priceRange.max));
    }
    
    // Apply sorting
    switch(sortBy) {
      case 'name':
        results.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        });
        break;
      case 'price':
        results.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.regularPrice - b.regularPrice;
          } else {
            return b.regularPrice - a.regularPrice;
          }
        });
        break;
      case 'savings':
        results.sort((a, b) => {
          const savingsA = calculateSavings(a.regularPrice, a.bulkPrice, 1).percentage;
          const savingsB = calculateSavings(b.regularPrice, b.bulkPrice, 1).percentage;
          if (sortOrder === 'asc') {
            return savingsA - savingsB;
          } else {
            return savingsB - savingsA;
          }
        });
        break;
      default:
        break;
    }
    
    setFilteredProducts(results);
  }, [searchTerm, selectedCategory, priceRange, sortBy, sortOrder, products]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle price range changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: value }));
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
      setError('Error adding product to community');
      console.error('Error:', err);
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
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-3xl font-bold">Available Products</h1>
              <button
                onClick={() => navigate('/add-product')}
                className="px-4 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c] transition-colors whitespace-nowrap"
              >
                Add Product
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="savings">Sort by Savings</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className={`p-2 rounded-md transition-colors ${
                    sortOrder === 'asc' 
                      ? 'bg-[#4a6fa5] text-white hover:bg-[#3a5a8c]' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-gray-500 line-through">₹{product.regularPrice}</span>
                      <span className="text-[#4a6fa5] font-bold ml-2">₹{product.bulkPrice}</span>
                    </div>
                    <span className="text-sm text-gray-500">Min: {product.minOrderQuantity}</span>
                  </div>
                  {authUser?.userType === 'patient' && userCommunities.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                        className="w-full bg-[#4a6fa5] text-white py-2 rounded-md hover:bg-[#3a5a8c] mb-2"
                      >
                        Add to Community
                      </button>
                      {showCommunityDropdown && (
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                          value={selectedCommunity}
                          onChange={(e) => setSelectedCommunity(e.target.value)}
                        >
                          <option value="">Select a community</option>
                          {userCommunities.map(community => (
                            <option key={community._id} value={community._id}>
                              {community.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate('/communities', { state: { selectedProduct: product.name } })}
                      className="w-full bg-[#4a6fa5] text-white py-2 rounded-md hover:bg-[#3a5a8c]"
                    >
                      View Communities
                    </button>
                    <button
                      onClick={() => navigate(`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}/order`)}
                      className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductListing; 