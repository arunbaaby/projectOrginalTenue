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

const getDailySales = async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(startOfDay - 6 * 24 * 60 * 60 * 1000);

    const dailySalesData = await Order.aggregate([
        {
            $match: {
                paymentStatus: "Completed",
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const dailyLabels = [];
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today - i * 24 * 60 * 60 * 1000);
        const dateString = date.toISOString().split("T")[0];
        dailyLabels.push(dateString);
        const salesRecord = dailySalesData.find(record => record._id === dateString);
        dailyData.push(salesRecord ? salesRecord.totalSales : 0);
    }

    return { labels: dailyLabels, data: dailyData };
};

const getWeeklySales = async () => {
    const today = new Date();
    const twelveWeeksAgo = new Date(today - 12 * 7 * 24 * 60 * 60 * 1000);

    const weeklySalesData = await Order.aggregate([
        {
            $match: {
                paymentStatus: "Completed",
                createdAt: { $gte: twelveWeeksAgo }
            }
        },
        {
            $group: {
                _id: { $isoWeek: "$createdAt" },
                totalSales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const weeklyLabels = [];
    const weeklyData = [];
    for (let i = 12; i >= 0; i--) {
        const weekDate = new Date(today - i * 7 * 24 * 60 * 60 * 1000);
        const monthName = weekDate.toLocaleString('default', { month: 'short' });
        const weekNumber = getWeekNumberOfMonth(weekDate);
        weeklyLabels.push(`${monthName} ${weekNumber}${getWeekSuffix(weekNumber)} week`);
        const salesRecord = weeklySalesData.find(record => record._id === getWeekNumber(weekDate));
        weeklyData.push(salesRecord ? salesRecord.totalSales : 0);
    }

    return { labels: weeklyLabels, data: weeklyData };
};

const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const getWeekNumberOfMonth = (date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const pastDaysOfMonth = (date - firstDayOfMonth) / 86400000;
    return Math.ceil((pastDaysOfMonth + firstDayOfMonth.getDay() + 1) / 7);
};

const getWeekSuffix = (weekNumber) => {
    if (weekNumber === 1) return "st";
    if (weekNumber === 2) return "nd";
    if (weekNumber === 3) return "rd";
    return "th";
};


const getMonthlySales = async () => {
    const today = new Date();

    const monthlySalesData = await Order.aggregate([
        {
            $match: {
                paymentStatus: "Completed",
                createdAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 11, 1) }
            }
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalSales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const monthlyLabels = [];
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString("default", { month: "short" });
        monthlyLabels.push(monthName);
        const salesRecord = monthlySalesData.find(record => record._id === monthDate.getMonth() + 1);
        monthlyData.push(salesRecord ? salesRecord.totalSales : 0);
    }

    return { labels: monthlyLabels, data: monthlyData };
};

const getYearlySales = async () => {
    const today = new Date();

    const yearlySalesData = await Order.aggregate([
        {
            $match: {
                paymentStatus: "Completed",
                createdAt: { $gte: new Date(today.getFullYear() - 5, 0, 1) }
            }
        },
        {
            $group: {
                _id: { $year: "$createdAt" },
                totalSales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const yearlyLabels = [];
    const yearlyData = [];
    for (let i = 5; i >= 0; i--) {
        const year = today.getFullYear() - i;
        yearlyLabels.push(`${year}`);
        const salesRecord = yearlySalesData.find(record => record._id === year);
        yearlyData.push(salesRecord ? salesRecord.totalSales : 0);
    }

    return { labels: yearlyLabels, data: yearlyData };
};


module.exports = {
    numOfOrders,
    totalRevenue,
    numOfProducts,
    numOfCategories,
    currentMonthRevenue,
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getYearlySales
}