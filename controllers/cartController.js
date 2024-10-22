const Cart = require('../models/cartModel');

const addToCart = async(req,res)=>{
    try {
        const {productId,quantity,size} = req.body;
        const userId = req.user.id;
        console.log(productId);
        console.log(userId);
        
        console.log(`quatity: ${quantity}`);
        console.log(size);
        
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
        res.status(200).json({ msg: 'Product added to cart successfully', cart });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
}

// const addToCart = async (req, res) => {
//     const { productId, quantity, sizes } = req.body;
//     console.log(productId);
    
//     // const userId = req.user._id;
//     // console.log(userId);
    
//     try {
//         // let cart = await Cart.findOne({user:userId});

//         // if (!cart) {
//         //     cart = new Cart({
//         //         user: userId,
//         //         items: [{
//         //             product: productId,
//         //             quantity: quantity,
//         //             sizes: sizes,
//         //             is_selected: true // or set according to your logic
//         //         }]
//         //     });
//         // }


//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error', error });
//     }
// }

module.exports = {
    addToCart
}