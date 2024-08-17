const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

const productLoad = async (req, res) => {
    try {

        const query = String(req.body.q || '');//"/admin/product?q=<%= query %>&page=<%= currentPage - 1 %>
        const currentPage = parseInt(req.body.page) || 1;
        const itemsPerPage = 10;

        // //count total items for pagination
        // const totolItems = await Product.countDocuments({name:{$regex:query,$options:'i'},is_deleted:false});
        const filter = {
            name: { $regex: query, $options: 'i' }, is_deleted: false
        }

        const totalItems = await Product.countDocuments(filter);

        //find total pages
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        //category field in each product with the full category document from the Category collection.
        const products = await Product.find(filter).populate('category').
            skip((currentPage - 1) * itemsPerPage).
            limit(itemsPerPage);

        if (products) {
            res.render('viewProducts', {
                product: products,
                query,
                currentPage,
                itemsPerPage,
                totalItems,
                totalPages
            });
        }


    } catch (error) {
        console.error(`Error fetching products: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
}

const addProductsLoad = async (req, res) => {
    try {
        const categoryDetails = await Category.find({ is_active: true });
        res.render('add-product', { category: categoryDetails });
    } catch (error) {
        console.error(`Error loading the add-products Page: ${error.message}`);
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

        const newProduct = new Product({
            name,
            description,
            brand,
            gender,
            price,
            discountPrice,
            stock,
            category,
            images: imagePaths
        });

        const savedProduct = await newProduct.save();

        if (savedProduct) {
            const categoryDetails = await Category.find({ is_active: true });
            res.render('add-product', { message: 'Product added successfully!', category: categoryDetails });
        }

    } catch (error) {
        console.error(`Error adding product: ${error.message}`);
        const categoryDetails = await Category.find({ is_active: true });
        res.status(500).render('add-product', { message: 'Internal Server Error', category: categoryDetails });
    }
};


 

module.exports = {
    productLoad,
    addProductsLoad,
    addProduct
}