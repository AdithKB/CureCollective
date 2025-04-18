import { User } from '../types/User';

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

class AuthService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Login failed',
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }
}

export const authService = new AuthService(); 