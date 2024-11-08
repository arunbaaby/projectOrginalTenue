const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
//to decrypt the password
const bcrypt = require('bcrypt');


const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin',{errors:[],msg:''});
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}

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
                errors: [] // No validation errors here
            });
        }

        if (userData.is_admin === 0) {
            console.log('User is not admin');
            return res.status(401).render('adminLogin', {
                success: false,
                msg: 'Access denied', 
                errors: [] // No validation errors here
            });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            console.log('Password mismatch');
            return res.status(400).render('adminLogin', {
                success: false,
                msg: 'Invalid email or password', 
                errors: [] // No validation errors here
            });
        }

        // Generate JWT token
        const accessToken = await generateAccessToken({ id: userData._id });

        // Set JWT token in cookie
        res.cookie('jwt', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 2 * 60 * 60 * 1000, // 2 hours
        });

        console.log('Login successful:', email);

        return res.redirect('/admin/home');
    } catch (error) {
        console.log('Login error:', error.message);

        return res.status(400).render('adminLogin', {
            success: false,
            msg: error.message, 
            errors: [] // No validation errors in this case
        });
    }
};





const generateAccessToken = async (user) => {
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
    return token;
}


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

        res.render('adminOrders', { orders });
    } catch (error) {
        console.log('adminOrder loading error:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};


module.exports = {
    loadLogin,
    adminLogin,
    loadHome,
    userList,
    blockUser,
    unblockUser,
    loadCategory,
    loadOrderAdmin
}