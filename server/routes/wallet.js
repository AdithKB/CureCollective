const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ balance: user.walletBalance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Server error fetching wallet balance' });
  }
});

// Add money to wallet
router.post('/add', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      });
    }

    // Get user's current wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Calculate new balance
    const newBalance = user.walletBalance + amount;

    // Update user's wallet balance
    user.walletBalance = newBalance;
    await user.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'credit',
      amount,
      description: 'Wallet recharge',
      category: 'deposit',
      reference: `RECHARGE-${Date.now()}`,
      status: 'completed'
    });
    await transaction.save({ session });

    await session.commitTransaction();
    res.json({ 
      success: true, 
      data: { 
        newBalance,
        transaction: transaction._id
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding money to wallet:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add money to wallet' 
    });
  } finally {
    session.endSession();
  }
});

// Withdraw money from wallet
router.post('/withdraw', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }

    // Get user with current wallet balance
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Update user's wallet balance
    user.walletBalance -= amount;
    await user.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'debit',
      amount,
      description: 'Withdrawal from wallet',
      category: 'withdrawal',
      reference: `WD-${Date.now()}`,
      status: 'completed'
    });

    await transaction.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ 
      success: true, 
      message: 'Money withdrawn successfully', 
      newBalance: user.walletBalance 
    });
  } catch (error) {
    console.error('Error withdrawing money from wallet:', error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ 
      success: false, 
      message: 'Server error withdrawing money from wallet' 
    });
  }
});

// Get transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, status } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

module.exports = router; 