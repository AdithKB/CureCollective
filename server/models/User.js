const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: false,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  phone: {
    type: String,
    trim: true,
    index: false,
    validate: {
      validator: function(v) {
        return !v || /^\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure either email or phone is provided
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone number must be provided'));
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes after model initialization
const User = mongoose.model('User', userSchema);

// Ensure indexes are created properly
const ensureIndexes = async () => {
  try {
    // Drop existing indexes except _id
    await User.collection.dropIndexes();
    console.log('Dropped existing indexes');

    // Create new indexes with proper settings
    await User.collection.createIndex(
      { email: 1 },
      { unique: true, sparse: true, background: true }
    );
    await User.collection.createIndex(
      { phone: 1 },
      { unique: true, sparse: true, background: true }
    );
    console.log('Created new indexes');
  } catch (error) {
    console.error('Error managing indexes:', error);
  }
};

// Run index management when connected
mongoose.connection.on('connected', ensureIndexes);

module.exports = User; 