//userModel.js
const mongoose = require('mongoose');
const {generateReferralCode} = require('../helpers/offerHelper');

//schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    is_admin: {
        type: Number,
        required: true,
        default: 0
    },
    is_verified: {
        type: Number,
        default: 0//1 verfied
    },
    is_blocked: {
        type: Number,
        default: 0 // 1 if blocked
    },
    referralCode: {
        type: String,
        unique: true
    }, // Unique referral code
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
});

userSchema.pre('save', function (next) {
    if (!this.referralCode) {
        this.referralCode = generateReferralCode(this._id);
    }
    next();
});

//is verified  = 0 cronjob to clean db  

module.exports = mongoose.model('User', userSchema);