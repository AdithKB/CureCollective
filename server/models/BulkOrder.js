const mongoose = require('mongoose');

const bulkOrderProductSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    targetQuantity: {
        type: Number,
        required: true
    },
    currentQuantity: {
        type: Number,
        default: 0
    }
});

const participantQuantitySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
});

const participantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    quantities: [participantQuantitySchema],
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

const bulkOrderSchema = new mongoose.Schema({
    products: [bulkOrderProductSchema],
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    participants: [participantSchema],
    status: {
        type: String,
        enum: ['open', 'processing', 'completed', 'cancelled'],
        default: 'open'
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BulkOrder', bulkOrderSchema); 