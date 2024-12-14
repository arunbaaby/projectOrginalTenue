const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const ProductOffer = require('../models/productOfferModel');
const CategoryOffer = require('../models/categoryOfferModel');

const calculateAndApplyOffer = async (productId, categoryId) => {
    try {
        const product = await Product.findById(productId).populate('category');
        const category = await Category.findById(categoryId);

        if (!product) {
            throw new Error("Product not found.");
        }

        if (!category) {
            throw new Error("Category not found.");
        }

        const currentDate = new Date();

        const productOffers = await ProductOffer.find({
            "productOffer.product": productId,
            "productOffer.offerStatus": true,
            startingDate: { $lte: currentDate },
            endingDate: { $gte: currentDate }
        });

        const categoryOffers = await CategoryOffer.find({
            "categoryOffer.category": categoryId,
            "categoryOffer.offerStatus": true,
            startingDate: { $lte: currentDate },
            endingDate: { $gte: currentDate },
            is_active:true
        });

        let productDiscount = 0;
        let categoryDiscount = 0;

        if (productOffers.length > 0) {
            productDiscount = productOffers[0].productOffer.discount || 0;
        }

        if (categoryOffers.length > 0) {
            categoryDiscount = categoryOffers[0].categoryOffer.discount || 0;
        }

        const bestDiscount = Math.max(productDiscount, categoryDiscount);
        const discountedPrice = bestDiscount > 0
            ? product.price - (product.price * (bestDiscount / 100))
            : product.baseDiscountPrice; // back to the basediscount

        product.discountPrice = Math.max(0, discountedPrice); //non-negative
        await product.save();

        return product;

    } catch (error) {
        console.error('Error removing coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

module.exports = {
    calculateAndApplyOffer
}
