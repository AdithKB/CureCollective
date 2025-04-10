import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityService, productService } from '../services/api';
import { locations } from '../data/locations';
import { healthConditions } from '../data/healthConditions';
import { Product, User } from '../types';
import '../styles/CreateCommunity.css';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';

interface FormData {
  name: string;
  description: string;
  healthConditions: string[];
  relatedMedications: string[];
  locations: string[];
  privacy: 'public' | 'private';
  guidelines: string;
}

const CreateCommunity: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    healthConditions: [],
    relatedMedications: [],
    locations: [],
    privacy: 'public',
    guidelines: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }
    
    setUser(JSON.parse(storedUser));
    loadProducts();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name } = e.target;
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      [name]: selectedOptions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await communityService.create({
        name: formData.name,
        description: formData.description,
        healthConditions: formData.healthConditions,
        relatedMedications: formData.relatedMedications,
        locations: formData.locations,
        privacy: formData.privacy,
        guidelines: formData.guidelines
      });

      if (response.success) {
        navigate('/communities');
      } else {
        setError(response.error || 'Failed to create community');
      }
    } catch (err) {
      setError('Failed to create community');
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
          <h1 className="text-3xl font-bold mb-8">Create a New Community</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <form id="community-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  placeholder="Give your community a name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Choose a name that clearly describes the purpose of your community</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  id="description" 
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  placeholder="Describe what this community is about..." 
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">Explain the purpose, goals, and who would benefit from joining</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="healthConditions" className="block text-sm font-medium text-gray-700 mb-1">Health Conditions</label>
                <select
                  id="healthConditions"
                  name="healthConditions"
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.healthConditions}
                  onChange={handleMultiSelectChange}
                  required
                >
                  {healthConditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple conditions</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="relatedMedications" className="block text-sm font-medium text-gray-700 mb-1">Related Medicines</label>
                <select
                  id="relatedMedications"
                  name="relatedMedications"
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.relatedMedications}
                  onChange={handleMultiSelectChange}
                  required
                >
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple medicines</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="locations" className="block text-sm font-medium text-gray-700 mb-1">Locations</label>
                <select
                  id="locations"
                  name="locations"
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.locations}
                  onChange={handleMultiSelectChange}
                  required
                >
                  {locations.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple locations</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="privacy" className="block text-sm font-medium text-gray-700 mb-1">Privacy Setting</label>
                <select 
                  id="privacy" 
                  name="privacy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  value={formData.privacy}
                  onChange={handleInputChange}
                  required
                >
                  <option value="public">Public - Anyone can see and join</option>
                  <option value="private">Private - Only visible to members by invitation</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="guidelines" className="block text-sm font-medium text-gray-700 mb-1">Community Guidelines (Optional)</label>
                <textarea 
                  id="guidelines" 
                  name="guidelines"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                  placeholder="Add any rules or guidelines for your community..."
                  value={formData.guidelines}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/communities')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c] disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Community'}
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

export default CreateCommunity; 