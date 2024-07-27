//userModel.js
const mongoose = require('mongoose');

//schema
const otpSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'//reference User model
    },
    otp:{
        type:Number,
        required:true,
    },
    timestamp:{
        type:Date,
        default:Date.now,//Date.now(): When you use Date.now(), it should be a function reference, not an immediate call. Therefore, use Date.now instead of Date.now().
        required:true,
        get:(timestamp)=>timestamp.getTime(),//store dates as Date objects in the database but retrieve them as timestamps in your application.(not date but time in milliseconds)
        set:(timestamp)=>new Date(timestamp)    
    }
});

module.exports = mongoose.model('Otp',otpSchema);