const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    user_id: {
        type: String, // Change this from ObjectId to String
        required: true,//email id should be here
    },
    otp: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

module.exports = mongoose.model('Otp', otpSchema);
