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
            return res.status(400).json('no items in the cart');
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
        
        // console.log(selectedAddress);
        // console.log('Payment method '+paymentMethod);
        
        

        // Check if the cart is empty
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, message: 'No items in the cart to place order' });
        }

        console.log(cart.items[0].product.name);

        

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
        
        // Define or fetch the delivery charge (for example, a fixed charge of 50)
        const deliveryCharge = 50; // Adjust this as needed or fetch from a settings/config model
        const total = itemsTotal + deliveryCharge;

        const orderNumber = await generateUniqueOrderNumber();

        const newOrder = new Order({
            user: userId,
            items: orderItems,
            shippingAddress:selectedAddress,
            total,
            orderNumber,
            paymentMethod,
            paymentStatus: 'Pending'
        });

        console.log(newOrder);
        
        await newOrder.save();

        await Cart.updateOne({ user: userId }, { items: [] });

        res.redirect(`/order-confirmation?selectedAddress=${selectedAddress}`);





        

        // let shippingAddress;

        // if (isNewAddress === 'true') {
        //     // Normalize the new address for consistent storage and comparison
        //     const newAddress = normalizeAddress(req.body);

        //     // Check if the normalized new address already exists
        //     const userAddresses = await Address.findOne({ user: userId });
        //     const addressExists = userAddresses.addresses.some(existingAddress => {
        //         const normalizedExisting = normalizeAddress(existingAddress);
        //         return (
        //             normalizedExisting.street === newAddress.street &&
        //             normalizedExisting.city === newAddress.city &&
        //             normalizedExisting.pincode === newAddress.pincode &&
        //             normalizedExisting.houseNo === newAddress.houseNo
        //         );
        //     });//return true or false

        //     if (!addressExists) {
        //         // Save the new address if it doesn't exist
        //         const updatedAddressDoc = await Address.findOneAndUpdate(
        //             { user: userId },
        //             { $push: { addresses: newAddress } },
        //             { new: true }
        //         );
        //         shippingAddress = updatedAddressDoc.addresses[updatedAddressDoc.addresses.length - 1];
        //     } else {
        //         return res.status(400).json({ success: false, message: 'This address already exists.' });
        //     }
        // } else {
        //     // Use selected existing address
        //     const userAddresses = await Address.findOne({ user: userId });
        //     shippingAddress = userAddresses.addresses.find(addr => addr._id.toString() === selectedAddress);
        // }

        

        // const total = orderItems.reduce((sum, item) => sum + item.discountPriceAtPurchase * item.quantity, 0);
        // const orderNumber = await generateUniqueOrderNumber();

        // const newOrder = new Order({
        //     user: userId,
        //     items: orderItems,
        //     shippingAddress,
        //     total,
        //     orderNumber,
        //     paymentMethod: 'Cash on Delivery',
        //     paymentStatus: 'Pending'
        // });
        // await newOrder.save();

        // // Clear the cart
        // await Cart.updateOne({ user: userId }, { items: [] });

        // res.json({ success: true, message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Error placing order:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
};


const loadOrderConfirmation = async(req,res)=>{
    try {
        const selectedAddress =  req.query.selectedAddress;
        console.log('order confirm page :'+selectedAddress);

        const userAddress = await Address.findOne({
            addresses: { $elemMatch: { _id: selectedAddress } }
        });

        const shippingAddress = userAddress ? userAddress.addresses.find(addr => addr._id.toString() === selectedAddress) : null;

        console.log(shippingAddress);
        
        
        // const userAddresses = await Address.findOne({ user: userId }) || null;
        res.render('order-confirmation',{shippingAddress});
    } catch (error) {
        console.error('Error loading the order confirmation page:', error.message);
        res.status(500).json({ success: false, msg: error.message });
    }
}

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
        console.log('orderId:', orderId);

        const orderDetails = await Order.findById(orderId).populate('items.product');
        if (!orderDetails) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        // Retrieve the address document associated with the user
        const addressDocument = await Address.findOne({ user: orderDetails.user });
        if (!addressDocument) {
            return res.status(404).json({ success: false, msg: 'Address not found' });
        }

        // address matching the order's shipping address ID
        const shippingAddress = addressDocument.addresses.find(
            (address) => address._id.equals(orderDetails.shippingAddress)
        );
        if (!shippingAddress) {
            return res.status(404).json({ success: false, msg: 'Shipping address not found' });
        }

        console.log("Shipping Address:", shippingAddress);

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

        // status updadte to 'Cancelled'
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

        // Update the order total and save the changes
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