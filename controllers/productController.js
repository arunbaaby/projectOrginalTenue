//prouctController.js
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

const updateProduct = async(req,res)=>{
    try {
        const {name,description,brand,gender,price,discountPrice,stock,category} = req.body;
        console.log(name,description,brand,gender,price,discountPrice,stock,category);
        // Check if the category exists by ID
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

        // Check if another category with the same name already exists
        const duplicateProduct = await Product.findOne({ name: name, _id: { $ne: id } });
        if (duplicateProduct) {
            return res.status(400).send('Category name already exists');
        }
        
        // Update the category with the new name and description
        await Product.findByIdAndUpdate(id, { $set: { name: name, description: description ,brand:brand, gender:gender, price:price, discountPrice:discountPrice, category:category} });

        // Redirect to product page after the update
        res.redirect('/admin/product');
        
        
    } catch (error) {
        console.error(`Error while editing product: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
}

// const updateProduct = async (req, res) => {
//     try {
//         console.log('Update product initiated');
        
//         const productId = req.query.id; // Make sure the ID is passed correctly
//         console.log('Product ID:', productId);

//         if (!mongoose.Types.ObjectId.isValid(productId)) {
//             console.log('Invalid product ID');
//             return res.status(400).send('Invalid product ID');
//         }

//         let existingProduct = await Product.findById(productId);
//         console.log('Fetched existing product:', existingProduct);

//         if (!existingProduct) {
//             console.log('Product not found');
//             return res.status(404).send('Product not found');
//         }

//         const categorydetails = await Category.find();
//         console.log('Fetched category details');

//         let existingImages = existingProduct.images || [];
//         console.log('Existing images:', existingImages);

//         let newImages = [];
//         if (req.files && req.files.length) {
//             newImages = req.files.map(file => file.filename);
//         }
//         console.log('New images:', newImages);

//         const allImages = existingImages.concat(newImages);
//         console.log('All images:', allImages);

//         if (allImages.length > 3) {
//             console.log('More than 3 images');
//             return res.render('edit-product', { categoryData: categorydetails, productData: existingProduct, message: 'Maximum 3 images per product' });
//         } else {
//             const updatedProduct = await Product.findByIdAndUpdate(productId, {
//                 $set: {
//                     name: req.body.name,
//                     description: req.body.description,
//                     images: allImages,
//                     brand: req.body.brand,
//                     gender: req.body.gender,
//                     category: req.body.category,
//                     price: req.body.price,
//                     discountPrice: req.body.discountPrice,
//                     countInStock: req.body.stock,
//                 }
//             }, { new: true });

//             console.log('Product updated:', updatedProduct);

//             if (updatedProduct) {
//                 return res.redirect('/admin/product');
//             } else {
//                 console.log('Failed to update product');
//                 return res.status(500).send('Failed to update product');
//             }
//         }
//     } catch (error) {
//         console.log('Error in update product:', error.message);
//         res.status(500).send('An error occurred');
//     }
// };





// const updateProduct = async (req, res) => {
//     try {
//         const id = req.query.id;

//         const { name, description, brand, gender, price, discountPrice, stock, category } = req.body;
//         console.log(id);
//         console.log(name);
        
//         let imagePaths = [];
//         if (req.files && req.files.length > 0) {
//             imagePaths = req.files.map(file => file.filename);
//         }

//         // Check if the product exists by ID
//         const existingProduct = await Product.findById(id);
//         if (!existingProduct) {
//             return res.status(404).send('Product not found');

//         }

//         // Check if another Product with the same name already exists
//         const duplicateProduct = await Product.findOne({ name: name, _id: { $ne: id } });
//         if (duplicateProduct) {
//             return res.status(400).send('Product name already exists');
//         }

//         // Update the category with the new name and description
//         const updateProduct = await Product.findByIdAndUpdate(id, { $set: { name: name, description: description, brand: brand, gender: gender, price: price, discountPrice: discountPrice, stock: stock, category: category, images: imagePaths } });

//         if (updateProduct) {
//             // Redirect to the category list page after successful update
//             console.log("product updated");
            
//             res.redirect('/admin/product');
//         }
//         // // Redirect to the category list page after successful update
//         // res.redirect('/admin/product');
//     } catch (error) {
//         console.error(`Error updating product: ${error.message}`);
//         res.status(500).send('Internal Server Error');
//     }
// };

module.exports = {
    productLoad,
    addProductsLoad,
    addProduct,
    deleteProduct,
    restoreProduct,
    editProductLoad,
    updateProduct
}
