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

const createCoupon = async(req,res)=>{
    try {
        const {
            name,
            code,
            description,
            discountPercentage,
            minPurchaseAmount,
            maxPurchaseAmount,
            expirationDate,
            maxUsers
        } = req.body;


        if(discountPercentage>=5 && discountPercentage<75 && minPurchaseAmount>0 && maxPurchaseAmount>0){
            const newCoupon = new Coupon({
                name,
                code,
                description,
                minimumAmount: minPurchaseAmount,
                maximumAmount: maxPurchaseAmount,
                discountPercentage:discountPercentage,
                expirationDate: new Date(expirationDate),
                maxUsers
            });
            const addedcoupon = await newCoupon.save();
            console.log(addedcoupon+" coupon saved");
            return res.status(200).json({ success: true, message: "Coupon created successfully." });
        }

        res.status(200).json({ success: false, message: "Coupon creation failed" });

        res.send('create coupon');
        
    } catch (error) {
        console.error('Error creating coupon    :', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

const deactivateCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id;
        await Coupon.findByIdAndUpdate(couponId, { is_active: false });
        console.log(`Coupon with ID ${couponId} deactivated`);
        res.redirect('/admin/coupon');
        // res.send('decativate coupon');
        
    } catch (error) {
        console.error('Error deactivating coupon :', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}


const activateCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id;
        await Coupon.findByIdAndUpdate(couponId, { is_active: true });
        console.log(`Coupon with ID ${couponId} activated`);
        res.redirect('/admin/coupon');
    } catch (error) {
        console.error('Error activating coupon :', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}


module.exports = {
    loadCouponList,
    loadCreateCoupon,
    createCoupon,
    deactivateCoupon,
    activateCoupon
}