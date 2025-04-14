import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { ApiResponse, Product, User, Community, PricingTier, PricingTierData, Order } from '../types';
import { MESSAGES } from '../constants';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

interface ServerResponse<T = any> {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
  data?: T;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const apiError: ApiError = {
      message: error.response?.data?.message || 'An error occurred. Please try again.',
      status: error.response?.status,
      data: error.response?.data
    };
    return Promise.reject(apiError);
  }
);

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<ServerResponse> => {
    try {
      const response = await api.post<ServerResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to login'
      };
    }
  },

  register: async (userData: RegisterData): Promise<ServerResponse> => {
    try {
      const response = await api.post<ServerResponse>('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to register'
      };
    }
  },

  getProfile: async (): Promise<ServerResponse> => {
    try {
      const response = await api.get<ServerResponse>('/auth/profile');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get profile'
      };
    }
  },

  updateProfile: async (profileData: any): Promise<ServerResponse> => {
    try {
      const response = await api.put<ServerResponse>('/auth/profile', profileData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile'
      };
    }
  }
};

export const productService = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await api.get<ApiResponse<Product[]>>('/products');
      console.log('Products API Response:', response.data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch products'
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  create: async (productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>('/products', productData);
    return response.data;
  },

  update: async (id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
    return response.data;
  },

  getMyProducts: async (): Promise<ApiResponse<Product[]>> => {
    try {
      console.log('API: Fetching my products...');
      const response = await api.get<ApiResponse<Product[]>>('/products/my-products');
      console.log('API: My products response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API: Error fetching my products:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch my products'
      };
    }
  },
};

// Community service
export const communityService = {
  create: async (communityData: any) => {
    const response = await api.post('/communities', communityData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/communities');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/communities/${id}`);
    return response.data;
  },
  getBySlug: async (slug: string) => {
    const response = await api.get(`/communities/slug/${slug}`);
    return response.data;
  },
  update: async (id: string, communityData: any) => {
    try {
      const response = await api.put(`/communities/${id}`, communityData);
      return {
        success: true,
        community: response.data,
        message: 'Community updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update community'
      };
    }
  },
  delete: async (id: string) => {
    const response = await api.delete(`/communities/${id}`);
    return response.data;
  },
  join: async (id: string) => {
    const response = await api.post(`/communities/${id}/join`);
    return response.data;
  },
  leave: async (id: string) => {
    const response = await api.post(`/communities/${id}/leave`);
    return response.data;
  },
  linkProduct: async (communityId: string, productId: string) => {
    const response = await api.post(`/communities/${communityId}/products/${productId}`);
    return response.data;
  },
  unlinkProduct: async (communityId: string, productId: string) => {
    const response = await api.delete(`/communities/${communityId}/products/${productId}`);
    return response.data;
  }
};

export const orderService = {
  createBulkOrder: async (communityId: string, items: Array<{ product: string; quantity: number; price: number; pricingTier?: PricingTier; additionalDiscount?: number }>) => {
    try {
      const response = await api.post('/orders/bulk', {
        community: communityId,
        items
      });
      
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error creating bulk order:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
      };
    }
  },

  getMyOrders: async () => {
    try {
      const response = await api.get('/orders');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 404) {
        return { success: true, data: [] };
      }
      return { 
        success: false, 
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
      };
    }
  },

  getCommunityOrders: async (communityId: string) => {
    try {
      console.log('Fetching community orders for community:', communityId);
      const response = await api.get(`/orders/community/${communityId}`);
      console.log('Community orders response:', response.data);
      
      // Ensure we have a valid data structure
      if (!response.data || !response.data.data) {
        console.warn('Invalid response structure for community orders:', response.data);
        return { success: true, data: [] };
      }
      
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error fetching community orders:', error);
      if (error.response?.status === 404) {
        return { success: true, data: [] };
      }
      return { 
        success: false, 
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
      };
    }
  },

  createDirectOrder: async (items: Array<{ product: string; quantity: number; price: number; pricingTier?: PricingTier }>) => {
    try {
      console.log('Creating direct order with data:', {
        type: 'direct',
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          pricingTier: item.pricingTier
        }))
      });

      const response = await api.post('/orders', {
        type: 'direct',
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          pricingTier: item.pricingTier
        }))
      });

      console.log('Order creation response:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error creating direct order:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return { 
        success: false, 
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
      };
    }
  },

  deleteOrder: async (orderId: string) => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error deleting order:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
      };
    }
  },

  releaseOrders: async (orderIds: string[]): Promise<ServerResponse<any>> => {
    try {
      const response = await api.post('/orders/release', { orderIds });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error releasing orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR
      };
    }
  },
}; 