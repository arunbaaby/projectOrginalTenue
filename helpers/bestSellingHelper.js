const Order = require('../models/orderModel');

const getTopSellingProducts = async () => {
    try {
        const topSellingProducts = await Order.aggregate([
            { $unwind: "$items" }, // Deconstruct the items array
            {
                $group: {
                    _id: "$items.product", // Group by product ID
                    totalSold: { $sum: "$items.quantity" } // Sum up quantities
                }
            },
            {
                $lookup: {
                    from: "products", // Replace with the actual Product collection name
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }, // Unwind product details
            {
                $lookup: {
                    from: "categories", // Replace with the actual Category collection name
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" }, // Unwind category details
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    name: "$productDetails.name",
                    image: { $arrayElemAt: ["$productDetails.images", 0] }, // Get the first image
                    count: "$totalSold",
                    categoryName: "$categoryDetails.name"
                }
            },
            { $sort: { count: -1 } }, // Sort by count in descending order
            { $limit: 10 } // Get the top 10 products
        ]);

        return topSellingProducts || []; // Return the top 10 products or an empty array if none
    } catch (error) {
        throw new Error("Error getting top-selling products: " + error.message);
    }
};

const getTopSellingCategories = async () => {
    try {
        const topSellingCategories = await Order.aggregate([
            { $unwind: "$items" }, // Deconstruct the items array
            {
                $lookup: {
                    from: "products", // Replace with the actual Product collection name
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }, // Unwind product details
            {
                $lookup: {
                    from: "categories", // Replace with the actual Category collection name
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" }, // Unwind category details
            {
                $group: {
                    _id: "$categoryDetails._id", // Group by category ID
                    categoryName: { $first: "$categoryDetails.name" },
                    count: { $sum: "$items.quantity" } // Sum up quantities
                }
            },
            { $sort: { count: -1 } }, // Sort by count in descending order
            { $limit: 10 } // Get the top 10 categories
        ]);

        return topSellingCategories || []; // Return the top 10 categories or an empty array if none
    } catch (error) {
        throw new Error("Error getting top-selling categories: " + error.message);
    }
};

module.exports = {
    getTopSellingCategories,
    getTopSellingProducts
}