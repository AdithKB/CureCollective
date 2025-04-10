const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

async function testDatabase() {
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

        // Find all users
        const users = await User.find({});
        console.log('\nAll users in database:');
        console.log(JSON.stringify(users, null, 2));

        // Find user by email
        const testEmail = 'test@example.com';
        const user = await User.findOne({ email: testEmail });
        console.log('\nLooking for user with email:', testEmail);
        if (user) {
            console.log('User found:', {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                createdAt: user.createdAt
            });
        } else {
            console.log('No user found with this email');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the test
testDatabase(); 