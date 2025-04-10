import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { communityService, productService } from '../services/api';
import { Product } from '../types';
import '../styles/CommunityProducts.css';

interface LinkedProduct {
  product: Product;
  addedBy: string;
  addedAt: Date;
}

const CommunityProducts: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsResponse, communityResponse] = await Promise.all([
          productService.getAll(),
          communityService.getById(communityId!)
        ]);

        if (productsResponse.success && communityResponse.success) {
          setProducts(productsResponse.data || []);
          setLinkedProducts(communityResponse.data.linkedProducts || []);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId]);

  const handleLinkProduct = async (productId: string) => {
    try {
      const response = await communityService.linkProduct(communityId!, productId);
      if (response.success) {
        const updatedProduct = products.find(p => p._id === productId);
        if (updatedProduct) {
          setLinkedProducts([...linkedProducts, {
            product: updatedProduct,
            addedBy: response.data.addedBy,
            addedAt: new Date()
          }]);
        }
      } else {
        setError('Failed to link product');
      }
    } catch (err) {
      setError('An error occurred while linking product');
      console.error(err);
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    try {
      const response = await communityService.unlinkProduct(communityId!, productId);
      if (response.success) {
        setLinkedProducts(linkedProducts.filter(p => p.product._id !== productId));
      } else {
        setError('Failed to unlink product');
      }
    } catch (err) {
      setError('An error occurred while unlinking product');
      console.error(err);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !linkedProducts.some(linked => linked.product._id === product._id)
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="community-products">
      <div className="search-section">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="products-section">
        <div className="linked-products">
          <h3>Linked Products</h3>
          {linkedProducts.length === 0 ? (
            <p>No products linked to this community yet.</p>
          ) : (
            <div className="products-grid">
              {linkedProducts.map(linkedProduct => (
                <div key={linkedProduct.product._id} className="product-card">
                  <h4>{linkedProduct.product.name}</h4>
                  <p>{linkedProduct.product.description}</p>
                  <div className="price-details">
                    <div className="regular-price">
                      <span>Regular Price:</span>
                      <span>₹{linkedProduct.product.regularPrice}</span>
                    </div>
                    <div className="bulk-price">
                      <span>Bulk Price:</span>
                      <span>₹{linkedProduct.product.bulkPrice}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkProduct(linkedProduct.product._id)}
                    className="unlink-button"
                  >
                    Unlink Product
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="available-products">
          <h3>Available Products</h3>
          {filteredProducts.length === 0 ? (
            <p>No products available to link.</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product._id} className="product-card">
                  <h4>{product.name}</h4>
                  <p>{product.description}</p>
                  <div className="price-details">
                    <div className="regular-price">
                      <span>Regular Price:</span>
                      <span>₹{product.regularPrice}</span>
                    </div>
                    <div className="bulk-price">
                      <span>Bulk Price:</span>
                      <span>₹{product.bulkPrice}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLinkProduct(product._id)}
                    className="link-button"
                  >
                    Link Product
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityProducts; 