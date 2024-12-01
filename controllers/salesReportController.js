const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');

const loadSalesReport = async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            { $unwind: "$items" },

            // Lookup user details
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: false } },

            // Lookup product details
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: false } },

            // Match delivered items only
            {
                $match: {
                    "items.status": "Delivered",
                },
            },

            // Project required fields
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

        // Calculate totals
        let totalRegularPrice = 0;
        let totalSalesPrice = 0;

        salesData.forEach((sale) => {
            const regularPrice = sale.items.priceAtPurchase || 0;
            const discountPrice = sale.items.discountPriceAtPurchase || 0;

            totalRegularPrice += regularPrice * sale.items.quantity;
            totalSalesPrice += discountPrice * sale.items.quantity;
        });

        const totalDiscountPrice = totalRegularPrice - totalSalesPrice;

        // Render the sales report page
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


module.exports = {
    loadSalesReport
}