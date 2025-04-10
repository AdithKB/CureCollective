import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2c3e50] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between mb-8">
          <div className="flex-1 min-w-[200px] mb-8">
            <h3 className="text-lg mb-5">Quick Links</h3>
            <ul>
              <li className="mb-2">
                <Link to="#features" data-testid="services-link" className="text-gray-300 hover:text-[#4a6fa5] transition-colors">
                  Features
                </Link>
              </li>
              <li className="mb-2">
                <Link to="#how-it-works" data-testid="about-link" className="text-gray-300 hover:text-[#4a6fa5] transition-colors">
                  How It Works
                </Link>
              </li>
              <li className="mb-2">
                <Link to="#contact" data-testid="contact-link" className="text-gray-300 hover:text-[#4a6fa5] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div id="contact" className="flex-1 min-w-[200px] mb-8">
            <h3 className="text-lg mb-5">Contact Us</h3>
            <p className="text-gray-300 mb-2">Email: info@curecollective.com</p>
            <p className="text-gray-300">Phone: (555) 123-4567</p>
          </div>
        </div>
        <div className="text-center pt-5 border-t border-[#3a506b] text-gray-300">
          <p>&copy; 2025 CureCollective. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 