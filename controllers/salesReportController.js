const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');

const loadSalesReport = async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    "items.status": "Delivered",
                },
            },
            {
                $project: {
                    orderNumber: 1,
                    "userDetails.name": 1,
                    "productDetails.name": 1,
                    createdAt: 1,
                    paymentMethod: 1,
                    status: "$items.status",
                    couponDiscount: 1,
                    "items.quantity": 1,
                    "items.priceAtPurchase": 1,
                    "items.discountPriceAtPurchase": 1,
                },
            },
        ]);

        let totalRegularPrice = 0;
        let totalSalesPrice = 0;

        salesData.forEach((sale) => {
            const regularPrice = sale.items.priceAtPurchase || 0;
            const discountPrice = sale.items.discountPriceAtPurchase || 0;

            totalRegularPrice += regularPrice * sale.items.quantity;
            totalSalesPrice += discountPrice * sale.items.quantity;
        });

        const totalDiscountPrice = totalRegularPrice - totalSalesPrice;

        res.render("salesReport", {
            salesData,
            totalRegularPrice,
            totalSalesPrice,
            totalDiscountPrice,
        });
    } catch (error) {
        console.error("Error loading sales report:", error.message);
        res.status(500).json({ success: false, message: "Server error." });
    }
};


const customDateFilter = async (req, res, next) => {
    try {
        const { startingDate, endingDate } = req.body;

        if (!startingDate || !endingDate) {
            throw new Error("Both startingDate and endingDate are required.");
        }

        const startDate = new Date(startingDate);
        const endDate = new Date(endingDate);
        endDate.setHours(23, 59, 59, 999);

        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);

        const salesData = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    "items.status": "Delivered",
                },
            },
            {
                $project: {
                    orderNumber: 1,
                    "userDetails.name": 1,
                    "productDetails.name": 1,
                    createdAt: 1,
                    paymentMethod: 1,
                    status: "$items.status",
                    couponDiscount: 1,
                    "items.quantity": 1,
                    "items.priceAtPurchase": 1,
                    "items.discountPriceAtPurchase": 1,
                },
            },
        ]);

        let totalRegularPrice = 0;
        let totalSalesPrice = 0;

        salesData.forEach((sale) => {
            const regularPrice = sale.items.priceAtPurchase || 0;
            const discountPrice = sale.items.discountPriceAtPurchase || 0;

            totalRegularPrice += regularPrice * sale.items.quantity;
            totalSalesPrice += discountPrice * sale.items.quantity;
        });

        const totalDiscountPrice = totalRegularPrice - totalSalesPrice;

        res.render("salesReport", {
            salesData,
            totalRegularPrice,
            totalSalesPrice,
            totalDiscountPrice,
        });
    } catch (error) {
        console.error("Error in customDateFilter:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to filter sales data by custom date range.",
        });
        next(error);
    }
};


module.exports = {
    loadSalesReport,
    customDateFilter
}