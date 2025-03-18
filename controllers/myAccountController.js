const bcrypt = require('bcrypt');

const Address = require('../models/addressModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Wallet = require('../models/walletModel');


const myAccountLoad = async (req, res) => {
    try {
        const userId = req.user?.id;
        let userLogged = false;

        if (!userId) {
            return res.redirect('/auth');
            // return res.render('my-account', { user: null, userAddresses: null, cart: { items: [] }, subtotal: 0, wallet: { amount: 0, transactions: [] }, transactions: [] });
        }

        if(userId){
            userLogged = true;
        }

        let cart = await Cart.findOne({ user: userId }).populate('items.product') || { items: [] };

        cart.items = cart.items.filter(item => item.product);
        let subtotal = cart.items.reduce((acc, item) => {
            const productPrice = item.product.discountPrice ?? item.product.price ?? 0;
            return acc + (productPrice * item.quantity);
        }, 0);

        let wallet = await Wallet.findOne({ user: userId }).populate('transactions.order') || { amount: 0, transactions: [] };

        let transactions = wallet.transactions.map(tx => ({
            type: tx.type,
            date: tx.date,
            description: tx.description || (tx.type === 'Credit' ? 'Wallet Credit' : 'Wallet Debit'),
            amount: tx.amount
        }));

        const user = await User.findById(userId);
        const userAddresses = await Address.findOne({ user: userId });

        res.render('my-account', {
            user,
            userAddresses,
            cart,
            subtotal,
            wallet,
            transactions,
            userLogged 
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};


const addAddress = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            addressType
        } = req.body;

        const userId = req.user.id;

        let userAddress = await Address.findOne({ user: userId });

        // Create the new address object
        const newAddress = {
            firstName,
            lastName,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            addressType
        };

        if (userAddress) {
            // Check if there are already 3 addresses
            if (userAddress.addresses.length >= 3) {
                return res.status(400).json({
                    success: false,
                    msg: 'You can only have a maximum of 3 addresses.'
                });
            }
            userAddress.addresses.push(newAddress);
        } else {
            userAddress = new Address({
                user: userId,
                addresses: [newAddress]
            });
        }

        await userAddress.save();
        // Determine response based on AJAX request
        if (req.xhr) {
            return res.status(200).json({
                success: true,
                msg: 'Address added successfully.',
                data: userAddress.addresses[userAddress.addresses.length - 1]
            });
        } else {
            res.redirect(req.headers.referer || '/my-account');
        }
    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        // Find the user and remove the address with the given ID
        const result = await Address.updateOne(
            { user: req.user.id },
            { $pull: { addresses: { _id: addressId } } }
        );

        if (req.xhr) {  // Check if it's an AJAX request
            return res.status(200).json({ success: true, msg: 'Address deleted successfully.' });
        } else {
            // Regular request, redirect back to the referer or to the account page
            res.redirect(req.headers.referer || '/my-account');
        }
    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}


const editAddress = async(req,res)=>{
    try {
        const addressId = req.params.id;
        const userId = req.user.id;
        const { firstName, lastName, houseNo, street, landmark, city, district, state, pincode } = req.body;

        await Address.updateOne(
            { user: userId, 'addresses._id': addressId },
            {
                $set: {
                    'addresses.$.firstName': firstName,
                    'addresses.$.lastName': lastName,
                    'addresses.$.houseNo': houseNo,
                    'addresses.$.street': street,
                    'addresses.$.landmark': landmark,
                    'addresses.$.city': city,
                    'addresses.$.district': district,
                    'addresses.$.state': state,
                    'addresses.$.pincode': pincode
                }
            }
        );

        if (req.xhr) { // Handle AJAX request
            return res.status(200).json({ success: true, msg: 'Address updated successfully.' });
        } else {
            res.redirect(req.headers.referer || '/my-account');
        }
        
    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

const editUserProfile = async (req, res) => {
    try {
        const { name, email, mobile, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/my-account?message=User not found');
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (mobile) user.mobile = mobile;

        if (newPassword && confirmPassword) {
            if (newPassword !== confirmPassword) {
                return res.redirect('/my-account?message=Passwords do not match');
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.redirect('/my-account?message=Account details updated successfully');

    } catch (error) {
        res.status(500).redirect(`/my-account?message=${encodeURIComponent(error.message)}`);
    }
};


module.exports = {
    myAccountLoad,
    addAddress,
    deleteAddress,
    editAddress,
    editUserProfile
}