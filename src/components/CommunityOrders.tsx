import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, communityService } from '../services/api';
import { Order, Community } from '../types';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';
import { MESSAGES } from '../constants';

// Temporary type definition until TypeScript properly recognizes the type from ../types
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

const CommunityOrders: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch community data
        const communityResponse = await communityService.getBySlug(slug!);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);

          // Check if user is the creator of the community
          if (communityResponse.data.creator !== authUser?._id) {
            setError('You do not have permission to view these orders');
            return;
          }

          // Fetch community orders
          const ordersResponse = await orderService.getCommunityOrders(communityResponse.data._id);
          if (ordersResponse.success) {
            setOrders(ordersResponse.data || []);
          } else {
            setError(ordersResponse.error || MESSAGES.ERRORS.GENERIC_ERROR);
          }
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(MESSAGES.ERRORS.GENERIC_ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, authUser?._id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  const handleReleaseOrders = async () => {
    if (selectedOrders.length === 0) {
      setError('Please select at least one order to release');
      return;
    }

    try {
      setReleasing(true);
      setError(null);

      // Release selected orders
      const response = await orderService.releaseOrders(selectedOrders);
      if (response.success) {
        // Update orders list with proper typing
        const updatedOrders = orders.map(order => {
          if (selectedOrders.includes(order._id)) {
            const status: OrderStatus = 'processing';
            const newOrder: Order = {
              ...order,
              status
            };
            return newOrder;
          }
          return order;
        });
        setOrders(updatedOrders);
        setSelectedOrders([]);
      } else {
        setError(response.error || MESSAGES.ERRORS.GENERIC_ERROR);
      }
    } catch (err) {
      console.error('Error releasing orders:', err);
      setError(MESSAGES.ERRORS.GENERIC_ERROR);
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={authUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Community Orders</h1>
            <p className="text-gray-600">{community?.name}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Order Management</h2>
              <div className="flex gap-4">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleReleaseOrders}
                  disabled={releasing || selectedOrders.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {releasing ? 'Releasing...' : 'Release Selected Orders'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleOrderSelect(order._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{order.orderId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{order.user}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items.map(item => (
                            <div key={item._id}>
                              {item.product.name} x {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">₹{order.total}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found for this community.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityOrders; 