const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Wallet = require('../models/walletModel');
const Coupon = require('../models/couponModel');

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { log } = require('console');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


//order number random
async function generateUniqueOrderNumber() {
    let unique = false;
    let orderNumber = "";

    while (!unique) {
        const randomTxt = Math.random().toString(36).substring(2, 8).toUpperCase(); //random string
        const randomNumber = Math.floor(1000 + Math.random() * 90000); // 1000 - 99999
        orderNumber = randomTxt + randomNumber;

        const existingOrder = await Order.findOne({ orderNumber });
        if (!existingOrder) {
            unique = true; // Exit if uniwu
        }
    }

    return orderNumber;
}

// function normalizeAddress(address) {
//     return {
//         ...address,
//         addressType: address.addressType.toLowerCase(),
//         firstName: address.firstName.trim(),
//         lastName: address.lastName.trim(),
//         houseNo: address.houseNo.trim(),
//         street: address.street.toLowerCase().trim(),
//         landmark: address.landmark.toLowerCase().trim(),
//         city: address.city.toLowerCase().trim(),
//         district: address.district.toLowerCase().trim(),
//         state: address.state.toLowerCase().trim(),
//         pincode: address.pincode
//     };
// }


const loadCheckout = async (req, res) => {
    try {
        const userId = req.user.id;
        const userAddresses = await Address.findOne({ user: userId }) || null;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        const user = await User.findById(userId);

        // console.log(cart);
        // console.log(address);
        // console.log(cart.items[0].product._id);

        if (!cart || !cart.items.length) {
            res.redirect('/cart');
            // return res.status(400).json('no items in the cart');
        }

        const validItems = cart.items.filter(item => item.product);

        // Fetch active and valid coupons
        const today = new Date();
        const availableCoupons = await Coupon.find({
            is_active: true,
            expirationDate: { $gte: today },
        });

        res.render('checkout', { userAddresses, cart, user, items: validItems, availableCoupons });
    } catch (error) {
        console.error('Error loading the checkout page:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { selectedAddress, paymentMethod } = req.body;

        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: 'No Address selected' });
        }

        // console.log(userId);

        console.log(selectedAddress);
        // console.log('Payment method '+paymentMethod);

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, message: 'No items in the cart to place order' });
        }

        // remove null: when product deleted fromt DB
        cart.items = cart.items.filter(item => item.product);

        const inactiveProduct = cart.items.find(item => item.product.is_active === false);
        if (inactiveProduct) {
            return res.status(400).json({
                success: false,
                redirectUrl: '/unlisted-product',
                message: `Product "${inactiveProduct.product.name}" is no longer available.`,
            });
        }

        const userAddresses = await Address.findOne({ user: userId });
        if (!userAddresses) {
            return res.status(400).json({ success: false, message: 'User addresses not found' });
        }

        const selectedAddressObj = userAddresses.addresses.find(addr => addr._id.toString() === selectedAddress);
        if (!selectedAddressObj) {
            return res.status(400).json({ success: false, message: 'Selected address not found' });
        }

        console.log(cart.items[0].product.name);

        console.log('selectedAddressObj: ' + selectedAddressObj);


        // console.log(orderNumber);

        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            discountPriceAtPurchase: item.product.discountPrice,
            size: item.size,
            status: paymentMethod === 'Cash on Delivery' ? 'Processing' : 'Pending'
        }));

        const itemsTotal = orderItems.reduce((sum, item) => sum + item.discountPriceAtPurchase * item.quantity, 0);

        const deliveryCharge = 50;
        const couponDiscount = cart.couponDiscount || 0;
        const total = Math.max(0, itemsTotal + deliveryCharge - couponDiscount);

        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ user: userId });
            if (!wallet || wallet.amount < total) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance. Please select an alternative payment method.' });
            }
            wallet.amount -= total;
            await wallet.save();
        }

        if (paymentMethod === 'Cash on Delivery' && total > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Cash on Delivery is not available for orders above ₹1000. Please select an alternative payment method.',
            });
        }

        for (const item of cart.items) {
            const product = item.product;

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            // Reduce the stock
            product.stock -= item.quantity;

            // Save the updated product
            await product.save();
        }

        const orderNumber = await generateUniqueOrderNumber();
        const newOrder = new Order({
            user: userId,
            items: orderItems,
            shippingAddress: selectedAddressObj,
            total,
            orderNumber,
            paymentMethod,
            paymentStatus: paymentMethod === 'Razorpay' ? 'Pending' : 'Completed',
            couponDiscount
        });

        if (paymentMethod === 'Razorpay') {
            try {
                const razorpayOrder = await razorpay.orders.create({
                    amount: total * 100,
                    currency: 'INR',
                    receipt: newOrder._id.toString(),
                });
                newOrder.razorpayOrderId = razorpayOrder.id;
            } catch (err) {
                console.error('Error creating Razorpay order:', err);
                return res.status(500).json({ success: false, message: 'Error creating Razorpay order. Please check internet connection' });
            }
        }
        

        await newOrder.save();


        console.log(newOrder);

        // await newOrder.save();

        await Cart.updateOne({ user: userId }, { items: [], couponDiscount: 0 });

        if (paymentMethod === 'Razorpay') {
            return res.json({
                success: true,
                orderId: newOrder._id,
                razorpayOrderId: newOrder.razorpayOrderId,
                amount: total * 100,
                currency: 'INR',
                key: process.env.RAZORPAY_KEY_ID,
                name: 'Your Store Name',
                description: 'Purchase Description',
            });
        }

        if (paymentMethod === 'Wallet') {
            return res.json({
                success: true,
                message: 'Order placed successfully using wallet balance.',
                orderId: newOrder._id,
                redirectUrl: `/order-confirmation?orderId=${newOrder._id}`,
            });
        }


        if (paymentMethod !== 'Razorpay') {
            return res.json({
                success: true,
                redirectUrl: `/order-confirmation?orderId=${newOrder._id}`,
            });
        }


        // res.redirect(`/order-confirmation?orderId=${newOrder._id}`);
    } catch (error) {
        console.error('Error placing order:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
};

//to update the payment status after payment failure
const notifyPaymentFailure = async (req, res) => {
    try {
        const { orderId } = req.body;

        await Order.updateOne(
            { _id: orderId },
            { paymentStatus: 'Failed' }
        );

        res.status(200).json({ success: true, message: 'Payment failure recorded.' });
    } catch (error) {
        console.error('Error notify payment failure:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
}

const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentDetails } = req.body;

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentDetails;

        // Generate the expected signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, msg: "Invalid signature. Payment verification failed." });
        }

        // Update order as paid
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, msg: "Order not found." });
        }

        order.paymentStatus = "Completed";
        order.paymentId = razorpay_payment_id; // Store Razorpay Payment ID
        await order.save();

        // Clear cart after successful payment
        await Cart.updateOne({ user: req.user.id }, { items: [] });

        return res.status(200).json({ success: true, msg: "Payment verified successfully." });
    } catch (error) {
        console.error("Error verifying payment:", error.message);
        res.status(500).json({ success: false, msg: "Internal server error." });
    }
};

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (order.paymentStatus !== "Failed") {
            return res.status(400).json({ success: false, message: "Payment is not in a failed state." });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: order.total * 100,
            currency: "INR",
            receipt: orderId,
        });

        // update new Razorpay order id
        order.razorpayOrderId = razorpayOrder.id;
        order.paymentStatus = "Pending"; 
        await order.save();

        res.status(200).json({
            success: true,
            paymentMethod: "Razorpay",
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: order.total * 100,
            currency: "INR",
            key: process.env.RAZORPAY_KEY_ID,
            name: "Your Store Name",
            description: "Retry Payment",
        });
    } catch (error) {
        console.error("Error retrying payment:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const loadOrderConfirmation = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const shippingAddress = order.shippingAddress;
        res.render('order-confirmation', { shippingAddress });
    } catch (error) {
        console.error('Error loading the order confirmation page:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
};//corrected


const loadMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        let orders = await Order.find({ user: userId }).populate('items.product').sort({ _id: -1 });

        // Filter out orders with any null products: when product deleted from the db
        orders = orders.filter(order =>
            order.items.every(item => item.product !== null)
        );

        res.render('my-orders', { orders });
    } catch (error) {
        console.error('Error loading the order confirmation page:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
};



const loadViewOrder = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const orderDetails = await Order.findById(orderId).populate('items.product');

        if (!orderDetails) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const shippingAddress = orderDetails.shippingAddress;
        const itemId = orderDetails.items[0] ? orderDetails.items[0]._id : null;  // first item id

        res.render('view-order', { orderDetails, shippingAddress, itemId });
    } catch (error) {
        console.error('Error loading the view-order page:', error.message);
        res.status(500).json({ success: false, msg: 'Failed to load view-order page' });
    }
};

const cancelOrderItem = async (req, res) => {
    try {
        const { itemId, orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const item = order.items.id(itemId);
        if (!item) {
            return res.status(404).json({ success: false, msg: 'Item not found' });
        }

        // status to cancelled
        item.status = 'Cancelled';

        const updatedTotal = order.items.reduce((acc, item) => {
            if (item.status !== 'Cancelled') {
                return acc + (item.discountPriceAtPurchase * item.quantity);
            }
            return acc;
        }, 0);

        const updatedSavings = order.items.reduce((acc, item) => {
            if (item.status !== 'Cancelled') {
                return acc + ((item.priceAtPurchase - item.discountPriceAtPurchase) * item.quantity);
            }
            return acc;
        }, 0);

        order.total = updatedTotal;
        await order.save();

        res.status(200).json({
            success: true,
            msg: 'Item cancelled successfully',
            updatedTotal,
            updatedSavings,
            deliveryCharges: order.deliveryCharges
        });
    } catch (error) {
        console.error('Error cancelling the item:', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
};


const changeOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        log(orderId + ' ' + status);

        const validStatuses = ['Pending', 'Processed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).send('Invalid status');
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // status of all items changed have to separate later
        order.items.forEach(item => {
            item.status = status;
        });

        await order.save();

        res.redirect(`/admin/order`);
    } catch (error) {
        console.error('Error updating order status:', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

const acceptReturnRequest = async (req, res) => {
    try {
        const { itemId, orderId } = req.body;

        if (!itemId || !orderId) {
            return res.status(400).json({ success: false, msg: 'Missing itemId or orderId' });
        }

        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const item = order.items.id(itemId);
        if (!item) {
            return res.status(404).json({ success: false, msg: 'Item not found' });
        }

        if (item.status !== 'Delivered') {
            return res.status(400).json({ success: false, msg: 'Item cannot be returned unless it is delivered' });
        }

        if (order.paymentStatus !== 'Completed') {
            return res.status(400).json({ success: false, msg: 'Refunds can only be processed for completed payments' });
        }

        item.status = 'Returned';

        const request = order.requests.find((req) => req.type === 'Return' && req.status === 'Pending');
        if (request) {
            request.status = 'Accepted';
        }

        order.is_returned = true;

        const refundAmount = item.discountPriceAtPurchase * item.quantity;

        const wallet = await Wallet.findOne({ user: order.user._id });
        if (wallet) {
            wallet.amount += refundAmount;
        } else {
            await Wallet.create({
                user: order.user._id,
                amount: refundAmount,
                orders: [order._id]
            });
        }

        if (wallet) {
            if (!wallet.orders.includes(order._id)) {
                wallet.orders.push(order._id);
            }
            await wallet.save();
        }

        const updatedTotal = order.items.reduce((acc, item) => {
            if (item.status !== 'Cancelled' && item.status !== 'Returned') {
                return acc + (item.discountPriceAtPurchase * item.quantity);
            }
            return acc;
        }, 0);

        const updatedSavings = order.items.reduce((acc, item) => {
            if (item.status !== 'Cancelled' && item.status !== 'Returned') {
                return acc + ((item.priceAtPurchase - item.discountPriceAtPurchase) * item.quantity);
            }
            return acc;
        }, 0);

        order.total = updatedTotal;
        await order.save();

        res.status(200).json({
            success: true,
            msg: 'Item returned successfully. Refund added to wallet.',
            refundAmount,
            walletAmount: wallet ? wallet.amount : refundAmount,
            updatedTotal,
            updatedSavings,
            deliveryCharges: order.deliveryCharges
        });
    } catch (error) {
        console.error('Error returning the item:', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
};

const returnOrderRequest = async (req, res) => {
    try {
        const { reason, orderId, itemId, comments } = req.body;

        if (!reason || !orderId || !itemId) {
            return res.status(400).json({ success: false, error: "Reason, orderId, and itemId are required" });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        const item = order.items.id(itemId);

        if (!item) {
            return res.status(404).json({ success: false, error: "Item not found in the order" });
        }

        // Check if a return request already exists for this item
        const existingRequest = order.requests.find(
            (request) => request.itemId.toString() === itemId && request.type === 'Return'
        );

        if (existingRequest) {
            return res.status(400).json({ success: false, error: "A return request already exists for this item" });
        }

        if (item.status !== 'Delivered') {
            return res.status(400).json({ success: false, error: "Return requests can only be made for delivered items" });
        }

        const newReturnRequest = {
            type: 'Return',
            status: 'Pending',
            reason,
            comments: comments || null,
            itemId: item._id, // Ensure item._id is properly assigned
        };

        order.requests.push(newReturnRequest);

        await order.save();

        res.json({ success: true, message: "Order return request submitted successfully" });
    } catch (error) {
        console.error('Error requesting return order:', error.message);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
};


module.exports = {
    loadCheckout,
    placeOrder,
    loadOrderConfirmation,
    loadMyOrders,
    loadViewOrder,
    cancelOrderItem,
    verifyPayment,
    changeOrderStatus,
    acceptReturnRequest,
    notifyPaymentFailure,
    retryPayment,
    returnOrderRequest
}