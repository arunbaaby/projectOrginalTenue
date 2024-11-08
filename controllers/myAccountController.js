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

const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.params.id;
        console.log(addressId);

        // Find the user and remove the address with the given ID
        await Address.updateOne(
            { user: req.user.id },
            { $pull: { addresses: { _id: addressId } } }
        );

        res.redirect('/my-account');
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

        res.redirect('/my-account');
    } catch (error) {
        console.error('Error editing the address:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

module.exports = {
    myAccountLoad,
    addAddress,
    deleteAddress,
    editAddress
}