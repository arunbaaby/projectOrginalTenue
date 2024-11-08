const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const addressSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    addresses: [{
        addressType: {
            type: String,
            required: true,
            enum: ['home', 'office', 'temporary'],
        }, firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        houseNo: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        landmark: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        isSelected: {
            type: Boolean,
            default: false
        }

    }],

})

addressSchema.path('addresses').validate(function (value) {
    return value.length <= 3;
}, 'You can have a maximum of 3 addresses.');


const addressModel = mongoose.model('Address', addressSchema);
module.exports = addressModel;