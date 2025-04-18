import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { ApiResponse, Product, User, Community, PricingTier, PricingTierData, Order } from '../types/index';
import { MESSAGES } from '../constants';

interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  country: string;
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
    // Only redirect to login on specific auth errors, not on login failures or public endpoints
    if (error.response?.status === 401 && 
        !error.config.url.includes('/auth/login') &&
        !(error.config.url.includes('/communities') && error.config.method === 'get')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Return the error response data directly without wrapping
    return Promise.reject(error.response?.data || error);
  }
);

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (err: any) {
      // Return the error response directly
      return err;
    }
  },

  register: async (userData: RegisterData): Promise<ServerResponse> => {
    try {
      // Ensure we're sending the correct data format
      const registrationData = {
        ...userData,
        // If email is a phone number, move it to the phone field
        ...(userData.email && /^\d+$/.test(userData.email) 
          ? { phone: userData.email, email: undefined }
          : {})
      };

      console.log('Sending registration data:', registrationData);
      const response = await api.post<ServerResponse>('/auth/register', registrationData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      // If we have a response from the server, use its error message
      if (error.response?.data) {
        return error.response.data;
      }
      // If we have an error message but no response, use that
      if (error.message) {
        return {
          success: false,
          error: error.message
        };
      }
      // Default error message
      return {
        success: false,
        error: 'Failed to connect to the server. Please check your internet connection and try again.'
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
  },

  deleteAccount: async (): Promise<ApiResponse> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: error.response?.data?.error || MESSAGES.ERRORS.GENERIC_ERROR
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
    try {
      const response = await api.post(`/communities/${id}/join`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to join community'
      };
    }
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
  },
  getJoinRequests: async (communityId: string) => {
    try {
      const response = await api.get(`/communities/${communityId}/join-requests`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch join requests'
      };
    }
  },
  getUserJoinRequest: async (communityId: string) => {
    try {
      const response = await api.get(`/communities/${communityId}/join-request`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch join request'
      };
    }
  },
  approveJoinRequest: async (requestId: string) => {
    try {
      const response = await api.post(`/communities/join-requests/${requestId}/approve`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to approve join request'
      };
    }
  },
  rejectJoinRequest: async (requestId: string) => {
    try {
      const response = await api.post(`/communities/join-requests/${requestId}/reject`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reject join request'
      };
    }
  },
  cancelJoinRequest: async (communityId: string) => {
    try {
      const response = await api.delete(`/communities/${communityId}/join-request`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel join request'
      };
    }
  },
  removeMember: async (communityId: string, memberId: string) => {
    try {
      const response = await api.delete(`/communities/${communityId}/members/${memberId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove member'
      };
    }
  },
  checkMembership: async (communityId: string) => {
    try {
      const response = await api.get(`/communities/${communityId}/membership`);
      return {
        success: true,
        isMember: response.data.isMember
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check membership'
      };
    }
  },
};

export const orderService = {
  createBulkOrder: async (communityId: string, items: Array<{ product: string; quantity: number; price: number; pricingTier?: PricingTier; additionalDiscount?: number }>, paymentMethod?: string) => {
    try {
      // Create a single bulk order with all products
      const response = await api.post('/bulk-orders', {
        products: items.map(item => ({
          productId: item.product,
          targetQuantity: item.quantity,
          initialQuantity: item.quantity
        })),
        community: communityId,
        paymentMethod
      });
      
      // Dispatch custom event to notify Profile component to refresh orders
      window.dispatchEvent(new Event('orderCreated'));
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error creating bulk order:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
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

  createDirectOrder: async (items: Array<{ product: string; quantity: number; price: number; pricingTier?: PricingTier }>, paymentMethod?: string) => {
    try {
      console.log('Creating direct order with data:', {
        type: 'direct',
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          pricingTier: item.pricingTier
        })),
        paymentMethod
      });

      const response = await api.post('/orders', {
        type: 'direct',
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          pricingTier: item.pricingTier
        })),
        paymentMethod
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
        error: error.response?.data?.error || error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
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

  getMyProductOrders: async () => {
    try {
      const response = await api.get('/orders/my-products');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error fetching product orders:', error);
      if (error.response?.status === 404) {
        return { success: true, data: [] };
      }
      return { 
        success: false, 
        error: error.response?.data?.message || MESSAGES.ERRORS.GENERIC_ERROR 
      };
    }
  },
};

// Add the handleError function
const handleError = (error: any) => {
  if (error.response) {
    return {
      success: false,
      error: error.response.data.message || 'An error occurred',
      data: null
    };
  }
  return {
    success: false,
    error: 'Network error occurred',
    data: null
  };
};

// Add the wallet service
export const walletService = {
  getBalance: async () => {
    try {
      const response = await api.get('/wallet/balance');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  addMoney: async (amount: number) => {
    try {
      const response = await api.post('/wallet/add', { amount });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  withdrawMoney: async (amount: number) => {
    try {
      const response = await api.post('/wallet/withdraw', { amount });
      return response.data;
    } catch (error) {
      console.error('Error in withdrawMoney:', error);
      return handleError(error);
    }
  },

  getTransactions: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
}; 