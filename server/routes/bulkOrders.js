const express = require('express');
const router = express.Router();
const BulkOrder = require('../models/BulkOrder');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Create a bulk order
router.post('/', auth, async (req, res) => {
    try {
        const { productId, targetQuantity, expiresAt } = req.body;
        
        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Create new bulk order
        const bulkOrder = new BulkOrder({
            product: productId,
            initiator: req.user._id,
            targetQuantity,
            expiresAt: new Date(expiresAt),
            participants: [{
                user: req.user._id,
                quantity: req.body.initialQuantity || 1
            }],
            currentQuantity: req.body.initialQuantity || 1
        });
        
        await bulkOrder.save();
        
        res.status(201).json({
            message: 'Bulk order created successfully',
            bulkOrder
        });
    } catch (error) {
        console.error('Bulk order creation error:', error);
        res.status(500).json({ message: 'Server error creating bulk order' });
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