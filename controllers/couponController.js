const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel');

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

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user.id;

        // Find the coupon
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            is_active: true,
            expirationDate: { $gte: new Date() },
        });

        if (!coupon) {
            return res.status(400).json({ success: false, msg: 'Invalid or expired coupon code.' });
        }

        // Fetch the user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, msg: 'Your cart is empty.' });
        }

        // Calculate cart total dynamically
        const cartTotal = cart.items.reduce((sum, item) => {
            const price = item.product.discountPrice || item.product.price;
            return sum + price * item.quantity;
        }, 0);

        // Validate coupon conditions
        if (cartTotal < coupon.minimumAmount) {
            return res.status(400).json({
                success: false,
                msg: `Cart total must be at least ₹${coupon.minimumAmount} to use this coupon.`,
            });
        }

        if (cartTotal > coupon.maximumAmount) {
            return res.status(400).json({
                success: false,
                msg: `Cart total exceeds the maximum allowed amount of ₹${coupon.maximumAmount} for this coupon.`,
            });
        }

        if (coupon.maxUsers && coupon.usersUsed.length >= coupon.maxUsers) {
            return res.status(400).json({ success: false, msg: 'This coupon has reached its usage limit.' });
        }

        if (coupon.usersUsed.includes(userId)) {
            return res.status(400).json({ success: false, msg: 'You have already used this coupon.' });
        }

        // Calculate discount
        const discount = (cartTotal * coupon.discountPercentage) / 100;

        // Update the cart with the discount
        cart.couponDiscount = discount;
        await cart.save();

        // Mark coupon as used for the user
        coupon.usersUsed.push(userId);
        await coupon.save();

        const newTotal = Math.max(0, cartTotal - discount);

        return res.json({
            success: true,
            msg: 'Coupon applied successfully.',
            cartTotal: cartTotal.toFixed(2),
            discount: discount.toFixed(2),
            newTotal: newTotal.toFixed(2),
        });
    } catch (error) {
        console.error('Error applying coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};



module.exports = {
    loadCouponList,
    loadCreateCoupon,
    createCoupon,
    deactivateCoupon,
    activateCoupon,
    applyCoupon
}