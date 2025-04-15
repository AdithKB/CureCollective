const express = require('express');
const router = express.Router();
const BulkOrder = require('../models/BulkOrder');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Create a bulk order
router.post('/', auth, async (req, res) => {
    try {
        let products;
        
        // Handle both single product and array of products
        if (req.body.productId) {
            // Single product format
            products = [{
                productId: req.body.productId,
                targetQuantity: req.body.targetQuantity,
                initialQuantity: req.body.initialQuantity || 1
            }];
        } else if (Array.isArray(req.body.products)) {
            // Array of products format
            products = req.body.products;
        } else {
            return res.status(400).json({ message: 'Invalid request format. Provide either productId or products array.' });
        }
        
        if (products.length === 0) {
            return res.status(400).json({ message: 'At least one product is required' });
        }
        
        // Validate all products
        const productIds = products.map(p => p.productId);
        const productDocs = await Product.find({ _id: { $in: productIds } });
        
        if (productDocs.length !== productIds.length) {
            return res.status(404).json({ message: 'One or more products not found' });
        }
        
        // Create new bulk order
        const bulkOrder = new BulkOrder({
            products: products.map(p => ({
                product: p.productId,
                targetQuantity: p.targetQuantity,
                currentQuantity: p.initialQuantity || 1
            })),
            initiator: req.user._id,
            community: req.body.community,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
            participants: [{
                user: req.user._id,
                quantities: products.map(p => ({
                    product: p.productId,
                    quantity: p.initialQuantity || 1
                }))
            }]
        });
        
        await bulkOrder.save();
        
        // Generate orderId
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const orderId = `ORD-${year}${month}${day}-${random}`;
        
        // Create a regular order record that's linked to the bulk order
        const order = new Order({
            orderId,
            user: req.user._id,
            type: 'bulk',
            community: req.body.community,
            bulkOrder: bulkOrder._id,
            items: products.map(p => {
                const product = productDocs.find(doc => doc._id.toString() === p.productId);
                // Calculate price based on total community quantity
                const totalQuantity = 10; // This should be the total community quantity
                let price = product.bulkPrice;
                
                // Apply tier-based pricing based on total community quantity
                if (totalQuantity >= product.minOrderQuantity * 3) {
                    price = product.bulkPrice * 0.8; // 20% discount
                } else if (totalQuantity >= product.minOrderQuantity * 2) {
                    price = product.bulkPrice * 0.9; // 10% discount
                }
                
                return {
                    product: p.productId,
                    quantity: p.initialQuantity || 1,
                    price: price,
                    pricingTier: 'bulk'
                };
            }),
            status: 'pending',
            total: products.reduce((sum, p) => {
                const product = productDocs.find(doc => doc._id.toString() === p.productId);
                const totalQuantity = 10; // This should be the total community quantity
                let price = product.bulkPrice;
                
                // Apply tier-based pricing based on total community quantity
                if (totalQuantity >= product.minOrderQuantity * 3) {
                    price = product.bulkPrice * 0.8; // 20% discount
                } else if (totalQuantity >= product.minOrderQuantity * 2) {
                    price = product.bulkPrice * 0.9; // 10% discount
                }
                
                return sum + ((p.initialQuantity || 1) * price);
            }, 0)
        });
        
        await order.save();
        
        res.status(201).json({
            message: 'Bulk order created successfully',
            bulkOrder,
            order
        });
    } catch (error) {
        console.error('Bulk order creation error:', error);
        // Return more detailed error information
        res.status(500).json({ 
            message: 'Server error creating bulk order',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get all bulk orders
router.get('/', async (req, res) => {
    try {
        const bulkOrders = await BulkOrder.find()
            .populate('product')
            .populate('initiator', 'name')
            .populate('participants.user', 'name');
        
        res.json(bulkOrders);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching bulk orders' });
    }
});

// Join a bulk order
router.post('/:id/join', auth, async (req, res) => {
    try {
        const bulkOrder = await BulkOrder.findById(req.params.id);
        
        if (!bulkOrder) {
            return res.status(404).json({ message: 'Bulk order not found' });
        }
        
        if (bulkOrder.status !== 'open') {
            return res.status(400).json({ message: 'This bulk order is no longer open' });
        }
        
        const { quantity } = req.body;
        
        // Check if user already participating
        const participantIndex = bulkOrder.participants.findIndex(
            p => p.user.toString() === req.user._id.toString()
        );
        
        if (participantIndex !== -1) {
            // Update existing participant quantity
            bulkOrder.participants[participantIndex].quantity += quantity;
        } else {
            // Add new participant
            bulkOrder.participants.push({
                user: req.user._id,
                quantity
            });
        }
        
        // Update current quantity
        bulkOrder.currentQuantity += quantity;
        
        // Check if target reached
        if (bulkOrder.currentQuantity >= bulkOrder.targetQuantity) {
            bulkOrder.status = 'processing';
        }
        
        await bulkOrder.save();
        
        res.json({
            message: 'Successfully joined bulk order',
            bulkOrder
        });
    } catch (error) {
        console.error('Error joining bulk order:', error);
        res.status(500).json({ message: 'Server error joining bulk order' });
    }
});

module.exports = router; 