const mongoose = require('mongoose');
const User = require('./server/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test phone registration
const testPhoneRegistration = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // First, check for existing users with this phone number
    const existingUser = await User.findOne({ phone: '1234567891' });
    if (existingUser) {
      console.log('Found existing user:', existingUser);
      console.log('Deleting existing user...');
      await User.deleteOne({ _id: existingUser._id });
      console.log('Existing user deleted');
    }
    
    // Test data
    const testUser = {
      name: 'Test User',
      phone: '1234567891',
      password: 'password123',
      country: 'United States'
    };
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);
    
    // Create user object
    const userData = {
      name: testUser.name,
      phone: testUser.phone,
      password: hashedPassword,
      country: testUser.country
    };
    
    console.log('Creating user with data:', userData);
    
    // Create new user
    const newUser = new User(userData);
    
    // Save user
    console.log('Saving user to database...');
    await newUser.save();
    console.log('User saved successfully!');
    
    // Find the user
    const foundUser = await User.findOne({ phone: testUser.phone });
    console.log('Found user:', foundUser);
    
    // Clean up - delete the test user
    await User.deleteOne({ phone: testUser.phone });
    console.log('Test user deleted');
    
    console.log('Phone registration test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Run the test
testPhoneRegistration(); 