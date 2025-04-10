import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface UserMenuProps {
  userName: string;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userName, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-[#333] hover:text-[#007bff] transition-colors"
        data-testid="user-menu-button"
      >
        <span className="font-medium">{userName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[1000]"
          data-testid="user-menu-dropdown"
        >
          <Link
            to="/products"
            className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f7fa] transition-colors"
            data-testid="products-link"
            onClick={() => setIsOpen(false)}
          >
            Browse Products
          </Link>
          
          <Link
            to="/add-product"
            className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f7fa] transition-colors"
            data-testid="add-product-link"
            onClick={() => setIsOpen(false)}
          >
            Add Product
          </Link>
          
          <Link
            to="/communities"
            className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f7fa] transition-colors"
            data-testid="communities-link"
            onClick={() => setIsOpen(false)}
          >
            Communities
          </Link>
          
          <Link
            to="/create-community"
            className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f7fa] transition-colors"
            data-testid="create-community-link"
            onClick={() => setIsOpen(false)}
          >
            Create Community
          </Link>
          
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f7fa] transition-colors"
            data-testid="profile-link"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-[#333] hover:bg-[#f5f7fa] transition-colors"
            data-testid="logout-button"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 