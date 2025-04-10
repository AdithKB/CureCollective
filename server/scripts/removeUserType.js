const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function removeUserType() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('MongoDB connected successfully');

    // Update all users to remove the userType field
    const result = await User.updateMany(
      {}, // Match all documents
      { $unset: { userType: "" } } // Remove the userType field
    );

    console.log(`Updated ${result.modifiedCount} users`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the migration
removeUserType(); 