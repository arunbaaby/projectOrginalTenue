const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
//to decrypt the password
const bcrypt = require('bcrypt');


const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const { generateAccessToken } = require('../utils/generateAccessToken');

//helpers
const { numOfOrders, totalRevenue, numOfProducts, numOfCategories, currentMonthRevenue, getDailySales, getWeeklySales, getMonthlySales, getYearlySales } = require('../helpers/dashBoardHelper');
const { getTopSellingCategories, getTopSellingProducts } = require('../helpers/bestSellingHelper');

const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin', { errors: [], msg: '' });
    } catch (error) {
        res.status(500).send('Server error');
    }
};


const adminLogin = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render('adminLogin', {
                success: false,
                msg: 'Validation errors',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(401).render('adminLogin', {
                success: false,
                msg: 'Invalid email or password',
                errors: []
            });
        }

        if (userData.is_admin === 0) {
            return res.status(401).render('adminLogin', {
                success: false,
                msg: 'Access denied',
                errors: []
            });
        }

        const passwordMatch = bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            return res.status(400).render('adminLogin', {
                success: false,
                msg: 'Invalid email or password',
                errors: []
            });
        }

        // Generate JWT token
        const accessToken = generateAccessToken(userData._id);

        // Set JWT token in cookie
        res.cookie('adminJwt', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 60 * 60 * 1000,
        });

        return res.redirect('/admin/home');
    } catch (error) {
        return res.status(400).render('adminLogin', {
            success: false,
            msg: error.message,
            errors: []
        });
    }
};

const adminLogout = async (req, res) => {
    try {
        // token save in the cookie in the name adminJwt
        res.clearCookie('adminJwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.redirect('/admin/');
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
        const orderCount = await numOfOrders();
        const revenue = await totalRevenue();
        const productCount = await numOfProducts();
        const categoryCount = await numOfCategories();
        const monthlyEarnings = await currentMonthRevenue();

        const dailySales = await getDailySales();
        const weeklySales = await getWeeklySales();
        const monthlySales = await getMonthlySales();
        const yearlySales = await getYearlySales();

        res.render('adminHome', {
            orderCount,
            revenue,
            productCount,
            categoryCount,
            monthlyEarnings,
            dailyLabels: dailySales.labels,
            dailyData: dailySales.data,
            weeklyLabels: weeklySales.labels, // Assuming similar structure for weeklySales
            weeklyData: weeklySales.data,
            monthlyLabels: monthlySales.labels,
            monthlyData: monthlySales.data,
            yearlyLabels: yearlySales.labels,
            yearlyData: yearlySales.data
        });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const loadBestSelling = async (req, res) => {
    try {
        const bestSellingProducts = await getTopSellingProducts();
        const bestSellingCategories = await getTopSellingCategories();

        res.render('best-selling', {
            bestSellingProducts,
            bestSellingCategories
        });
    } catch (error) {
        console.error('Error loading best selling :', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const userList = async (req, res) => {
    try {
        const query = String(req.query.q || '');

        const filter = {
            name: { $regex: query, $options: 'i' },
            is_admin: { $eq: 0 }
        };

        const userData = await User.find(filter);
        res.render('userList', { users: userData });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

// Function to block a user
const blockUser = async (req, res) => {
    try {
        const user_id = req.params.user_id; // Ensure correct parameter name
        await User.findByIdAndUpdate(user_id, { is_blocked: 1 }); // Update is_blocked to 1
        res.redirect('/admin/customers');
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};

// Function to unblock a user
const unblockUser = async (req, res) => {
    try {
        const user_id = req.params.user_id; // Ensure correct parameter name
        await User.findByIdAndUpdate(user_id, { is_blocked: 0 }); // Update is_blocked to 0
        res.redirect('/admin/customers');
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};

const loadCategory = async (req, res) => {
    try {
        const query = String(req.query.q || '');
        const currentPage = parseInt(req.query.page) || 1;

        const filter = {
            name: { $regex: query, $options: 'i' }
        }

        const category = await Category.find(filter).sort({ _id: -1 });

        return res.status(200).render('category', {
            category,
            query,
            currentPage,
            success: true,
            msg: ''
        });
    } catch (error) {
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
        const limit = 18;
        const currentPage = Math.max(page, 1);

        let filter = {};

        // search query
        if (query && query.toLowerCase() !== 'all') {
            const users = await User.find({ name: { $regex: new RegExp(query, 'i') } });
            const userIDs = users.map(user => user._id);

            if (userIDs.length > 0) {
                filter.user = { $in: userIDs };
            } else if (['Delivered', 'Pending', 'Processing', 'Shipped', 'Cancelled', 'Returned'].includes(query)) {
                filter.items = { $elemMatch: { status: query } };
            } else if (query.toLowerCase() === 'pending-returns') {
               filter['requests.status'] = 'Pending';
            }  else {
                filter.orderNumber = query;
            }
        }

        const { startingDate, endingDate } = req.query;
        if (startingDate || endingDate) {
            filter.createdAt = {};
            if (startingDate) {
                const start = new Date(startingDate);
                start.setUTCHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }
            if (endingDate) {
                const end = new Date(endingDate);
                end.setUTCHours(23, 59, 59, 999); 
                filter.createdAt.$lte = end;
            }
        }


        const totalOrders = await Order.countDocuments(filter);
        const totalPages = totalOrders > 0 ? Math.ceil(totalOrders / limit) : 1;
        const skip = (Math.min(currentPage, totalPages) - 1) * limit;

        let orders = [];

        if (totalOrders > 0) {
            orders = await Order.find(filter)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limit)
                .populate({ path: 'user', select: 'name' })
                .lean();

            orders = orders.filter(order => order.user !== null);
        }

        // Count of pending return requests
        const pendingReturnCount = await Order.countDocuments({
            'requests.status': 'Pending',
        });

        res.render('adminOrders', {
            order: orders,
            currentPage,
            totalPages,
            query,
            startingDate: startingDate || '',
            endingDate: endingDate || '',
            pendingReturnCount
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send('Internal Server Error');
    }
};



const loadAdminOrderDetails = async (req, res) => {
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
    loadAdminOrderDetails,
    loadBestSelling
}