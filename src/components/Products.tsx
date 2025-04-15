import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { productService, communityService, orderService } from '../services/api';
import { MESSAGES } from '../constants';
import { User, Product, Community } from '../types/index';
import { formatCurrency, calculateSavings } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

interface PriceRange {
  min: string;
  max: string;
}

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'date-desc' | 'date-asc';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<string[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Handle initial load and authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }
    
    fetchProducts();
    if (authUser?._id) {
      loadUserCommunities(authUser._id);
    }
  }, [navigate, authUser]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle location state changes
  useEffect(() => {
    console.log('Location state changed:', location.state);
    if (location.state && (location.state as any).selectedProduct) {
      const selectedProduct = (location.state as any).selectedProduct;
      console.log('Setting search term to product ID:', selectedProduct);
      setSearchTerm(selectedProduct);
      // Clear the location state to prevent re-filtering on navigation
      navigate('/products', { replace: true });
    }
  }, [location.state, navigate]);

  const loadUserCommunities = async (userId: string) => {
    try {
      const response = await communityService.getAll();
      if (response.success && response.data) {
        const userCommunities = response.data.filter((community: Community) => 
          community.members && community.members.some((member: User) => member._id === userId)
        );
        setUserCommunities(userCommunities);
      } else {
        setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      if (response.success && response.data) {
        console.log('Raw product data:', response.data);
        console.log('First product structure:', response.data[0]);
        setProducts(response.data);
        // Extract unique categories from products and ensure they are strings
        const uniqueCategories = Array.from(new Set(response.data.map((product: Product) => product.category))) as string[];
        setCategories(uniqueCategories);
      } else {
        setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceRangeChange = (value: string) => {
    const [min, max] = value.split('-').map(v => v.replace('$', '').trim());
    setPriceRange({ min, max: max || '' });
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

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const handleAddToCart = (product: Product) => {
    setSuccess(null);
    setError(null);
    
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.product._id === product._id);
    
    if (existingItemIndex >= 0) {
      // Product already in cart, increment quantity
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
      setCartItems(updatedCart);
      addToast(`${product.name} quantity updated in cart`, 'success');
    } else {
      // Add new product to cart
      setCartItems([...cartItems, { product, quantity: 1 }]);
      addToast(`${product.name} added to cart`, 'success');
    }
  };

  const handleBuyNow = (product: Product) => {
    // Navigate to the place-order page with the product slug
    navigate(`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}/order`);
  };

  const filteredProducts = products.filter(product => {
    // If no search term, return all products that match category
    if (!searchTerm) {
      return !selectedCategory || product.category === selectedCategory;
    }

    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const searchTermLower = searchTerm.toLowerCase().trim();

    // Check for product ID match first
    if (product.productId) {
      // Check for exact match (case-sensitive)
      if (product.productId === searchTerm) {
        console.log('Found exact product ID match:', product.productId);
        return matchesCategory;
      }
      
      // Check for case-insensitive match
      if (product.productId.toLowerCase() === searchTermLower) {
        console.log('Found case-insensitive product ID match:', product.productId);
        return matchesCategory;
      }
      
      // Check for partial match
      if (product.productId.toLowerCase().includes(searchTermLower)) {
        console.log('Found partial product ID match:', product.productId);
        return matchesCategory;
      }
    }
    
    // Check for name match
    if (product.name.toLowerCase().includes(searchTermLower)) {
      return matchesCategory;
    }
    
    // Check for description match
    if (product.description.toLowerCase().includes(searchTermLower)) {
      return matchesCategory;
    }
    
    // No match found
    return false;
  });

  // Apply price range and sorting to filtered products
  const processedProducts = [...filteredProducts].filter(product => {
    // Apply price range filter
    if (priceRange.min !== '' && product.bulkPrice < Number(priceRange.min)) {
      return false;
    }
    if (priceRange.max !== '' && product.bulkPrice > Number(priceRange.max)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch(sortBy) {
      case 'name':
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'price-asc':
        return sortOrder === 'asc'
          ? a.regularPrice - b.regularPrice
          : b.regularPrice - a.regularPrice;
      case 'price-desc':
        return sortOrder === 'asc'
          ? b.regularPrice - a.regularPrice
          : a.regularPrice - b.regularPrice;
      case 'date-desc':
        return sortOrder === 'asc'
          ? b._id.localeCompare(a._id)
          : a._id.localeCompare(b._id);
      case 'date-asc':
        return sortOrder === 'asc'
          ? a._id.localeCompare(b._id)
          : b._id.localeCompare(a._id);
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7fa] to-white text-[#333]">
      <Header user={authUser} onLogout={handleLogout} />
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-[#2c3e50]">Products</h1>
              <p className="text-gray-600">Browse and manage your products</p>
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
                  placeholder="Search products..."
                  className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] rounded-lg bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => navigate('/create-product')}
                className="px-6 py-3 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors whitespace-nowrap shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-8 shadow-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg mb-8 shadow-sm">
              {success}
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#2c3e50]">Filters</h2>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={`${priceRange.min}-${priceRange.max}`}
                  onChange={(e) => handlePriceRangeChange(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="">All Prices</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] bg-white shadow-sm"
                >
                  <option value="name">Name</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedProducts.map(product => (
              <div key={product._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-[#2c3e50]">{product.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <p className="text-sm text-gray-500 mb-4 font-mono">ID: {product.productId}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatCurrency(product.regularPrice)}
                    </span>
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => navigate('/communities', { state: { selectedProduct: product.name } })}
                        className="w-full px-4 py-2 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3a5a8c] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Communities
                      </button>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="w-full px-4 py-2 bg-[#2ecc71] text-white rounded-lg hover:bg-[#27ae60] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Buy Now
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full px-4 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {processedProducts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No products found matching your search.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products; 