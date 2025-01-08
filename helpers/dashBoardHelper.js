const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const numOfOrders = async () => {
    try {
        const countOrders = await Order.countDocuments({ "items.status": { $ne: 'Cancelled' } });
        return countOrders || 0;
    } catch (error) {
        throw new Error('Error counting active orders: ' + error.message);
    }
}

const totalRevenue = async () => {
    try {
        const revenue = await Order.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        ]);
        return revenue[0]?.totalRevenue || 0;
    } catch (error) {
        throw new Error('Error calculating total revenue: ' + error.message);
    }
};

const numOfProducts = async () => {
    try {
        const countProducts = await Product.countDocuments();
        return countProducts || 0;
    } catch (error) {
        throw new Error('Error counting number of products: ' + error.message);
    }
}
const numOfCategories = async () => {
    try {
        const countCategories = await Category.countDocuments();
        return countCategories || 0;
    } catch (error) {
        throw new Error('Error counting number of Categories: ' + error.message);
    }
}

const currentMonthRevenue = async () => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); 

        const revenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'Completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$total' }
                }
            }
        ]);

        return revenue[0]?.totalEarnings || 0;
    } catch (error) {
        throw new Error('Error calculating current month revenue: ' + error.message);
    }
};

module.exports = {
    numOfOrders,
    totalRevenue,
    numOfProducts,
    numOfCategories,
    currentMonthRevenue
}