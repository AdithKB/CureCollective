const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const JoinRequest = require('../models/JoinRequest');
const Community = require('../models/Community');
const Product = require('../models/Product');
const Order = require('../models/Order');
const BulkOrder = require('../models/BulkOrder');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { name, email, phone, password, country } = req.body;

    // Validate required fields
    if (!name || !password || !country) {
      console.log('Missing required fields:', { name, password, country });
      return res.status(400).json({
        success: false,
        error: 'Name, password, and country are required'
      });
    }

    // Validate that at least one of email or phone is provided
    if (!email && !phone) {
      console.log('No email or phone provided');
      return res.status(400).json({
        success: false,
        error: 'Either email or phone number is required'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone: phone }] : [])
      ]
    });
    
    console.log('Existing user check:', existingUser ? 'Found' : 'Not found');
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(400).json({
        success: false,
        error: existingUser.email === email 
          ? 'An account with this email already exists' 
          : 'An account with this phone number already exists'
      });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create new user
    console.log('Creating new user object...');
    const userData = {
      name,
      password: hashedPassword,
      country
    };

    // Only set email or phone, not both
    if (phone) {
      userData.phone = phone;
    } else {
      userData.email = email.toLowerCase();
    }

    console.log('User data before creating User model:', userData);
    
    const newUser = new User(userData);
    console.log('New user object created:', newUser);

    // Save user to database
    console.log('Saving user to database...');
    try {
      await newUser.save();
      console.log('User saved successfully');
    } catch (saveError) {
      console.error('Error saving user to database:', saveError);
      console.error('Validation errors:', newUser.errors);
      
      // Handle validation errors
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }
      
      // Handle duplicate key errors
      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email or phone number already exists'
        });
      }
      
      throw saveError;
    }

    // Create JWT token
    console.log('Creating JWT token...');
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || 'mycare_secret_key',
      { expiresIn: '1d' }
    );
    console.log('JWT token created successfully');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid registration data. Please check your input and try again.'
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email or phone number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error during registration. Please try again.'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email/phone and password'
      });
    }

    // Check if email is a phone number - allow any number of digits
    const isPhone = /^\d+$/.test(email);
    console.log('Login attempt:', { email, isPhone });
    
    // Find user by email or phone
    const query = isPhone ? { phone: email } : { email: email.toLowerCase() };
    console.log('Searching with query:', query);
    
    const user = await User.findOne(query);
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: isPhone 
          ? 'No account found with this phone number. Please check your phone number or sign up for a new account.'
          : 'No account found with this email. Please check your email or sign up for a new account.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please try again.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        pincode: user.pincode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login. Please try again later.'
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Auth profile route - User ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    console.log('Auth profile route - User data:', user);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        pincode: user.pincode,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, currentPassword, newPassword, phone, address, country, pincode, email } = req.body;
    
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // If email is being updated, check if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use by another account'
        });
      }
      user.email = email;
    }
    
    // Update basic fields - allow empty values
    user.name = name !== undefined ? name : user.name;
    user.phone = phone !== undefined ? phone : user.phone;
    user.address = address !== undefined ? address : user.address;
    user.country = country !== undefined ? country : user.country;
    user.pincode = pincode !== undefined ? pincode : user.pincode;
    
    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Save updated user
    await user.save();
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        pincode: user.pincode
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating profile'
    });
  }
});

// Delete user account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete user's transactions
      await Transaction.deleteMany({ user: userId }, { session });

      // Delete user's join requests
      await JoinRequest.deleteMany({ user: userId }, { session });

      // Remove user from communities they are members of
      await Community.updateMany(
        { members: userId },
        { $pull: { members: userId } },
        { session }
      );

      // Delete communities where user is the creator
      await Community.deleteMany({ creator: userId }, { session });

      // Delete user's products
      await Product.deleteMany({ manufacturer: userId }, { session });

      // Delete user's orders
      await Order.deleteMany({ user: userId }, { session });

      // Delete user's bulk orders
      await BulkOrder.deleteMany({ initiator: userId }, { session });

      // Finally, delete the user
      await User.findByIdAndDelete(userId, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting account'
    });
  }
});

module.exports = router; 