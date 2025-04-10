import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { communityService, productService } from '../services/api';
import { locations } from '../data/locations';
import { healthConditions } from '../data/healthConditions';
import { Product } from '../types';
import '../styles/CreateCommunity.css';
import { useAuth } from '../hooks/useAuth';

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
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // User is not logged in, redirect to home page
      navigate('/');
      return;
    }
    
    loadProducts();
  }, [navigate]);

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked 
        ? [...prev.healthConditions, value]
        : prev.healthConditions.filter(condition => condition !== value)
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  const addTag = (text: string) => {
    if (tags.includes(text)) return;
    
    const newTags = [...tags, text];
    setTags(newTags);
    setFormData(prev => ({
      ...prev,
      relatedMedications: newTags
    }));
  };

  const removeTag = (text: string) => {
    const newTags = tags.filter(tag => tag !== text);
    setTags(newTags);
    setFormData(prev => ({
      ...prev,
      relatedMedications: newTags
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
    return <div className="container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container">
      <header>
        <div className="container">
          <a href="/" className="logo">
            Med<span className="text-[#4a6fa5]">Care</span>
          </a>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/communities">Communities</Link>
          </nav>
        </div>
      </header>
      
      <h1>Create a New Community</h1>
      
      <div className="form-container">
        <form id="community-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="required">Community Name</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              placeholder="Give your community a name" 
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <p className="help-text">Choose a name that clearly describes the purpose of your community</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="required">Description</label>
            <textarea 
              id="description" 
              name="description"
              placeholder="Describe what this community is about..." 
              value={formData.description}
              onChange={handleInputChange}
              required
            ></textarea>
            <p className="help-text">Explain the purpose, goals, and who would benefit from joining</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="healthConditions">Health Conditions</label>
            <select
              id="healthConditions"
              name="healthConditions"
              multiple
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
            <small>Hold Ctrl/Cmd to select multiple conditions</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="relatedMedications">Related Medicines</label>
            <select
              id="relatedMedications"
              name="relatedMedications"
              multiple
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
            <small>Hold Ctrl/Cmd to select multiple medicines</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="locations">Locations</label>
            <select
              id="locations"
              name="locations"
              value={formData.locations}
              onChange={handleMultiSelectChange}
              multiple
              required
            >
              {locations.map(location => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <small>Hold Ctrl/Cmd to select multiple locations</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="privacy" className="required">Privacy Setting</label>
            <select 
              id="privacy" 
              name="privacy"
              value={formData.privacy}
              onChange={handleInputChange}
              required
            >
              <option value="public">Public - Anyone can see and join</option>
              <option value="private">Private - Only visible to members by invitation</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="guidelines">Community Guidelines (Optional)</label>
            <textarea 
              id="guidelines" 
              name="guidelines"
              placeholder="Add any rules or guidelines for your community..."
              value={formData.guidelines}
              onChange={handleInputChange}
            ></textarea>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/communities')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity; 