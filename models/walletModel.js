const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const walletSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    orders: [{
        type: ObjectId,
        ref: 'Order'
    }]
});

module.exports = mongoose.model('Wallet', walletSchema);
