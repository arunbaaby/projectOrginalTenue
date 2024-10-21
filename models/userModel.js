//userModel.js
const mongoose = require('mongoose');

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
    googleId:{
        type:String,
        unique:true
    },
    password: {
        type: String,
        required: false
    },//is user admin or not if admin value 1 else 0
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
    }
});
//is verified  = 0 cronjob to clean db

module.exports = mongoose.model('User', userSchema);