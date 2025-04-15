const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
joinRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index that only enforces uniqueness for pending requests
joinRequestSchema.index(
  { user: 1, community: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Add an index for efficient querying of join requests by community
joinRequestSchema.index({ community: 1, status: 1 });

// Add an index for efficient querying of join requests by user
joinRequestSchema.index({ user: 1, status: 1 });

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);

module.exports = JoinRequest; 