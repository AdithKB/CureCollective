import React from 'react';
import { Link } from 'react-router-dom';
import UserMenu from './UserMenu';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md py-4 sticky top-0 z-50">
      <div className="container mx-auto px-0 flex justify-between items-center">
        <div className="text-2xl font-bold ml-0">
          <Link to="/" data-testid="home-link">
            Cure<span className="text-[#4a6fa5]">Collective</span>
          </Link>
        </div>
        <nav className="flex space-x-8">
          <Link
            to="/products"
            data-testid="products-link"
            className="text-[#333] hover:text-[#4a6fa5] transition-colors"
          >
            Products
          </Link>
          <Link
            to="/communities"
            data-testid="communities-link"
            className="text-[#333] hover:text-[#4a6fa5] transition-colors"
          >
            Communities
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
          {user && (
            <UserMenu
              userName={user.name}
              onLogout={onLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 