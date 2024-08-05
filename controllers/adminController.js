const User = require('../models/userModel');

//to decrypt the password
const bcrypt = require('bcrypt');


const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error);

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
        console.log('Request Body:', req.body); // Log the request body
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

        console.log('Comparing passwords:', password, userData.password); // Log passwords
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            console.log('Password mismatch');
            return res.status(400).render('adminLogin', {
                success: false,
                msg: 'Invalid email or password',
                errors: []
            });
        }

        const accessToken = await generateAccessToken({ user: userData });
        console.log('Login successful:', email);
        return res.status(200).json({
            success: true,
            msg: 'Login successful',
            user: userData,
            accessToken: accessToken,
            tokenType: 'Bearer'
        });

    } catch (error) {
        console.log('Login error:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};




const generateAccessToken = async (user) => {
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
    return token;
}



module.exports = {
    loadLogin,
    adminLogin
}