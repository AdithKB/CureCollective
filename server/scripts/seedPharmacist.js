const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mycare', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedPharmacist = async () => {
  try {
    // Check if pharmacist already exists
    const existingPharmacist = await User.findOne({ userType: 'pharmacist' });
    if (existingPharmacist) {
      console.log('Pharmacist already exists in the database.');
      process.exit(0);
    }

    // Create pharmacist user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pharmacist123', salt);

    const pharmacist = new User({
      name: 'Demo Pharmacist',
      email: 'pharmacist@demo.com',
      password: hashedPassword,
      userType: 'pharmacist'
    });

    await pharmacist.save();
    console.log('Pharmacist user created successfully');
    console.log('Email: pharmacist@demo.com');
    console.log('Password: pharmacist123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating pharmacist:', error);
    process.exit(1);
  }
};

seedPharmacist(); 