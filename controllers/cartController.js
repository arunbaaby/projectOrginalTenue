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
            return res.redirect(req.get('referer')); // redirects to the previous page and that is the product detials page 
        }

        // Check if requested quantity is greater than the stock
        if (quantity > product.stock) {
            return res.redirect(req.get('referer'));
            // return res.status(400).json({ message: `Only ${product.stock} units of this product are available` });
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

const deleteCartItem = async(req,res)=>{
    try {
        const itemId = req.params.itemId;
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = cart.items.filter(item => item._id.toString() !== itemId);//cart.items is now the new array consists items except the one with matching itemId.
            await cart.save();
        }

        // Redirect back to the cart page
        res.redirect('/cart');
    } catch (error) {
        console.error('Error deleting cart item:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

const updateCartQuantity = async(req,res)=>{
    try {
        const { itemId, change } = req.body;

        const cart = await Cart.findOne({ 'items._id': itemId }).populate('items.product');
        if (!cart) return res.status(404).json({ success: false, message: 'Item not found in cart.' });

        const item = cart.items.id(itemId);

        const product = item.product;
        const newQuantity = item.quantity + change;

        if (change > 0 && newQuantity > product.stock) {
            return res.status(400).json({ 
                success: false, 
                message: `Only ${product.stock} items are available in stock.` 
            });
        }

        // Math.max = qty>1
        item.quantity = Math.max(1, newQuantity);
        await cart.save();

        res.json({ success: true });
        
        
    } catch (error) {
        console.error('Error updating cart Qty:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

module.exports = {
    addToCart,
    loadCart,
    deleteCartItem,
    updateCartQuantity
}