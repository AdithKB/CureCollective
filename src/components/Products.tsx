import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { MESSAGES } from '../constants';
import { User, Product } from '../types';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }
    
    fetchProducts();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(product => product.category)));

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
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Products</h1>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => navigate('/add-product')}
                className="px-4 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c] transition-colors whitespace-nowrap"
              >
                Add Product
              </button>
            </div>
          </div>

          <div className="mb-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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
                  <button
                    onClick={() => navigate('/communities', { state: { selectedProduct: product.name } })}
                    className="w-full px-4 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c]"
                  >
                    View Communities
                  </button>
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

export default Products; 