import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, productService, orderService } from '../services/api';
import { Community, Product, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';
import { MESSAGES } from '../constants';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  minOrderQuantity: number;
}

const BulkOrder: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First, get all communities to find the one with matching slug
        const communitiesResponse = await communityService.getAll();
        if (!communitiesResponse.success || !communitiesResponse.data) {
          setError('Failed to load communities');
          return;
        }

        const communityData = communitiesResponse.data.find(
          (c: Community) => c.name.toLowerCase().replace(/\s+/g, '-') === slug
        );

        if (!communityData) {
          setError('Community not found');
          return;
        }

        const productsResponse = await productService.getAll();

        if (productsResponse.success && productsResponse.data) {
          setCommunity(communityData);
          setProducts(productsResponse.data);
          
          // Initialize order items with community's related products
          const initialOrderItems = communityData.relatedMedications.map((product: any) => {
            const productId = typeof product === 'string' ? product : product._id;
            const productData = productsResponse.data?.find((p: Product) => p._id === productId);
            if (!productData) return null;
            return {
              productId,
              quantity: 0,
              price: productData.bulkPrice || 0,
              name: productData.name,
              minOrderQuantity: productData.minOrderQuantity
            };
          }).filter(Boolean) as OrderItem[];
          setOrderItems(initialOrderItems);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('An error occurred while loading data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setOrderItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const items = orderItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price
        }));

      if (items.length === 0) {
        setError('Please select at least one product');
        return;
      }

      const response = await orderService.createBulkOrder(community!._id, items);
      if (response.success) {
        navigate(`/communities/${slug}`);
      } else {
        setError(response.error || 'Failed to create bulk order');
      }
    } catch (err) {
      setError('An error occurred while creating the order');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !community) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#333]">
      <Header user={authUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Bulk Order</h1>
            <p className="text-gray-600">For {community.name}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Products</h2>
            <div className="space-y-4">
              {orderItems.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="product-info">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-gray-600">₹{item.price}</p>
                    <p className="text-sm text-gray-500">Min. Order: {item.minOrderQuantity} units</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={item.minOrderQuantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border rounded-md"
                    />
                    <span className="text-gray-600">
                      Total: ₹{(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => navigate(`/communities/${slug}`)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BulkOrder; 