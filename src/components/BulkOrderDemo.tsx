import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { productService } from '../services/api';
import { Product } from '../types/index';
import bulkOrderManager from '../services/bulkOrderManager';

const BulkOrderDemo: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAll();
        if (response.success && response.data) {
          setProducts(response.data);
          
          // Register products with the bulk order manager
          response.data.forEach((product: Product) => {
            bulkOrderManager.addProduct(product);
          });
          
          // Select the first product by default
          if (response.data.length > 0) {
            setSelectedProduct(response.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const status = bulkOrderManager.getBatchStatus(selectedProduct);
      setBatchStatus(status);
    }
  }, [selectedProduct]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 0;
    setQuantity(newQuantity);
  };

  const handleAddToOrder = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    try {
      const result = bulkOrderManager.createOrder(
        user?._id || 'anonymous',
        selectedProduct,
        quantity
      );
      
      console.log('Order created:', result);
      
      // Update batch status
      const status = bulkOrderManager.getBatchStatus(selectedProduct);
      setBatchStatus(status);
      
      // Reset quantity
      setQuantity(0);
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to add item to order');
    }
  };

  const handleFinalizeBatch = () => {
    if (!selectedProduct) return;
    
    try {
      const result = bulkOrderManager.finalizeBatch(selectedProduct);
      console.log('Batch finalized:', result);
      
      // Update batch status
      const status = bulkOrderManager.getBatchStatus(selectedProduct);
      setBatchStatus(status);
    } catch (err) {
      console.error('Error finalizing batch:', err);
      setError('Failed to finalize batch');
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="bulk-order-demo">
      <h2>Bulk Order Demo</h2>
      
      <div className="product-selection">
        <h3>Select a Product</h3>
        <select 
          value={selectedProduct} 
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          {products.map(product => (
            <option key={product._id} value={product._id}>
              {product.name} - ${product.regularPrice}
            </option>
          ))}
        </select>
      </div>
      
      <div className="order-form">
        <h3>Add to Order</h3>
        <div className="form-group">
          <label>Quantity:</label>
          <input 
            type="number" 
            min="0" 
            value={quantity} 
            onChange={handleQuantityChange} 
          />
        </div>
        <button onClick={handleAddToOrder}>Add to Order</button>
        <button onClick={handleFinalizeBatch}>Finalize Batch</button>
      </div>
      
      {batchStatus && (
        <div className="batch-status">
          <h3>Batch Status</h3>
          <p>Product: {products.find(p => p._id === selectedProduct)?.name}</p>
          <p>Total Quantity: {batchStatus.totalQuantity}</p>
          <p>Current Price: ${batchStatus.currentPrice}</p>
          <p>Regular Price: ${batchStatus.regularPrice}</p>
          <p>Discount: {batchStatus.discountPercentage}%</p>
          
          {batchStatus.nextTier && (
            <div className="next-tier">
              <p>Next Tier: {batchStatus.nextTier} units</p>
              <p>Next Tier Price: ${batchStatus.nextTierPrice}</p>
              <p>Remaining for Next Tier: {batchStatus.remainingForNextTier} units</p>
            </div>
          )}
          
          <p>Order Count: {batchStatus.orderCount}</p>
        </div>
      )}
    </div>
  );
};

export default BulkOrderDemo; 