export interface User {
  _id: string;
  name: string;
  email: string;
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
  regularPrice: number;
  bulkPrice: number;
  minOrderQuantity: number;
  category: string;
  imageUrl?: string;
  manufacturer: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 