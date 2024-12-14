const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');

const getNewArrivals = async () => {
    const THIRTY_DAYS_AGO = new Date();
    THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30); 

    try {
        const newArrivals = await Product.find({
            createdAt: { $gte: THIRTY_DAYS_AGO }, 
            is_active: true 
        })
        .sort({ createdAt: -1 }) 
        .limit(8); 

        return newArrivals;
    } catch (error) {
        console.error("Error fetching new arrivals:", error.message);
        throw error;
    }
};

const getNewCategoriesWithLatestProducts = async () => {
    try {
        const newCategories = await Category.find({ is_active: true }).sort({ createdAt: -1 });

        const categoriesWithLatestProducts = await Promise.all(
            newCategories.map(async (category) => {
                const latestProduct = await Product.findOne({ category: category._id, is_active: true })
                    .sort({ createdAt: -1 }); 
                return latestProduct ? { category, latestProduct } : null;
            })
        );

        const limitedResults = categoriesWithLatestProducts.filter(Boolean).slice(0, 5);

        return limitedResults;
    } catch (error) {
        console.error("Error fetching categories with latest products:", error.message);
        throw error;
    }
};

//based on pro with most stock
const getFeaturedProducts = async () => {
    try {
        const featuredProducts = await Product.find()
            .sort({ stock: -1 }) 
            .limit(10)           

        return featuredProducts;
    } catch (error) {
        console.error('Error fetching top stock products:', error);
        throw error; 
    }
};

const getProductsWithMostDiscount = async () => {
    try {
        const productsWithMostDiscount = await Product.find()
            .sort({ 
                discountPrice: 1 
            })
            .limit(8) 

        return productsWithMostDiscount;
    } catch (error) {
        console.error('Error fetching products with the most discount:', error);
        throw error; 
    }
};


const getMostSoldProducts = async () => {
    try {
        const result = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product", //product sold in different order documents grouped using proId
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products", // details from product model
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            // lookup returns an array
            { $unwind: "$productDetails" },
            {
                $project: {
                    productId: "$_id",
                    totalQuantity: 1,
                    productName: "$productDetails.name",
                    images: "$productDetails.images",
                    price: "$productDetails.price",
                    discountPrice : "$productDetails.discountPrice"
                }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Error fetching most sold products:', error);
        throw error;
    }
};


module.exports = {
    getNewArrivals,
    getNewCategoriesWithLatestProducts,
    getFeaturedProducts,
    getProductsWithMostDiscount,
    getMostSoldProducts
}
