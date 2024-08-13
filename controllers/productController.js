const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

const productLoad = async(req,res)=>{
    try {

        const query = String(req.body.q||'');//"/admin/product?q=<%= query %>&page=<%= currentPage - 1 %>
        const currentPage = parseInt(req.body.page)||1;
        const itemsPerPage = 10;

        // //count total items for pagination
        // const totolItems = await Product.countDocuments({name:{$regex:query,$options:'i'},is_deleted:false});
        const filter = {
            name:{$regex:query,$options:'i'},is_deleted:false}

        const totalItems = await Product.countDocuments(filter);

        //find total pages
        const totalPages = Math.ceil(totalItems/itemsPerPage);

        //category field in each product with the full category document from the Category collection.
        const products = await Product.find(filter).populate('category').
        skip((currentPage-1)*itemsPerPage).
        limit(itemsPerPage);

        if(products){
            res.render('viewProducts',{
                product:products,
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

const addProductsLoad = async(req,res)=>{
    try {
        // res.end('add products page');
    const categoryDetails = await Category.find({is_active:true});
    res.render('add-products',{category:categoryDetails});
    } catch (error) {
        console.error(`Error loading the add-products Page: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    productLoad,
    addProductsLoad
}