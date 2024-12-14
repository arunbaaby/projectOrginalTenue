//productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['men', 'women', 'unisex'] // Use lowercase values
    },
    sizes:{
        type:[String],
        enum:['S','M','L','XL','XXL']
    },    
    images: [{
        type: String
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0,
        min:0  //price = non-negative
    },
    discountPrice: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
            validator: function(value) {
                return value <= this.price; // Ensures discountPrice is not greater than price
            },
            message: 'Discount price ({VALUE}) should be less than or equal to the price'
        }
    },
    baseDiscountPrice: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
            validator: function (value) {
                return value <= this.price;
            },
            message: 'Base discount price ({VALUE}) should be less than or equal to the price'
        }
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Product',productSchema);