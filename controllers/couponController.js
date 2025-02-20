const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel');

const loadCouponList = async(req,res)=>{
    try {
        const coupons = await Coupon.find();
        return res.render('couponList',{coupons});
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

const loadCreateCoupon = async(req,res)=>{
    try {
        return res.render('create-coupon');
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error' });
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

        if(!name|| !code|| !description|| !discountPercentage || !minPurchaseAmount || ! maxPurchaseAmount || !expirationDate || ! maxUsers){
            return res.status(400).json({ success: false, message: "Fill out all the informations." });
        }


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
            await newCoupon.save();
            return res.status(200).json({ success: true, message: "Coupon created successfully." });
        }

        return res.status(400).json({ success: false, message: "Coupon creation failed" });
        
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

const deactivateCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id;
        await Coupon.findByIdAndUpdate(couponId, { is_active: false });
        return res.redirect('/admin/coupon');
        // res.send('decativate coupon');
        
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}


const activateCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id;
        await Coupon.findByIdAndUpdate(couponId, { is_active: true });
        return res.redirect('/admin/coupon');
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user.id;

        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            is_active: true,
            expirationDate: { $gte: new Date() },
        });

        if (!coupon) {
            return res.status(400).json({ success: false, msg: 'Invalid or expired coupon code.' });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, msg: 'Your cart is empty.' });
        }

        const cartTotal = cart.items.reduce((sum, item) => {
            const price = item.product.discountPrice || item.product.price;
            return sum + price * item.quantity;
        }, 0);

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

        const discount = (cartTotal * coupon.discountPercentage) / 100;

        cart.couponDiscount = discount;
        await cart.save();

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
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(400).json({ success: false, msg: 'Cart not found.' });
        }

        const appliedCoupon = await Coupon.findOne({ usersUsed: userId });
        if (appliedCoupon) {
            appliedCoupon.usersUsed = appliedCoupon.usersUsed.filter(id => id.toString() !== userId.toString());
            await appliedCoupon.save();
        }

        const cartTotal = cart.items.reduce((sum, item) => {
            const price = item.product.discountPrice || item.product.price;
            return sum + price * item.quantity;
        }, 0);

        cart.couponDiscount = 0;
        await cart.save();

        return res.json({
            success: true,
            msg: 'Coupon removed successfully.',
            newTotal: cartTotal.toFixed(2),
        });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};

const loadEditCoupon = async(req,res)=>{
    try {
        const couponId = req.query.id;
        const coupon = await Coupon.findById(couponId);
        
        return res.render('edit-coupon',{coupon});
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}


const editCoupon = async (req, res) => {
    const {
        id,
        name,
        code,
        description,
        discountPercentage,
        minPurchaseAmount,
        maxPurchaseAmount,
        expirationDate,
        maxUsers
    } = req.body;

    try {
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Update coupon fields
        coupon.name = name || coupon.name;
        coupon.code = code || coupon.code;
        coupon.description = description || coupon.description;
        coupon.discountPercentage = discountPercentage || coupon.discountPercentage;
        coupon.minimumAmount = minPurchaseAmount || coupon.minimumAmount;
        coupon.maximumAmount = maxPurchaseAmount || coupon.maximumAmount;
        coupon.expirationDate = expirationDate || coupon.expirationDate;
        coupon.maxUsers = maxUsers || coupon.maxUsers;

        await coupon.save();

        return res.status(200).json({ success: true, message: 'Coupon updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'An error occurred while updating the coupon', error });
    }
};



module.exports = {
    loadCouponList,
    loadCreateCoupon,
    createCoupon,
    deactivateCoupon,
    activateCoupon,
    applyCoupon,
    removeCoupon,
    loadEditCoupon,
    editCoupon
}