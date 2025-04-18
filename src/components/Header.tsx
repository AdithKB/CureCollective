import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
import { User } from '../types/index';
import { useAuthModal } from '../contexts/AuthModalContext';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { openModal } = useAuthModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLoginClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    openModal(true);
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-white/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <Link to="/" data-testid="home-link" className="flex items-center">
            <span className="text-[#4a6fa5] mr-1">Cure</span>
            <span className="text-[#333]">Collective</span>
          </Link>
        </div>
        <nav className="hidden md:flex space-x-8">
          <Link
            to="/products"
            data-testid="products-link"
            className={`text-[#333] hover:text-[#4a6fa5] transition-colors relative ${
              isActive('/products') ? 'font-medium' : ''
            }`}
          >
            Products
            {isActive('/products') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4a6fa5]"></span>
            )}
          </Link>
          <Link
            to="/communities"
            data-testid="communities-link"
            className={`text-[#333] hover:text-[#4a6fa5] transition-colors relative ${
              isActive('/communities') ? 'font-medium' : ''
            }`}
          >
            Communities
            {isActive('/communities') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4a6fa5]"></span>
            )}
          </Link>
          <Link
            to="#contact"
            data-testid="contact-link"
            className="text-[#333] hover:text-[#4a6fa5] transition-colors"
            onClick={(e) => {
              e.preventDefault();
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            Contact
          </Link>
        </nav>
        <div data-testid="user-menu" className="relative">
          {user ? (
            <UserMenu
              userName={user.name}
              userEmail={user.email}
              onLogout={onLogout}
            />
          ) : (
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 bg-[#4a6fa5] text-white rounded-md hover:bg-[#3a5a8c] transition-colors"
              data-testid="login-button"
            >
              Log In
            </button>
          )}
        </div>
        <button className="md:hidden text-[#333] focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header; 