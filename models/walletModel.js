const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Credit', 'Debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    order: {
        type: ObjectId,
        ref: 'Order',
        required: false //if transactions not related to orders = null
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const walletSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    orders: [{
        type: ObjectId,
        ref: 'Order'
    }],
    transactions: [transactionSchema]
});

module.exports = mongoose.model('Wallet', walletSchema);
