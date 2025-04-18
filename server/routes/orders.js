const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    const { type, community, items, paymentMethod } = req.body;
    
    // Check for mandatory user details
    const missingFields = [];
    if (!req.user.address) missingFields.push('address');
    if (!req.user.phone) missingFields.push('phone number');
    if (!req.user.pincode) missingFields.push('pincode');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please update your profile with your ${missingFields.join(', ')} before placing an order. Go to Profile > Edit Profile to add these details.`,
        error: `Please update your profile with your ${missingFields.join(', ')} before placing an order. Go to Profile > Edit Profile to add these details.`
      });
    }
    
    // Generate orderId
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderId = `ORD-${year}${month}${day}-${random}`;
    
    const order = new Order({
      orderId,
      user: req.user._id,
      type,
      community,
      items,
      status: 'pending',
      paymentMethod: paymentMethod || 'cod', // Default to COD if not specified
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });

    await order.save();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating order',
      error: error.message
    });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .populate('community')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching orders',
      error: error.message
    });
  }
});

// Delete an order
router.delete('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId,
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be deleted'
      });
    }

    await order.deleteOne();
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting order',
      error: error.message
    });
  }
});

// Get orders for a specific community
router.get('/community/:communityId', auth, async (req, res) => {
  try {
    const orders = await Order.find({ 
      community: req.params.communityId,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('items.product', 'name pricingTiers');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching community orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching community orders'
    });
  }
});

// Get orders for products created by the user
router.get('/my-products', auth, async (req, res) => {
  try {
    // First, get all products created by the user
    const manufacturerProducts = await Product.find({ manufacturer: req.user._id }).select('_id');
    const productIds = manufacturerProducts.map(product => product._id);

    // Then, find all orders that contain these products
    const orders = await Order.find({
      'items.product': { $in: productIds }
    })
    .populate('items.product')
    .populate('user', 'name email phone address country pincode')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching product orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product orders'
    });
  }
});

module.exports = router; 