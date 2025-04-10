import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { MESSAGES } from '../constants';
import '../styles/AddProduct.css';

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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'regularPrice' || name === 'bulkPrice' || name === 'minOrderQuantity') {
      // For numeric fields, only allow valid numbers or empty string
      if (value === '' || !isNaN(parseFloat(value))) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      // For non-numeric fields, update as is
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.description || !formData.regularPrice || 
        !formData.bulkPrice || !formData.minOrderQuantity || !formData.category) {
      setError(MESSAGES.ERRORS.REQUIRED_FIELD);
      return;
    }
    
    // Convert string values to numbers
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
      
      // Create product data with numeric values
      const productData = {
        name: formData.name,
        description: formData.description,
        regularPrice,
        bulkPrice,
        minOrderQuantity,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined
      };
      
      console.log('Submitting product data:', productData);
      
      const response = await productService.create(productData);
      
      if (response.success) {
        // Clear form and show success message
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
        
        // Clear success message after 3 seconds
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
  
  return (
    <div className="add-product-container">
      <div className="add-product-card">
        <div className="header-with-back">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h2>Add New Medication</h2>
        </div>
        <p className="subtitle">List your product for bulk ordering</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Product added successfully!</div>}
        
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Medication Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Generic Ibuprofen 200mg"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              name="category"
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
            <label htmlFor="description">Description*</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Provide detailed information about the medication, including uses, dosage forms, etc."
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="regularPrice">Regular Price (₹)*</label>
              <input
                type="number"
                id="regularPrice"
                name="regularPrice"
                value={formData.regularPrice}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                placeholder="e.g. 19.99"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bulkPrice">Bulk Price (₹)*</label>
              <input
                type="number"
                id="bulkPrice"
                name="bulkPrice"
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
            <label htmlFor="minOrderQuantity">Minimum Order Quantity*</label>
            <input
              type="number"
              id="minOrderQuantity"
              name="minOrderQuantity"
              value={formData.minOrderQuantity}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g. 100"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (Optional)</label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="savings-calculator">
            <h3>Savings Calculator</h3>
            {formData.regularPrice && formData.bulkPrice ? (
              <div className="savings-details">
                <div className="savings-amount">
                  <span>Savings per unit:</span>
                  <strong>₹{(Number(formData.regularPrice) - Number(formData.bulkPrice)).toFixed(2)}</strong>
                </div>
                <div className="savings-percentage">
                  <span>Savings percentage:</span>
                  <strong>
                    {Number(formData.regularPrice) > 0 
                      ? ((Number(formData.regularPrice) - Number(formData.bulkPrice)) / Number(formData.regularPrice) * 100).toFixed(0)
                      : 0}%
                  </strong>
                </div>
              </div>
            ) : (
              <p className="savings-placeholder">Enter regular and bulk prices to see savings</p>
            )}
          </div>
          
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct; 