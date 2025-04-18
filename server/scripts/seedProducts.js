const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const dummyProducts = require('../data/dummyProducts');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mycare', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedProducts = async () => {
  try {
    // Find a pharmacist user to associate with the products
    const pharmacist = await User.findOne({ userType: 'pharmacist' });
    
    if (!pharmacist) {
      console.error('No pharmacist found in the database. Please create a pharmacist user first.');
      process.exit(1);
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add dummy products
    const productsWithManufacturer = dummyProducts.map(product => ({
      ...product,
      manufacturer: pharmacist._id
    }));

    await Product.insertMany(productsWithManufacturer);
    console.log('Added dummy products successfully');

    // Log the added products
    const addedProducts = await Product.find().populate('manufacturer', 'name');
    console.log('\nAdded Products:');
    addedProducts.forEach(product => {
      console.log(`- ${product.name} (${product.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts(); 