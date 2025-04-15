import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService, orderService, communityService } from '../services/api';
import { Product, User, PricingTier, PricingTierData, Order, BulkOrderProduct, Community } from '../types/index';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';
import { MESSAGES } from '../constants';
import { calculatePrice, processOrder } from '../utils/bulkOrder';
import bulkOrderManager from '../services/bulkOrderManager';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  minOrderQuantity: number;
  pricingTiers: PricingTierData[];
  currentTier: PricingTierData;
  nextTier: PricingTierData | null | undefined;
  totalQuantity: number;
  regularPrice: number;
}

const BulkOrder: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityOrders, setCommunityOrders] = useState<Order[]>([]);
  const [productOrderCounts, setProductOrderCounts] = useState<Record<string, number>>({});
  const isCommunityOrder = location.pathname.includes('/communities/');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we're in a community order or direct product order
        const isCommunityOrder = location.pathname.includes('/communities/');
        
        if (isCommunityOrder) {
          // Reset bulk order manager state
          bulkOrderManager.reset();
          
          // Fetch community data
          const communityResponse = await communityService.getBySlug(slug!);
          if (communityResponse.success && communityResponse.data) {
            setCommunity(communityResponse.data);
            
            // Initialize variables for tracking orders
            const productQuantities: Record<string, number> = {};
            const productOrderers: Record<string, Set<string>> = {};
            
            // Fetch community orders if it's a community order
            if (communityResponse.data._id) {
              console.log('Fetching community orders for:', communityResponse.data._id);
              const ordersResponse = await orderService.getCommunityOrders(communityResponse.data._id);
              if (ordersResponse.success) {
                console.log('Community orders fetched:', ordersResponse.data);
                setCommunityOrders(ordersResponse.data || []);
                
                console.log('Processing community orders:', ordersResponse.data);
                
                // Process each order
                if (ordersResponse.data) {
                  ordersResponse.data.forEach((order: { user: string; items: Array<{ product: string | { _id: string }; quantity: number }> }) => {
                    // Skip the current user's orders to avoid double counting
                    if (order.user === authUser?._id) return;
                    
                    // Process each item in the order
                    order.items.forEach((item) => {
                      // Safely extract the product ID
                      let productId: string;
                      if (typeof item.product === 'string') {
                        productId = item.product;
                      } else if (item.product && item.product._id) {
                        productId = item.product._id;
                      } else {
                        console.error('Invalid product reference in order item:', item);
                        return; // Skip this item
                      }
                      
                      // Add the quantity to the total
                      productQuantities[productId] = (productQuantities[productId] || 0) + item.quantity;
                      
                      // Track unique users who ordered each product
                      if (!productOrderers[productId]) {
                        productOrderers[productId] = new Set();
                      }
                      productOrderers[productId].add(order.user);
                    });
                  });
                }
                
                console.log('Calculated product quantities:', productQuantities);
                
                // Convert Sets to counts
                const ordererCounts: Record<string, number> = {};
                Object.keys(productOrderers).forEach(productId => {
                  ordererCounts[productId] = productOrderers[productId].size;
                });
                
                setProductOrderCounts(ordererCounts);
              } else {
                console.error('Failed to fetch community orders:', ordersResponse.error);
              }
            }
            
            // Fetch all products
            const productsResponse = await productService.getAll();
            if (productsResponse.success && productsResponse.data) {
              setProducts(productsResponse.data);
              
              // Register products with the bulk order manager
              productsResponse.data.forEach((product: Product) => {
                bulkOrderManager.addProduct(product);
              });
              
              // Get linked products for the community
              const linkedProducts = communityResponse.data.linkedProducts || [];
              const relatedMedications = communityResponse.data.relatedMedications || [];
              
              // Combine both linked products and related medications
              const allProducts = [...linkedProducts];
              
              // Add related medications that aren't already in linked products
              relatedMedications.forEach((medication: string | { _id: string }) => {
                const medicationId = typeof medication === 'string' ? medication : medication._id;
                if (!linkedProducts.some((lp: { product: { _id: string } }) => lp.product._id === medicationId)) {
                  // Find the product in the productsResponse
                  const product = productsResponse.data?.find((p: Product) => p._id === medicationId);
                  if (product) {
                    allProducts.push({ product });
                  }
                }
              });
              
              if (allProducts.length === 0) {
                setError('No products available in this community');
                return;
              }

              // Create order items for each product
              const initialOrderItems = allProducts.map((item: { product: Product }) => {
                const product = item.product;
                if (!product) return null;

                const existingQuantity = productQuantities?.[product._id] || 0;
                
                // Initialize the bulk order manager with existing orders
                if (existingQuantity > 0) {
                  bulkOrderManager.initializeExistingOrders(product._id, existingQuantity);
                }

                const pricingTiers: PricingTierData[] = [
                  { minQuantity: product.minOrderQuantity, pricePerUnit: product.bulkPrice },
                  { minQuantity: product.minOrderQuantity * 2, pricePerUnit: product.bulkPrice * 0.9 },
                  { minQuantity: product.minOrderQuantity * 3, pricePerUnit: product.bulkPrice * 0.8 }
                ];

                return {
                  productId: product._id,
                  quantity: 0,
                  price: product.bulkPrice,
                  name: product.name,
                  minOrderQuantity: product.minOrderQuantity,
                  pricingTiers,
                  currentTier: pricingTiers[0],
                  nextTier: pricingTiers[1],
                  totalQuantity: existingQuantity,
                  regularPrice: product.regularPrice
                };
              }).filter(Boolean) as OrderItem[];

              setOrderItems(initialOrderItems);
            }
          } else {
            setError('Community not found');
          }
        } else {
          // Handle direct product order
          const productsResponse = await productService.getAll();
          if (productsResponse.success && productsResponse.data) {
            setProducts(productsResponse.data);
            
            // Find the product by name (slug)
            const productData = productsResponse.data.find(
              (p: Product) => p.name.toLowerCase().replace(/\s+/g, '-') === slug
            );

            if (!productData) {
              setError('Product not found');
              return;
            }

            const pricingTiers: PricingTierData[] = [
              { minQuantity: productData.minOrderQuantity, pricePerUnit: productData.bulkPrice },
              { minQuantity: productData.minOrderQuantity * 2, pricePerUnit: productData.bulkPrice * 0.9 },
              { minQuantity: productData.minOrderQuantity * 3, pricePerUnit: productData.bulkPrice * 0.8 }
            ];

            const initialOrderItems = [{
              productId: productData._id,
              quantity: 0,
              price: productData.bulkPrice,
              name: productData.name,
              minOrderQuantity: productData.minOrderQuantity,
              pricingTiers,
              currentTier: pricingTiers[0],
              nextTier: pricingTiers[1],
              totalQuantity: 0,
              regularPrice: productData.regularPrice
            }];
            setOrderItems(initialOrderItems);
          }
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, location.pathname]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setOrderItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          // Ensure quantity is not negative
          const quantity = Math.max(0, newQuantity);
          
          try {
            // Create or update the order in the bulk order manager
            const result = bulkOrderManager.createOrder(authUser?._id || 'anonymous', productId, quantity);
            console.log('Order updated in bulk order manager:', result);
            
            // Get updated batch status
            const batchStatus = bulkOrderManager.getBatchStatus(productId);
            if (batchStatus) {
              console.log('Updated batch status:', batchStatus);
              
              // Update based on the batch status
              return {
                ...item,
                quantity,
                price: batchStatus.currentPrice,
                currentTier: {
                  minQuantity: batchStatus.currentTier || item.minOrderQuantity,
                  pricePerUnit: batchStatus.currentPrice
                },
                nextTier: batchStatus.nextTier ? {
                  minQuantity: batchStatus.nextTier,
                  pricePerUnit: batchStatus.nextTierPrice || item.pricingTiers[0].pricePerUnit
                } : undefined,
                totalQuantity: batchStatus.totalQuantity
              };
            }
          } catch (error) {
            console.error('Error updating order in bulk order manager:', error);
          }
          
          // If we get here, either there was an error or no batch status
          // Just update the quantity without changing other values
          return {
            ...item,
            quantity
          };
        }
        return item;
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authUser) {
      setError('You must be logged in to place an order');
      return;
    }

    // Check for mandatory user details
    if (!authUser.address || !authUser.phone || !authUser.pincode) {
      setError('Please add your pincode, address & phone no. before placing an order');
      return;
    }
    
    // Check if any items have a quantity greater than 0
    const hasItems = orderItems.some(item => item.quantity > 0);
    if (!hasItems) {
      setError('Please add at least one item to your order');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Filter out items with quantity > 0
      const itemsToOrder = orderItems.filter(item => item.quantity > 0);
      
      // Calculate total order amount
      const totalAmount = itemsToOrder.reduce((sum, item) => {
        const batchStatus = bulkOrderManager.getBatchStatus(item.productId);
        const price = batchStatus ? batchStatus.currentPrice : item.price;
        return sum + (price * item.quantity);
      }, 0);

      // Get wallet balance from localStorage
      const savedBalance = localStorage.getItem('walletBalance');
      const walletBalance = savedBalance ? parseFloat(savedBalance) : 0;

      // Check if wallet has sufficient balance
      if (walletBalance < totalAmount) {
        setError(`Insufficient wallet balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${walletBalance.toFixed(2)}`);
        return;
      }
      
      // Create the order using the bulk order manager
      const orderItemsForApi = itemsToOrder.map(item => {
        // Get the batch status for this product
        const batchStatus = bulkOrderManager.getBatchStatus(item.productId);
        
        // Check if the current user is the top contributor
        const isTopContributor = batchStatus?.topContributor?.userId === authUser?._id;
        const additionalDiscount = isTopContributor ? batchStatus?.topContributor?.additionalDiscount || 0 : 0;
        
        return {
          product: item.productId,
          quantity: item.quantity,
          price: batchStatus ? batchStatus.currentPrice : item.price,
          additionalDiscount: additionalDiscount
        };
      });
      
      let response;
      
      // Handle different order types
      if (isCommunityOrder) {
        // Community order
        const communityId = community?._id;
        
        if (!communityId) {
          setError('Community ID is missing');
          return;
        }
        
        // Submit the order to the API for community order
        response = await orderService.createBulkOrder(communityId, orderItemsForApi);
      } else {
        // Direct purchase
        // Submit the order to the API for direct purchase
        response = await orderService.createDirectOrder(orderItemsForApi);
      }
      
      if (response.success) {
        // Order was successful
        const newBalance = walletBalance - totalAmount;
        localStorage.setItem('walletBalance', newBalance.toString());
        
        // Show success message
        alert('Order placed successfully!');
        
        // Navigate to the profile page with orders tab active
        navigate('/profile', { state: { activeTab: 'orders' } });
      } else {
        // Set the error message from the response
        setError(response.error || 'An error occurred while submitting your order');
      }
    } catch (err: any) {
      console.error('Error submitting order:', err);
      // If there's a response from the server, use its message
      if (err.response?.data) {
        const serverError = err.response.data;
        setError(serverError.error || serverError.message || 'An error occurred while submitting your order');
      } else {
        setError(err.message || 'An error occurred while submitting your order');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProductSelect = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product._id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const pricingTiers: PricingTierData[] = [
        { minQuantity: product.minOrderQuantity, pricePerUnit: product.bulkPrice },
        { minQuantity: product.minOrderQuantity * 2, pricePerUnit: product.bulkPrice * 0.9 },
        { minQuantity: product.minOrderQuantity * 3, pricePerUnit: product.bulkPrice * 0.8 }
      ];

      setOrderItems([...orderItems, {
        productId: product._id,
        quantity: 1,
        price: product.bulkPrice,
        name: product.name,
        minOrderQuantity: product.minOrderQuantity,
        pricingTiers,
        currentTier: pricingTiers[0],
        nextTier: pricingTiers[1],
        totalQuantity: 0,
        regularPrice: product.regularPrice
      }]);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#333]">
      <Header user={authUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Order</h1>
            <p className="text-gray-600">{community ? 'Bulk Purchase' : 'Direct Purchase'}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Product Details</h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-lg font-semibold text-[#4a6fa5]">
                  ₹{localStorage.getItem('walletBalance') ? parseFloat(localStorage.getItem('walletBalance')!).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {orderItems.map(item => (
                <div key={item.productId} className="flex flex-col p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="product-info">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <div className="price-info">
                        <p className="text-gray-600">
                          Regular Price: ₹{item.regularPrice}
                        </p>
                        {item.quantity >= item.minOrderQuantity && (
                          <p className="text-green-600">
                            Bulk Price: ₹{item.price}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Min. Order: {item.minOrderQuantity} units</p>
                      
                      {/* Community Order Progress Meter */}
                      {community && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Community Orders: {item.totalQuantity} units</span>
                            <span>{Math.round((item.totalQuantity / item.minOrderQuantity) * 100)}% of MOQ</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                item.totalQuantity >= item.minOrderQuantity 
                                  ? 'bg-green-600' 
                                  : item.totalQuantity >= item.minOrderQuantity * 0.5 
                                    ? 'bg-yellow-500' 
                                    : 'bg-blue-600'
                              }`}
                              style={{ 
                                width: `${Math.min(100, Math.round((item.totalQuantity / item.minOrderQuantity) * 100))}%` 
                              }}
                            ></div>
                          </div>
                          
                          {/* Top Contributor Information */}
                          {item.totalQuantity > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm text-blue-700">
                                {/* Removed the message about additional discount */}
                              </p>
                            </div>
                          )}
                          
                          {/* Next Tier Progress */}
                          {item.nextTier && item.totalQuantity >= item.minOrderQuantity && (
                            <div className="mt-2">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Next Tier: {item.nextTier.minQuantity} units</span>
                                <span>{Math.round((item.totalQuantity / item.nextTier.minQuantity) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, Math.round((item.totalQuantity / item.nextTier.minQuantity) * 100))}%` 
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-purple-600 mt-1">
                                {item.nextTier.minQuantity - item.totalQuantity} more units needed for next tier (₹{item.nextTier.pricePerUnit} per unit)
                              </p>
                            </div>
                          )}
                          
                          {item.totalQuantity > 0 && (
                            <div className="mt-1">
                              {item.totalQuantity < item.minOrderQuantity && (
                                <p className="text-xs text-yellow-600">
                                  {item.minOrderQuantity - item.totalQuantity} more units needed to reach bulk pricing
                                </p>
                              )}
                              {item.totalQuantity >= item.minOrderQuantity && (
                                <p className="text-xs text-green-600">
                                  Bulk pricing achieved! Community members are saving money.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border rounded-md"
                      />
                      <div className="price-totals">
                        <span className="text-gray-600">
                          Total: ₹{(item.quantity * (item.quantity < item.minOrderQuantity ? item.regularPrice : item.price)).toFixed(2)}
                        </span>
                        {item.quantity >= item.minOrderQuantity && (
                          <span className="text-green-600 text-sm">
                            (You saved ₹{((item.quantity * item.regularPrice) - (item.quantity * item.price)).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {item.quantity < item.minOrderQuantity ? (
                    <div className="mt-2 p-2 bg-yellow-50 rounded">
                      <p className="text-sm text-yellow-700">
                        {item.minOrderQuantity - item.quantity} more units needed to reach bulk pricing
                      </p>
                    </div>
                  ) : item.nextTier && isCommunityOrder && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-700">
                        {item.nextTier.minQuantity - item.totalQuantity} more units needed to get ₹{item.nextTier.pricePerUnit} per unit
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => isCommunityOrder ? navigate(`/communities/${slug}`) : navigate('/products')}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="flex flex-col items-end mr-4">
                <div className="text-lg font-semibold">
                  Total Order Amount: ₹{orderItems.reduce((sum, item) => {
                    // Calculate total based on whether quantity meets minimum order quantity
                    const itemTotal = item.quantity * (item.quantity >= item.minOrderQuantity ? item.price : item.regularPrice);
                    return sum + itemTotal;
                  }, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {orderItems.filter(item => item.quantity > 0).length} items
                </div>
              </div>
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