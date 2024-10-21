const Cart = require('../models/cartModel');

const addToCart = async (req, res) => {
    const { productId, quantity, sizes } = req.body;
    const userId = req.user._id;
    try {
        let cart = await Cart.findOne({user:userId});

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{
                    product: productId,
                    quantity: quantity,
                    sizes: sizes,
                    is_selected: true // or set according to your logic
                }]
            });
        }


    } catch (error) {

    }
}