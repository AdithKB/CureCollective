import { VALIDATION } from '../constants';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= VALIDATION.MIN_PASSWORD_LENGTH;
};

export const calculateSavings = (retailPrice: number, bulkPrice: number, quantity: number): {
  amount: number;
  percentage: number;
} => {
  const retailTotal = retailPrice * quantity;
  const bulkTotal = bulkPrice * quantity;
  const savings = retailTotal - bulkTotal;
  const percentage = (savings / retailTotal) * 100;

  return {
    amount: Number(savings.toFixed(2)),
    percentage: Number(percentage.toFixed(1)),
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const validateProduct = (product: any) => {
  const errors: { [key: string]: string } = {};

  if (!product.name) errors.name = 'Product name is required';
  if (!product.description) errors.description = 'Description is required';
  if (!product.regularPrice) errors.regularPrice = 'Regular price is required';
  if (!product.bulkPrice) errors.bulkPrice = 'Bulk price is required';
  if (!product.minOrderQuantity) errors.minOrderQuantity = 'Minimum order quantity is required';
  if (!product.category) errors.category = 'Category is required';

  if (product.regularPrice && product.bulkPrice && product.regularPrice <= product.bulkPrice) {
    errors.bulkPrice = 'Bulk price must be less than regular price';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 