const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const addToCart = async(req,res)=>{
    try {
        const {productId,quantity,size} = req.body;
        const userId = req.user.id;
        console.log(productId);
        console.log(userId);
        
        console.log(`quatity: ${quantity}`);
        console.log(size);

        const product = await Product.findById(productId);
        console.log(product);
        

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if(!size){
            return res.status(404).json({ message: 'Size not selected' });
        }

        // Check if requested quantity is greater than the stock
        if (quantity > product.stock) {
            return res.status(400).json({ message: `Only ${product.stock} units of this product are available` });
        }
        
        let cart = await Cart.findOne({user:userId});
        if(!cart){
            console.log('no cart exist');
            cart = new Cart({
                user: userId,
                items: [{
                    product: productId,
                    quantity: quantity,
                    size: size,
                    is_selected: true // Optional, depending on your use case
                }]
            });
        }else {
            // cart exists and product with the same size is already in the cart
            const existingProductIndex = cart.items.findIndex(item => item.product.toString() === productId && item.size === size);

            if (existingProductIndex !== -1) {
                console.log('Product exists in cart, updating quantity');
                cart.items[existingProductIndex].quantity += parseInt(quantity);
            } else {
                // same product don't exist So push to the items array
                console.log('Adding new product to cart');
                cart.items.push({
                    product: productId,
                    quantity: quantity,
                    size: size,
                    is_selected: true
                });
            }
        }

        await cart.save();
        res.redirect('/cart');
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
}


const loadCart = async(req,res)=>{
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            return res.render('cart', { items: [] }); //render empty cart if user have no cart
        }

        console.log('cartinte akathe :'+userId);
        res.render('cart', { items: cart.items });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
}

module.exports = {
    addToCart,
    loadCart
}