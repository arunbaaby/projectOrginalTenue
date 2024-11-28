const bcrypt = require('bcrypt');

const Address = require('../models/addressModel');
const User = require('../models/userModel');


const myAccountLoad = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.render('my-account', { user: null, userAddresses: null });
        }
        const user = await User.findById(userId)
        const userAddresses = await Address.findOne({ user:userId });

        res.render('my-account', { user, userAddresses });
    } catch (error) {
        console.error('My account load error:', error.message);
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
        console.error('Error adding the address:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        console.log('Address ID:', addressId);

        // Find the user and remove the address with the given ID
        const result = await Address.updateOne(
            { user: req.user.id },
            { $pull: { addresses: { _id: addressId } } }
        );

        if (req.xhr) {  // Check if it's an AJAX request
            console.log('AJAX request detected');
            return res.status(200).json({ success: true, msg: 'Address deleted successfully.' });
        } else {
            // Regular request, redirect back to the referer or to the account page
            console.log('Redirecting after delete');
            res.redirect(req.headers.referer || '/my-account');
        }
    } catch (error) {
        console.error('Error deleting the address:', error.message);
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
        console.error('Error editing the address:', error.message);
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
        console.error('Error editing user profile:', error.message);
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