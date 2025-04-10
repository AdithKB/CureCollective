const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Create a product
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, regularPrice, bulkPrice, minOrderQuantity, category, imageUrl } = req.body;
        
        const product = new Product({
            name,
            description,
            manufacturer: req.user._id,
            regularPrice,
            bulkPrice,
            minOrderQuantity,
            category,
            imageUrl
        });
        
        await product.save();
        
        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error creating product',
            error: error.message
        });
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('manufacturer', 'name');
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching products',
            error: error.message
        });
    }
});

// Get products for logged-in user
router.get('/my-products', auth, async (req, res) => {
    try {
        const products = await Product.find({ manufacturer: req.user._id });
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching user products:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching products',
            error: error.message
        });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('manufacturer', 'name');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching product',
            error: error.message
        });
    }
});

// Delete a product (for manufacturers)
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Only the manufacturer can delete their product
        if (product.manufacturer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own products'
            });
        }
        
        await product.deleteOne();
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting product',
            error: error.message
        });
    }
});

// Get all products (for debugging)
router.get('/debug/all', async (req, res) => {
    try {
        const products = await Product.find().populate('manufacturer', 'name');
        console.log('All products:', products);
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching products',
            error: error.message
        });
    }
});

module.exports = router; 