const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');


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

        res.render('checkout', { userAddresses, cart, user, items: cart.items });
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
        const { selectedAddress,paymentMethod } = req.body;

        // console.log(userId);
        
        console.log(selectedAddress);
        // console.log('Payment method '+paymentMethod);
        
        

        // Check if the cart is empty
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, message: 'No items in the cart to place order' });
        }

        // Find the user's address document and then the specific address within it
        const userAddresses = await Address.findOne({ user: userId });
        if (!userAddresses) {
            return res.status(400).json({ success: false, message: 'User addresses not found' });
        }

        const selectedAddressObj = userAddresses.addresses.find(addr => addr._id.toString() === selectedAddress);
        if (!selectedAddressObj) {
            return res.status(400).json({ success: false, message: 'Selected address not found' });
        }

        console.log(cart.items[0].product.name);

        console.log('selectedAddressObj: '+selectedAddressObj);
        

        // console.log(orderNumber);

        // Process order items and other details
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            discountPriceAtPurchase: item.product.discountPrice,
            size: item.size
        }));
        
        const itemsTotal = orderItems.reduce((sum, item) => sum + item.discountPriceAtPurchase * item.quantity, 0);
        
        const deliveryCharge = 50; 
        const total = itemsTotal + deliveryCharge;

        const orderNumber = await generateUniqueOrderNumber();

        // Check and update stock for each product
        for (const item of cart.items) {
            const product = item.product;

            // Check if there’s enough stock for the order quantity
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

        const newOrder = new Order({
            user: userId,
            items: orderItems,
            shippingAddress:selectedAddressObj,
            total,
            orderNumber,
            paymentMethod,
            paymentStatus: 'Pending'
        });

        console.log(newOrder);
        
        await newOrder.save();

        await Cart.updateOne({ user: userId }, { items: [] });

        res.redirect(`/order-confirmation?orderId=${newOrder._id}`);
    } catch (error) {
        console.error('Error placing order:', error.message);
        res.status(500).json({ success: false, msg: error.message });
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


const loadMyOrders = async(req,res)=>{
    try {
        const userId = req.user.id;
        const orders = await Order.find({user:userId}).populate('items.product');
        
        res.render('my-orders',{orders});
    } catch (error) {
        console.error('Error loading the order confirmation page:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
}

const loadViewOrder = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const orderDetails = await Order.findById(orderId).populate('items.product');

        if (!orderDetails) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const shippingAddress = orderDetails.shippingAddress; // Directly access the address
        res.render('view-order', { orderDetails, shippingAddress });
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







module.exports = {
    loadCheckout,
    placeOrder,
    loadOrderConfirmation,
    loadMyOrders,
    loadViewOrder,
    cancelOrderItem
}