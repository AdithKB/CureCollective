export interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'patient' | 'pharmacist';
  phone?: string;
  address?: string;
  country?: string;
  pincode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface Product {
  _id: string;
  productId: string;
  name: string;
  description: string;
  regularPrice: number;
  bulkPrice: number;
  minOrderQuantity: number;
  category: string;
  creator: User;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  _id: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: string;
}

export interface Community {
  _id: string;
  communityId: string;
  name: string;
  description: string;
  healthConditions: string[];
  relatedMedications: (string | { _id: string; name: string })[];
  locations: string[];
  privacy: 'public' | 'private';
  guidelines?: string;
  creator: {
    _id: string;
    name: string;
  };
  members: {
    _id: string;
    name: string;
    email: string;
    userType: 'patient' | 'pharmacist';
    createdAt: string;
    updatedAt: string;
  }[];
  joinRequests?: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      userType: 'patient' | 'pharmacist';
    };
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  }[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
  isAdmin?: boolean;
  isMember?: boolean;
  posts?: {
    _id: string;
    content: string;
    author: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
}

export interface PricingTierData {
  minQuantity: number;
  pricePerUnit: number;
}

export interface PricingTier {
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: number;
  type: 'regular' | 'bulk';
}

export interface OrderItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
  pricingTier?: PricingTier;
  additionalDiscount?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    country?: string;
    pincode?: string;
  };
  community?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface BulkOrderProduct {
  _id: string;
  name: string;
  description: string;
  pricingTiers: PricingTier[];
  orders: Order[];
  finalized: boolean;
} 