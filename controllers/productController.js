const path = require('path');
const fs = require('fs');

//prouctController.js
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');

const {calculateAndApplyOffer} = require('../helpers/offerHelper');
const {getRecommendedProducts} = require('../helpers/productFeatureHelper');

//all products for the admin side
const productLoad = async (req, res) => {
    try {
        const query = String(req.query.q || '');
        const currentPage = parseInt(req.query.page) || 1;
        const itemsPerPage = 10;

        const sortOption = req.query.sort || 'default';
        const categoryFilter = req.query.category || '';

        const filter = {
            name: { $regex: query, $options: 'i' },
        };

        if (categoryFilter) {
            filter.category = categoryFilter;
        }

        let sortCriteria = {};
        switch (sortOption) {
            case 'latest':
                sortCriteria = { createdAt: -1 };
                break;
            case 'priceAsc':
                sortCriteria = { price: 1 };
                break;
            case 'priceDesc':
                sortCriteria = { price: -1 };
                break;
            default:
                break;
        }

        const totalItems = await Product.countDocuments(filter);

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const products = await Product.find(filter)
            .populate('category')
            .sort(sortCriteria)
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const categories = await Category.find({ is_active: true });

        res.render('viewProducts', {
            product: products,
            categories,
            query,
            currentPage,
            itemsPerPage,
            totalItems,
            totalPages,
            sortOption,
            categoryFilter,
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};


const addProductsLoad = async (req, res) => {
    try {
        const categoryDetails = await Category.find({ is_active: true });
        res.render('add-product', { category: categoryDetails });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}


const addProduct = async (req, res) => {
    try {
        const { name, description, brand, gender, price, discountPrice, stock, category } = req.body;

        if (!name || !description || !brand || !gender || !category || !price || !discountPrice || !stock) {
            const categoryDetails = await Category.find({ is_active: true });
            return res.render('add-product', { message: 'All fields are required.', category: categoryDetails });
        }

        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => file.filename);
        }

        // // If sizes are not provided, set default sizes
        // const defaultSizes = sizes && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL', 'XXL'];

        const newProduct = new Product({
            name,
            description,
            brand,
            gender,
            price,
            discountPrice,
            // baseDiscountPrice: discountPrice,
            stock,
            category,
            // sizes: defaultSizes,  // Include sizes
            images: imagePaths
        });

        const savedProduct = await newProduct.save();

        if (savedProduct) {
            const categoryDetails = await Category.find({ is_active: true });
            res.render('add-product', { message: 'Product added successfully!', category: categoryDetails });
        }

    } catch (error) {
        const categoryDetails = await Category.find({ is_active: true });
        res.status(500).render('add-product', { message: 'Internal Server Error', category: categoryDetails });
    }
};


const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id;
        //soft deletion only
        await Product.findByIdAndUpdate(id, { is_active: false });
        res.redirect('/admin/product');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const deleteProductImage = async (req, res) => {
    const { id, delete: image } = req.query;

    if (!id || !image) {
        return res.status(400).send('Invalid request parameters.');
    }
    try {
        const imagePath = path.join(__dirname, 'public', 'productImages', image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Product.findByIdAndUpdate(id, {
            $pull: { images: image },
        });

        res.sendStatus(200);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const restoreProduct = async (req, res) => {
    try {
        const id = req.query.id;
        //soft deletion only
        await Product.findByIdAndUpdate(id, { is_active: true });
        res.redirect('/admin/product');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const editProductLoad = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            return res.redirect('/admin/product');
        }

        const productData = await Product.findById(id).populate('category');
        const categoryData = await Category.find({ is_active: true });

        if (productData && categoryData) {
            return res.render('edit-product', { categoryData, productData });
        } else {
            return res.redirect('/admin/product');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, brand, gender, stock, category } = req.body;
        
        const id = req.query.id;

        const price = Number(req.body.price);
        const discountPrice = Number(req.body.discountPrice);

        if(price<discountPrice){
            return res.status(400).json('Product price shouldnot be lesser than the discount price');
        }
        // let imagePaths = [];
        // if (req.files && req.files.length > 0) {
        //     imagePaths = req.files.map(file => file.filename);
        // }

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        const duplicateProduct = await Product.findOne({ name: name, _id: { $ne: id } });
        if (duplicateProduct) {
            return res.status(400).send('Product name already exists');
        }

        // new images and existing images stored in array
        let imagePaths = existingProduct.images; 
        if (req.files && req.files.length > 0) {
            // newly uploaded images
            const newImagePaths = req.files.map(file => file.filename);
            imagePaths = [...imagePaths, ...newImagePaths];
        }

        // // set default sizes
        // const updatedSizes = sizes && sizes.length > 0 ? sizes : existingProduct.sizes.length > 0 ? existingProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL'];

        await Product.findByIdAndUpdate(id, {
            $set: {
                name: name,
                description: description,
                brand: brand,
                gender: gender,
                price: price,
                discountPrice: discountPrice,
                category: category,
                stock: stock,
                // sizes: updatedSizes, 
                images: imagePaths
            }
        });

        res.redirect('/admin/product');

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};

const allProductsLoad = async (req, res) => {
    try {
        const query = req.query.q || '';
        const sortOption = req.query.sort || 'default';
        const priceMin = parseInt(req.query.priceMin) || 0;
        const priceMax = parseInt(req.query.priceMax) || Infinity;
        const brand = req.query.brand || null;

        const currentPage = parseInt(req.query.page) || 1;
        const itemsPerPage = 16;

        const userId = req.user?.id;
        let userLogged = false;

        let cart = { items: [] }; // Default cart as an empty object
        if (userId) {
            userLogged = true;
            const existingCart = await Cart.findOne({ user: userId }).populate('items.product');
            if (existingCart) {
                cart = existingCart;
            }
        }


        let subtotal = 0;
        if (cart) {
            cart.items = cart.items.filter(item => item.product); 
            subtotal = cart.items.reduce((acc, item) => {
                const productPrice = item.product.discountPrice ?? item.product.price ?? 0;
                return acc + (productPrice * item.quantity);
            }, 0);
        }

        let sortCriteria;

        switch (sortOption) {
            case 'latest':
                sortCriteria = { createdAt: -1 };
                break;
            case 'priceAsc':
                sortCriteria = { price: 1 };
                break;
            case 'priceDesc':
                sortCriteria = { price: -1 };
                break;
            default:
                sortCriteria = null;
                break;
        }

        // // Price filter
        // const priceMin = parseInt(req.query.priceMin) || 0;
        // const priceMax = parseInt(req.query.priceMax) || Infinity;

        // // Brand filter case insetive 
        // const brand = req.query.brand ? new RegExp(`^${req.query.brand}`, 'i') : null;

        const matchStage = {
            is_active: true,
            name: { $regex: query, $options: 'i' },
            price: { $gte: priceMin, $lte: priceMax },
            ...(brand && { brand: { $regex: `^${brand}$`, $options: 'i' } }) 
        };
        

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            { $match: { 'category.is_active': true } }, 
            ...(sortCriteria ? [{ $sort: sortCriteria }] : []), 
            { $skip: (currentPage - 1) * itemsPerPage }, 
            { $limit: itemsPerPage }
        ];

        const productsResult = await Product.aggregate(pipeline);

        // Apply offers for each product
        for (const product of productsResult) {
            await calculateAndApplyOffer(product._id, product.category._id);
        }


        const totalItemsResult = await Product.aggregate([
            { $match: matchStage }, 
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            { $match: { 'category.is_active': true } },
            { $count: 'totalItems' }
        ]);

        const totalItems = totalItemsResult.length > 0 ? totalItemsResult[0].totalItems : 0;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        let relatedProducts = [];
        if (productsResult.length > 0) {
            const mainProductCategory = productsResult[0].category._id;
            relatedProducts = await Product.find({
                is_active: true,
                category: mainProductCategory,
                _id: { $ne: productsResult[0]._id }
            })
                .populate({
                    path: 'category',
                    match: { is_active: true }
                })
                .limit(5);
        }

        res.render('allProducts', {
            products: productsResult,
            relatedProducts,
            currentPage,
            totalPages,
            query, 
            sortOption, 
            brand, 
            priceMin, 
            priceMax,
            cart,
            subtotal: subtotal.toFixed(2),
            userLogged
        });

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};





//user side 
const productDetailsLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userId = req.user?.id;
        const product = await Product.findById(id).populate('category');
        const recommendedProducts = await getRecommendedProducts(id);

        let userLogged = false;

        let cart = { items: [] }; // Default cart as an empty object
        if (userId) {
            userLogged = true;
            const existingCart = await Cart.findOne({ user: userId }).populate('items.product');
            if (existingCart) {
                cart = existingCart;
            }
        }

        let subtotal = 0;
        if (cart) {
            cart.items = cart.items.filter(item => item.product); 
            subtotal = cart.items.reduce((acc, item) => {
                const productPrice = item.product.discountPrice ?? item.product.price ?? 0;
                return acc + (productPrice * item.quantity);
            }, 0);
        }

        if (!product) {
            return res.redirect('/404');
        }

        if (!product.is_active || (product.category && !product.category.is_active)) {
            return res.redirect('/unlisted-product');
        }


        //category field in each product should have all the category documents and info
        const products = await Product.find({ is_active: true }).populate('category')

        //related products logic
        let relatedProducts = [];

        if (products.length > 0) {
            const mainProductCategory = product.category;
            relatedProducts = await Product.find({
                is_active: true,
                category: mainProductCategory,
                _id: { $ne: product._id }//avoid the same product(main product);
            }).limit(5);
        }
        res.render('product-details', { product, relatedProducts, products, cart, subtotal, recommendedProducts, userLogged });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    productLoad,
    addProductsLoad,
    addProduct,
    deleteProduct,
    restoreProduct,
    editProductLoad,
    updateProduct,
    allProductsLoad,
    productDetailsLoad,
    deleteProductImage
}
