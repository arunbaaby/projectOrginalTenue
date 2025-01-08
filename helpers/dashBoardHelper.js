const Order = require('../models/orderModel');

const numOfOrders = async () => {
    try {
        const countOrders = await Order.countDocuments({ "items.status": { $ne: 'Cancelled' } });
        return countOrders;
    } catch (error) {
        throw new Error('Error counting active orders: ' + error.message);
    }
}

module.exports = {
    numOfOrders
}