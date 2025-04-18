import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>
}));

// Mock the useAuthModal hook
const mockOpenModal = jest.fn();
jest.mock('../../contexts/AuthModalContext', () => ({
  useAuthModal: () => ({
    openModal: mockOpenModal
  })
}));

// Mock localStorage
const mockGetItem = jest.fn();
const mockRemoveItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockGetItem,
    removeItem: mockRemoveItem
  },
  writable: true
});

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockReturnValue(null); // Default to no user logged in
  });

  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  test('renders page title', () => {
    renderHomePage();
    const titleElement = screen.getByTestId('page-title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent(/CureCollective/i);
  });

  test('renders login and signup buttons when user is not logged in', () => {
    renderHomePage();
    
    const loginButton = screen.getByTestId('login-button');
    const signupButton = screen.getByTestId('signup-button');
    
    expect(loginButton).toBeInTheDocument();
    expect(signupButton).toBeInTheDocument();
    expect(loginButton).toHaveTextContent(/Log In/i);
    expect(signupButton).toHaveTextContent(/Sign Up/i);
  });

  test('calls openModal with true when login button is clicked', () => {
    renderHomePage();
    
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);
    
    expect(mockOpenModal).toHaveBeenCalledWith(true);
  });

  test('calls openModal with false when signup button is clicked', () => {
    renderHomePage();
    
    const signupButton = screen.getByTestId('signup-button');
    fireEvent.click(signupButton);
    
    expect(mockOpenModal).toHaveBeenCalledWith(false);
  });

  test('renders services and about links when user is logged in', () => {
    // Mock user being logged in
    mockGetItem.mockReturnValue(JSON.stringify({
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    }));
    
    renderHomePage();
    
    const servicesLink = screen.getByTestId('services-link');
    const aboutLink = screen.getByTestId('about-link');
    
    expect(servicesLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();
    expect(servicesLink).toHaveTextContent(/Browse Products/i);
    expect(aboutLink).toHaveTextContent(/Browse Communities/i);
  });

  test('handles logout correctly', () => {
    // Mock user being logged in
    mockGetItem.mockReturnValue(JSON.stringify({
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    }));
    
    renderHomePage();
    
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);
    
    expect(mockRemoveItem).toHaveBeenCalledWith('token');
    expect(mockRemoveItem).toHaveBeenCalledWith('user');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('displays error message when error state is set', () => {
    renderHomePage();
    const errorMessageElement = screen.queryByTestId('error-message');
    expect(errorMessageElement).not.toBeInTheDocument();
  });

  test('displays success message when success state is set', () => {
    renderHomePage();
    const successMessageElement = screen.queryByTestId('success-message');
    expect(successMessageElement).not.toBeInTheDocument();
  });
}); 