import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { MESSAGES } from '../constants';
import { User } from '../types/index';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

interface FormData {
  name: string;
  description: string;
  regularPrice: string;
  bulkPrice: string;
  minOrderQuantity: string;
  category: string;
  imageUrl: string;
}

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    regularPrice: '',
    bulkPrice: '',
    minOrderQuantity: '',
    category: '',
    imageUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Categories list
  const categories = [
    'Pain Relief',
    'Antibiotics',
    'Cardiovascular',
    'Diabetes',
    'Respiratory',
    'Mental Health',
    'Vitamins & Supplements'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }
    
    setUser(JSON.parse(storedUser));
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'regularPrice' || name === 'bulkPrice' || name === 'minOrderQuantity') {
      if (value === '' || !isNaN(parseFloat(value))) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.regularPrice || 
        !formData.bulkPrice || !formData.minOrderQuantity || !formData.category) {
      setError(MESSAGES.ERRORS.REQUIRED_FIELD);
      return;
    }
    
    const regularPrice = parseFloat(formData.regularPrice);
    const bulkPrice = parseFloat(formData.bulkPrice);
    const minOrderQuantity = parseFloat(formData.minOrderQuantity);
    
    if (isNaN(regularPrice) || isNaN(bulkPrice) || isNaN(minOrderQuantity)) {
      setError('Please enter valid numeric values for prices and quantities.');
      return;
    }
    
    if (bulkPrice >= regularPrice) {
      setError('Bulk price must be lower than the regular price.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        regularPrice,
        bulkPrice,
        minOrderQuantity,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined
      };
      
      const response = await productService.create(productData);
      
      if (response.success) {
        setFormData({
          name: '',
          description: '',
          regularPrice: '',
          bulkPrice: '',
          minOrderQuantity: '',
          category: '',
          imageUrl: ''
        });
        
        setSuccess(true);
        
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
      
    } catch (err) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
      console.error('Error adding product:', err);
    } finally {
      setLoading(false);
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
      <Header user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-2">Add New Medication</h2>
            <p className="text-gray-600 mb-6">List your product for bulk ordering</p>
            
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-6">
                Product added successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Generic Ibuprofen 200mg"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Provide detailed information about the medication, including uses, dosage forms, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="regularPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Regular Price (₹)*
                  </label>
                  <input
                    type="number"
                    id="regularPrice"
                    name="regularPrice"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                    value={formData.regularPrice}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 19.99"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bulkPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Bulk Price (₹)*
                  </label>
                  <input
                    type="number"
                    id="bulkPrice"
                    name="bulkPrice"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                    value={formData.bulkPrice}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 14.99"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="minOrderQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Quantity*
                </label>
                <input
                  type="number"
                  id="minOrderQuantity"
                  name="minOrderQuantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.minOrderQuantity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g. 100"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c] disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddProduct; 