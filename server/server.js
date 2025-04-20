const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    const conn = await mongoose.connect(mongoUri);
    
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return null;
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!', 
    error: err.message 
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bulk-orders', require('./routes/bulkOrders'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/join-requests', require('./routes/joinRequests'));
app.use('/api/wallet', require('./routes/wallet'));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'MedCare API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    // First connect to MongoDB
    const conn = await connectDB();
    if (!conn) {
      console.error('Failed to connect to MongoDB. Server will not start.');
      process.exit(1);
    }

    // Then start the Express server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API health check available at /api/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app; 