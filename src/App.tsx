import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ProductListing from './components/ProductListing';
import AddProduct from './components/AddProduct';
import Profile from './components/Profile';
import CreateCommunity from './components/CreateCommunity';
import Communities from './components/Communities';
import Community from './components/Community';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListing />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-community" element={<CreateCommunity />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/communities/:id" element={<Community />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
};

export default App; 