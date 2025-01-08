const Order = require('../models/orderModel');

const numOfOrders = async () => {
    try {
        const countOrders = await Order.countDocuments({ "items.status": { $ne: 'Cancelled' } });
        return countOrders;
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

module.exports = {
    numOfOrders,
    totalRevenue
}