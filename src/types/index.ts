export interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'patient' | 'pharmacist';
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
  name: string;
  description: string;
  price: number;
  regularPrice: number;
  bulkPrice: number;
  minOrderQuantity: number;
  imageUrl: string;
  category: string;
  manufacturer?: {
    _id: string;
    name: string;
  };
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
  }[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
  isAdmin?: boolean;
  isMember?: boolean;
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

export type PricingTier = 'regular' | 'bulk';

export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
  };
  quantity: number;
  price: number;
  pricingTier?: PricingTier;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  _id: string;
  orderId: string;
  user: string;
  community?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
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