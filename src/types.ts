export interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'patient' | 'pharmacist';
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  regularPrice: number;
  bulkPrice: number;
  minOrderQuantity: number;
  manufacturer: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
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

export interface AuthResponse {
  token: string;
  user: User;
} 