const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: {
                type: ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default:1
            },
            price:{
                type:Number,
            },
            discountPrice: { 
                type: Number,
            },
            size:{
                type:String,
                enum:['S','M','L','XL','XXL']
            },
            is_selected:{
                type:Boolean,
                default:false
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
