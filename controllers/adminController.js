const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
//to decrypt the password
const bcrypt = require('bcrypt');


const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const {generateAccessToken} = require('../utils/generateAccessToken');

const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin', { errors: [], msg: '' });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};


const adminLogin = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).render('adminLogin', {
                success: false,
                msg: 'Validation errors',
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;
        console.log('Request Body:', req.body);
        console.log('Login attempt:', email);

        const userData = await User.findOne({ email });
        if (!userData) {
            console.log('User not found');
            return res.status(401).render('adminLogin', {
                success: false,
                msg: 'Invalid email or password',
                errors: []
            });
        }

        if (userData.is_admin === 0) {
            console.log('User is not admin');
            return res.status(401).render('adminLogin', {
                success: false,
                msg: 'Access denied',
                errors: []
            });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            console.log('Password mismatch');
            return res.status(400).render('adminLogin', {
                success: false,
                msg: 'Invalid email or password',
                errors: []
            });
        }

        // Generate JWT token
        const accessToken = await generateAccessToken({ id: userData._id });
        console.log('admin login token :', accessToken);

        // Set JWT token in cookie
        res.cookie('jwt', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 60 * 60 * 1000,
        });

        return res.redirect('/admin/home');
    } catch (error) {
        console.log('Login error:', error.message);
        return res.status(400).render('adminLogin', {
            success: false,
            msg: error.message,
            errors: []
        });
    }
};

const adminLogout = async(req,res)=>{
    try {
        // Clear the JWT cookie
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.redirect('/admin/login');
    } catch (error) {
        console.error('Logout Error Admin :', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}






// const generateAccessToken = async (user) => {
//     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
//     return token;
// }


const loadHome = async (req, res) => {
    try {
        res.render('adminHome');
    } catch (error) {
        console.log(error);

    }
}

const userList = async(req,res)=>{
    try {
        const userData = await User.find({is_admin:0});
        res.render('userList',{users:userData});
    } catch (error) {
        console.log(error);
        
    }
}

// Function to block a user
const blockUser = async (req, res) => {
    try {
        const user_id = req.params.user_id; // Ensure correct parameter name
        await User.findByIdAndUpdate(user_id, { is_blocked: 1 }); // Update is_blocked to 1
        console.log(`User with ID ${user_id} blocked successfully.`);
        res.redirect('/admin/customers');
    } catch (error) {
        console.log('Error blocking user:', error.message);
        res.status(500).send('Error blocking user');
    }
};

// Function to unblock a user
const unblockUser = async (req, res) => {
    try {
        const user_id = req.params.user_id; // Ensure correct parameter name
        await User.findByIdAndUpdate(user_id, { is_blocked: 0 }); // Update is_blocked to 0
        console.log(`User with ID ${user_id} unblocked successfully.`);
        res.redirect('/admin/customers');
    } catch (error) {
        console.log('Error unblocking user:', error.message);
        res.status(500).send('Error unblocking user');
    }
};

const loadCategory = async(req,res)=>{
    try {
        const category = await Category.find({});
        return res.status(200).render('category', {
            category,
            success: true,
            msg: ''
        });
    } catch (error) {
        console.log('Category loading error:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

const loadOrderAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = req.query.q || 'All';
        const limit = 18; // Max number of items per page
        const currentPage = Math.max(page, 1);

        let filter = {};

        if (query && query.toLowerCase() !== 'all') {
            const users = await User.find({ name: { $regex: new RegExp(query, 'i') } });
            const userIDs = users.map(user => user._id);

            if (userIDs.length > 0) {
                filter.user = { $in: userIDs };
            } else if (['Delivered', 'Pending', 'Processing', 'Shipped', 'Cancelled', 'Returned'].includes(query)) {
                filter.items = { $elemMatch: { status: query } };
            } else {
                // Search by order number
                filter.orderNumber = query;
            }
        }

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = totalOrders > 0 ? Math.ceil(totalOrders / limit) : 1;
        const skip = (Math.min(currentPage, totalPages) - 1) * limit;

        let orders = [];

        //if the orders are empty we can avoid these queries
        if (totalOrders > 0) {
            orders = await Order.find(filter)
                .skip(skip)
                .limit(limit)
                .populate({ path: 'user', select: 'name' })
                .lean();
            
            // Filter out orders with a null user field becuase the if the user data is deleted form the DB
            orders = orders.filter(order => order.user !== null);
        }

        res.render('adminOrders', {
            order: orders,
            currentPage,
            totalPages,
            query,
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send('Internal Server Error');
    }
};


const loadAdminOrderDetails = async(req,res)=>{
    try {
        const orderId = req.query.id;

        const order = await Order.findById(orderId)
        .populate('user')
        .populate('items.product') // Populate product details
        .exec();

    if (!order) {
        return res.status(404).send('Order not found');
    }

    res.render('adminOrderDetails', { order });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    loadLogin,
    adminLogin,
    adminLogout,
    loadHome,
    userList,
    blockUser,
    unblockUser,
    loadCategory,
    loadOrderAdmin,
    loadAdminOrderDetails
}