import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, communityService } from '../services/api';
import type { Product, User, Community } from '../types';
import { MESSAGES } from '../constants';
import { formatCurrency, calculateSavings } from '../utils/validation';
import '../styles/ProductListing.css';

type SortOption = 'name' | 'price' | 'savings';

const ProductListing: React.FC = () => {
  const navigate = useNavigate();
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
  const [user, setUser] = useState<User | null>(null);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  
  // Fetch products and user data when component mounts
  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          if (parsedUser._id) {
            loadUserCommunities(parsedUser._id);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setError('Error loading user data');
        }
      }
    };

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

    loadUser();
    loadProducts();
  }, []);

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
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="product-listing-container">
      <div className="product-listing-header">
        <div className="header-with-back">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h2>Available Products</h2>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="savings">Sort by Savings</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="sort-order-button"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        <div className="price-range-filter">
          <div className="price-range-header">
            <h3>Price Range</h3>
            <button className="reset-price-range" onClick={() => setPriceRange({ min: '', max: '' })}>
              Reset
            </button>
          </div>
          <div className="price-range-inputs">
            <div className="price-input-group">
              <label htmlFor="min-price">Min Price</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  id="min-price"
                  name="min"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={handlePriceChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="price-range-separator">to</div>
            <div className="price-input-group">
              <label htmlFor="max-price">Max Price</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  id="max-price"
                  name="max"
                  placeholder="1000"
                  value={priceRange.max}
                  onChange={handlePriceChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products">No products found matching your criteria.</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                <img src={product.imageUrl || '/placeholder.png'} alt={product.name} />
              </div>
              <div className="product-details">
                <div className="product-header">
                  <h3>{product.name}</h3>
                </div>
                <div className="category">{product.category}</div>
                <p className="description">{product.description}</p>
                <div className="price-container">
                  <div className="price-details">
                    <div className="regular-price">
                      <span className="label">Regular Price:</span>
                      <span className="value">₹{product.regularPrice}</span>
                    </div>
                    <div className="bulk-price">
                      <span className="label">Bulk Price:</span>
                      <span className="value">₹{product.bulkPrice}</span>
                    </div>
                  </div>
                  <div className="min-order">
                    <span className="label">Min Order:</span>
                    <span className="value">{product.minOrderQuantity} units</span>
                  </div>
                </div>
                <div className="savings">
                  <span className="label">Savings:</span>
                  <span className="value">{calculateSavings(product.regularPrice, product.bulkPrice, 1).percentage}%</span>
                </div>
                {user && userCommunities.length > 0 && (
                  <div className="community-actions">
                    {showCommunityDropdown ? (
                      <div className="community-dropdown">
                        <select
                          value={selectedCommunity}
                          onChange={(e) => setSelectedCommunity(e.target.value)}
                          className="community-select"
                        >
                          <option value="">Select a community</option>
                          {userCommunities.map(community => (
                            <option key={community._id} value={community._id}>
                              {community.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddToCommunity(product._id)}
                          className="confirm-add-btn"
                          disabled={!selectedCommunity}
                        >
                          Add to Community
                        </button>
                        <button
                          onClick={() => {
                            setShowCommunityDropdown(false);
                            setSelectedCommunity('');
                          }}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCommunityDropdown(true)}
                        className="add-to-community-btn"
                      >
                        Add to Community
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListing; 