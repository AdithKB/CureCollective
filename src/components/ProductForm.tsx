import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { MESSAGES } from '../constants';

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    regularPrice: '',
    bulkPrice: '',
    minOrderQuantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await productService.create({
        ...formData,
        regularPrice: Number(formData.regularPrice),
        bulkPrice: Number(formData.bulkPrice),
        minOrderQuantity: Number(formData.minOrderQuantity)
      });
      console.log('Product Creation Response:', response);
      if (response.success) {
        navigate('/products');
      } else {
        setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (error) {
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default ProductForm; 