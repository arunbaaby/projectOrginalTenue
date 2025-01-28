const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const ProductOffer = require('../models/productOfferModel');
const CategoryOffer = require('../models/categoryOfferModel');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');

const { validationResult } = require('express-validator');


//product offer 
const loadProductOffer = async (req, res) => {
    try {


        const productOfferData = await ProductOffer.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "productOffer.product",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            {
                $unwind: "$productDetails", // it's array
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    startingDate: 1,
                    endingDate: 1,
                    "productOffer.discount": 1,
                    "productOffer.offerStatus": 1,
                    "productDetails._id": 1,
                    "productDetails.name": 1,
                    "productDetails.brand": 1,
                    "productDetails.price": 1,
                    "productDetails.discountPrice": 1,
                    "productDetails.is_active": 1,
                },
            },
        ]);
        res.render('product-offer', { productOfferData });
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const loadAddProductOffer = async (req, res) => {
    try {
        const productData = await Product.find({}, { name: 1 }).lean();
        console.log("productData", productData);

        res.render('add-product-offer', { productData });
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const addProductOffer = async (req, res) => {
    try {
        const { name, startingDate, endingDate, products, productDiscount } = req.body;

        if (!name || !startingDate || !endingDate || !products || !productDiscount) {
            const productData = await Product.find({}, { name: 1 }).lean();
            return res.render('add-product-offer', { message: 'All fields are required.', productData });
        }

        let discount = parseFloat(productDiscount);

        if (isNaN(discount)) {
            throw new Error('Invalid discount value');
        }

        const newProductOffer = new ProductOffer({
            name,
            startingDate,
            endingDate,
            productOffer: {
                product: products,
                discount,
            },
        });

        await newProductOffer.save();

        res.redirect("/admin/add-product-offer");
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const deleteProductOffer = async (req, res) => {
    try {
        const { id } = req.query; // Offer ID from the query

        // Update the offer status to inactive
        await ProductOffer.findByIdAndUpdate(id, { 'productOffer.offerStatus': false });

        res.redirect('/admin/product-offer');
    } catch (error) {
        console.error('Error deactivating product offer:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};


const restoreProductOffer = async (req, res) => {
    try {
        const { id } = req.query; // Offer ID from the query

        // Update the offer status to active
        await ProductOffer.findByIdAndUpdate(id, { 'productOffer.offerStatus': true });

        res.redirect('/admin/product-offer');
    } catch (error) {
        console.error('Error reactivating product offer:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
};


const loadEditProductOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        const productId = req.query.prodId;

        const productOfferData = await ProductOffer.findById(offerId)
            .populate('productOffer.product')
            .lean();

        const productData = await Product.find({}, { name: 1 }).lean();

        if (!productOfferData || !productId) {
            return res.status(404).render('404', { message: "Product offer not found." });
        }
        res.render('edit-product-offer', { productOfferData, productData });
    } catch (error) {
        console.error('Error loading product offer edit page:', error.message);
        return res.status(500).render('500', { message: 'Server error occurred.' });
    }
};

const editProductOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        const { name, startingDate, endingDate, product, discount } = req.body;

        const updateResult = await ProductOffer.updateOne(
            { _id: offerId },
            {
                $set: {
                    name,
                    startingDate: new Date(startingDate),
                    endingDate: new Date(endingDate),
                    "productOffer.product": product,
                    "productOffer.discount": discount
                }
            }
        );

        if (updateResult.modifiedCount === 1) {
            res.redirect('/admin/product-offer');
        } else {
            console.error("Product offer not updated.");
            res.redirect('/admin/product-offer');
            // res.redirect(`/admin/edit-product-offer?id=${offerId}`);
        }
    } catch (error) {
        console.error('Error updating product offer:', error.message);
        res.status(500).json({ success: false, msg: 'Server error occurred.' });
    }
};









//offer

const loadCategoryOffer = async (req, res) => {
    try {
        const categoryOfferData = await CategoryOffer.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryOffer.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: "$categoryDetails"
            }
        ])

        res.render('category-offer', { categoryOfferData });
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const loadAddCategoryOffer = async (req, res) => {
    try {
        const categoryData = await Category.find({}, { name: 1 }).lean();
        res.render('add-category-offer', { categoryData });
        // res.send('add category offer');
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const addCategoryOffer = async (req, res) => {
    try {

        // Extract validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // If validation fails, send error messages
            return res.status(400).render('add-category-offer', {
                success: false,
                msg: 'Validation failed',
                errors: errors.array(), // Pass validation errors to the frontend
                oldData: req.body // Pass old input data for pre-filling the form
            });
        }

        const { name, startingDate, endingDate, category, categoryDiscount } = req.body;

        if (!name || !startingDate || !endingDate || !category || !categoryDiscount) {
            const categoryData = await Category.find({}, { name: 1 }).lean();
            return res.render('add-category-offer', { message: 'All fields are required.', categoryData });
        }

        let discount = parseFloat(categoryDiscount);

        if (isNaN(discount)) {
            throw new Error('Invalid category discount value');
        }

        const newCategoryOffer = new CategoryOffer({
            name,
            startingDate,
            endingDate,
            categoryOffer: {
                category,
                discount,
            },
        });

        await newCategoryOffer.save();
        res.redirect("/admin/category-offer");
    } catch (error) {
        console.error('Error adding category offer:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const deleteCategoryOffer = async (req, res) => {
    try {
        const { id } = req.query;
        // console.log("categoryid:",id);
        const updateCategoryOffer = await CategoryOffer.findByIdAndUpdate(id, { is_active: false });
        // console.log("updated :",updateCategoryOffer);
        res.redirect('/admin/category-offer');
    } catch (error) {
        console.error('Error deleting category offer:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}


const restoreCategoryOffer = async (req, res) => {
    try {
        const { id } = req.query;
        // console.log("categoryid:",id);
        const updateCategoryOffer = await CategoryOffer.findByIdAndUpdate(id, { is_active: true });
        // console.log("updated :",updateCategoryOffer);
        res.redirect('/admin/category-offer');
    } catch (error) {
        console.error('Error deleting category offer:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const loadEditCategoryOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        const offerDetails = await CategoryOffer.findById(offerId).populate('categoryOffer.category').lean();

        const categoryData = await Category.find({}, { name: 1 }).lean();

        res.render('edit-category-offer', { offerDetails, categoryData });
    } catch (error) {
        console.error('Error loading category offer for editing:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}


const editCategoryOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        const { name, startingDate, endingDate, category, categoryDiscount } = req.body;

        const startDate = new Date(startingDate);
        const endDate = new Date(endingDate);

        const updateOffer = await CategoryOffer.updateOne(
            { _id: offerId },
            {
                $set: {
                    name,
                    startingDate: startDate,
                    endingDate: endDate,
                    "categoryOffer.discount": categoryDiscount,
                    "categoryOffer.category": category
                }
            }
        );

        if (updateOffer.modifiedCount === 1) {
            res.redirect('/admin/category-offer');
        } else {
            console.log("Offer was not updated");
            res.redirect("/admin/category-offer");
        }
    } catch (error) {
        console.error('Error editing category offer:', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

const applyReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const userId = req.user.id;

        const referredByUser = await User.findOne({ referralCode });

        if (!referredByUser) {
            return res.status(400).json({ success: false, msg: 'Invalid referral code.' });
        }

        // Prevent self-referral
        if (referredByUser._id.toString() === userId.toString()) {
            return res.status(400).json({ success: false, msg: 'You cannot use your own referral code.' });
        }

        // if referral code is already applied
        const referringUser = await User.findById(userId);
        if (referringUser.referredBy) {
            return res.status(400).json({ success: false, msg: 'Referral code already applied.' });
        }

         // apply referral
         referringUser.referredBy = referredByUser._id;
         await referringUser.save();
 
         // Update wallets
        const [refereeWallet, referredWallet] = await Promise.all([
            Wallet.findOneAndUpdate(
                { user: userId },
                {
                    $inc: { amount: 100 },
                    $push: {
                        transactions: {
                            type: 'Credit',
                            amount: 100,
                            description: 'Referral bonus'
                        }
                    } 
                },
                { new: true, upsert: true } // create if not exists
            ),
            Wallet.findOneAndUpdate(
                { user: referredByUser._id },
                {
                    $inc: { amount: 100 },
                    $push: {
                        transactions: {
                            type: 'Credit',
                            amount: 100,
                            description: `Referral bonus for referring user ${userId}`
                        }
                    }
                },
                { new: true, upsert: true } // create if not exists
            )
        ]);

        return res.status(200).json({ success: true, msg: 'Referral code applied successfully.' });
    } catch (error) {
        console.error('Error applying referral code :', error.message);
        return res.status(500).json({ success: false, msg: 'Server error.' });
    }
}

module.exports = {
    loadProductOffer,
    loadCategoryOffer,
    loadAddProductOffer,
    addProductOffer,
    loadAddCategoryOffer,
    addCategoryOffer,
    deleteCategoryOffer,
    restoreCategoryOffer,
    deleteProductOffer,
    restoreProductOffer,
    loadEditCategoryOffer,
    loadEditProductOffer,
    editCategoryOffer,
    editProductOffer,
    applyReferralCode
}