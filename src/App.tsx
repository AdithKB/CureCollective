import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Products from './components/Products';
import AddProduct from './components/AddProduct';
import Profile from './components/Profile';
import CreateCommunity from './components/CreateCommunity';
import Communities from './components/Communities';
import Community from './components/Community';
import BulkOrder from './components/BulkOrder';
import BulkOrderDemo from './components/BulkOrderDemo';
import CommunityManage from './components/CommunityManage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-community" element={<CreateCommunity />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/communities/:slug" element={<Community />} />
        <Route path="/communities/:slug/manage" element={<CommunityManage />} />
        <Route path="/communities/:slug/place-order" element={<BulkOrder />} />
        <Route path="/products/:slug/order" element={<BulkOrder />} />
        <Route path="/products/:productId/communities" element={<Communities />} />
        <Route path="/bulk-order-demo" element={<BulkOrderDemo />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
};

export default App; 