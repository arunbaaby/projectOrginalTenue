const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');

const getNewArrivals = async () => {
    const THIRTY_DAYS_AGO = new Date();
    THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30); 

    try {
        const newArrivals = await Product.find({is_active: true})
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
        const featuredProducts = await Product.find({is_active: true})
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
        const productsWithMostDiscount = await Product.find({is_active: true})
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
            { $limit: 8 },
            {
                $lookup: {
                    from: "products", // Lookup details from the products collection
                    let: { productId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
                        { $match: { is_active: true } } // Ensure product is active
                    ],
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

const getRecommendedProducts = async (productId, limit = 5) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        const recommendedProducts = await Product.find({
            _id: { $ne: productId }, 
            category: product.category, 
            brand: product.brand, 
            is_active: true, 
            stock: { $gt: 0 } 
        })
        .limit(limit) 
        .select("name images price discountPrice stock") 
        .lean();

        return recommendedProducts;
    } catch (error) {
        console.error("Error fetching recommended products:", error);
        return [];
    }
};

module.exports = {
    getNewArrivals,
    getNewCategoriesWithLatestProducts,
    getFeaturedProducts,
    getProductsWithMostDiscount,
    getMostSoldProducts,
    getRecommendedProducts
}
