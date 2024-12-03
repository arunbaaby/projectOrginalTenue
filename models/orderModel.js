const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true,
        required: true,
    },
    items: [
        {
            product: {
                type: ObjectId,
                ref: 'Product',
                required: true
            },size:{
                type:String,
                required:true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            priceAtPurchase: {
                type: Number,
                required: true
            },
            discountPriceAtPurchase: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled' , 'Returned'],
                default: 'Pending'
            }
        }
    ],
    shippingAddress: {
        type: Object,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'Cash on Delivery',
        enum: ["Razorpay", "Cash on Delivery", "Wallet"]
    },
    razorpayOrderId: {
        type: String,
        default: null,
    },
    deliveryCharges: {
        type: Number,
        default: 50,
    },
    couponDiscount:{
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    }
}, {
    timestamps: true // This will add `createdAt` and `updatedAt` fields
});

module.exports = mongoose.model('Order', orderSchema);
