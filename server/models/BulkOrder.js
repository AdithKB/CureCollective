const mongoose = require('mongoose');

const bulkOrderSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetQuantity: {
        type: Number,
        required: true
    },
    currentQuantity: {
        type: Number,
        default: 0
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        quantity: Number,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['open', 'processing', 'completed', 'cancelled'],
        default: 'open'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BulkOrder', bulkOrderSchema); 