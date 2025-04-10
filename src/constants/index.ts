export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const USER_TYPES = {
  PATIENT: 'patient',
  PHARMACIST: 'pharmacist',
} as const;

export const MESSAGES = {
  ERRORS: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_MISMATCH: 'Passwords do not match',
    WEAK_PASSWORD: 'Password must be at least 8 characters long',
    GENERIC_ERROR: 'Something went wrong. Please try again.',
  },
  SUCCESS: {
    PRODUCT_ADDED: 'Product added successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
  },
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
} as const; 