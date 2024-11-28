const Coupon = require('../models/couponModel');

const loadCouponList = async(req,res)=>{
    try {
        const coupons = await Coupon.find();
        res.render('couponList',{coupons});
    } catch (error) {
        console.error('Error loading the coupon page:', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

const loadCreateCoupon = async(req,res)=>{
    try {
        res.render('create-coupon');
    } catch (error) {
        console.error('Error loading the coupon page:', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

module.exports = {
    loadCouponList,
    loadCreateCoupon
}