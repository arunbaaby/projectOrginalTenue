const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const addToCart = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Please login to add items to your cart." });
        }

        let { productId, quantity } = req.body;
        const userId = req.user.id;

        quantity = parseInt(quantity) || 1; // Ensure quantity is an integer
        if (quantity <= 0) {
            return res.status(400).json({ success: false, message: "Invalid quantity selected." });
        }

        const product = await Product.findById(productId).populate('category');

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        if (!product.is_active || (product.category && !product.category.is_active)) {
            return res.status(403).json({ success: false, message: "This product is unavailable." });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ success: false, message: `No stock` });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{
                    product: productId,
                    quantity: quantity,
                    is_selected: true 
                }]
            });
        } else {
            const existingProductIndex = cart.items.findIndex(item => item.product.toString() === productId);

            if (existingProductIndex !== -1) {
                cart.items[existingProductIndex].quantity += quantity;
            } else {
                cart.items.push({
                    product: productId,
                    quantity: quantity,
                    is_selected: true
                });
            }
        }

        await cart.save();
        return res.json({ success: true, message: "Product added to cart." });

    } catch (error) {
        console.error("Error adding to cart:", error);
        return res.status(500).json({ success: false, message: "Internal server error.", error });
    }
};

const loadCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if(!userId){
            return res.redirect('/prompt-login');
        }
        
        let cart = { items: [] };
        let subtotal = 0;
        let total = 0;
        let totalDiscount = 0;
        let userLogged = false;

        if (userId) {
            userLogged = true;
            const existingCart = await Cart.findOne({ user: userId }).populate('items.product');
            if (existingCart) {
                cart = existingCart;
                cart.items = cart.items.filter(item => item.product);
                
                cart.items.forEach(item => {
                    const originalPrice = item.product.price || 0;
                    const discountPrice = item.product.discountPrice || originalPrice;

                    subtotal += originalPrice * item.quantity;
                    total += discountPrice * item.quantity;
                    totalDiscount += (originalPrice - discountPrice) * item.quantity;
                });
            }
        }

        res.render('cart', {
            items: cart ? cart.items : [],
            cart,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            userLogged
        });
       
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};


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

        res.json({ 
            success: true, 
            message: 'Cart updated successfully', 
            newQuantity: item.quantity, 
            availableStock: product.stock 
        });
        
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