// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from '../HomePage';

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  describe('Login Modal', () => {
    it('should open login modal when login button is clicked', () => {
      renderHomePage();
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);
      expect(screen.getByText('Login to Your Account')).toBeInTheDocument();
    });

    it('should handle successful login', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            userType: 'patient'
          }
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderHomePage();
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Login', { selector: 'button[type="submit"]' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://localhost:5000/api/users/login',
          { email: 'test@example.com', password: 'password123' }
        );
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle login error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      };
      (axios.post as jest.Mock).mockRejectedValueOnce(mockError);

      renderHomePage();
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Login', { selector: 'button[type="submit"]' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Signup Modal', () => {
    it('should open signup modal when signup button is clicked', () => {
      renderHomePage();
      const signupButton = screen.getByText('Sign Up');
      fireEvent.click(signupButton);
      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    });

    it('should handle successful registration', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            name: 'New User',
            email: 'new@example.com',
            userType: 'patient'
          }
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderHomePage();
      const signupButton = screen.getByText('Sign Up');
      fireEvent.click(signupButton);

      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByText('Sign Up', { selector: 'button[type="submit"]' });

      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://localhost:5000/api/users/register',
          {
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
            userType: 'patient'
          }
        );
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle password mismatch error', async () => {
      renderHomePage();
      const signupButton = screen.getByText('Sign Up');
      fireEvent.click(signupButton);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByText('Sign Up', { selector: 'button[type="submit"]' });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });
}); 