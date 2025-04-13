import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { ApiResponse, Product, User } from '../types';

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

interface ServerResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
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
  create: async (communityData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/communities', communityData);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create community'
      };
    }
  },

  getAll: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await api.get('/communities');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch communities'
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/communities/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch community'
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/communities/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete community'
      };
    }
  },

  join: async (communityId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(`/communities/${communityId}/join`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to join community'
      };
    }
  },

  leave: async (communityId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(`/communities/${communityId}/leave`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to leave community'
      };
    }
  },

  linkProduct: async (communityId: string, productId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(`/communities/${communityId}/products/${productId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to link product to community'
      };
    }
  },

  unlinkProduct: async (communityId: string, productId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/communities/${communityId}/products/${productId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to unlink product from community'
      };
    }
  }
};

export const orderService = {
  createBulkOrder: async (communityId: string, items: Array<{ product: string; quantity: number; price: number }>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ communityId, items })
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.data,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create bulk order'
      };
    }
  }
}; 