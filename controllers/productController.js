//prouctController.js
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

const productLoad = async (req, res) => {
    try {

        const query = String(req.query.q || '');
        const currentPage = parseInt(req.query.page) || 1;
        const itemsPerPage = 10;

        // //count total items for pagination
        // const totolItems = await Product.countDocuments({name:{$regex:query,$options:'i'},is_deleted:false});
        const filter = {
            name: { $regex: query, $options: 'i' }
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
        const { name, description, brand, gender, price, discountPrice, stock, category, sizes } = req.body;

        if (!name || !description || !brand || !gender || !category || !price || !discountPrice || !stock) {
            const categoryDetails = await Category.find({ is_active: true });
            return res.render('add-product', { message: 'All fields are required.', category: categoryDetails });
        }

        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => file.filename);
        }

        // If sizes are not provided, set default sizes
        const defaultSizes = sizes && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL', 'XXL'];

        const newProduct = new Product({
            name,
            description,
            brand,
            gender,
            price,
            discountPrice,
            stock,
            category,
            sizes: defaultSizes,  // Include sizes
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


const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id;
        //soft deletion only
        await Product.findByIdAndUpdate(id, { is_active: false });
        res.redirect('/admin/product');
    } catch (error) {
        console.error(`Error deleting product: ${error.message}`);
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
        console.error(`Error restoring product: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
}

const editProductLoad = async (req, res) => {
    try {
        const id = req.query.id;
        console.log('Product ID:', id); // Debugging line

        if (!id) {
            console.log('id not able to get to editLoadProduct');
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
        console.error(`Error loading product for editing: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, brand, gender, price, discountPrice, stock, category, sizes } = req.body;
        console.log(name, description, brand, gender, price, discountPrice, stock, category);
        
        const id = req.query.id;

        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => file.filename);
        }
        console.log(imagePaths);

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        const duplicateProduct = await Product.findOne({ name: name, _id: { $ne: id } });
        if (duplicateProduct) {
            return res.status(400).send('Product name already exists');
        }

        // If sizes are not provided, retain existing sizes or set default sizes
        const updatedSizes = sizes && sizes.length > 0 ? sizes : existingProduct.sizes.length > 0 ? existingProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL'];

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
                sizes: updatedSizes, // Include sizes in update
                images: imagePaths 
            } 
        });

        res.redirect('/admin/product');

    } catch (error) {
        console.error(`Error while editing product: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
};


const allProductsLoad = async (req, res) => {
    try {
        const products = await Product.find({ is_active: true });
        res.render('allProducts', { products });
    } catch (error) {
        console.error(`Error loading allProducts: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
}

const productDetailsLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findById(id);
        res.render('product-details', { product });
    } catch (error) {
        console.error(`Error loading productDetails: ${error.message}`);
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
    productDetailsLoad
}
