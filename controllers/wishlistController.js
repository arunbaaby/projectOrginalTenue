const Product = require('../models/productModel');
const Wishlist = require('../models/wishlistModel');
const Cart = require('../models/cartModel');

const loadWishlist = async (req, res) => {
    try {
      const userId = req.user.id;
      const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
  
      res.render('wishlist', {
        wishlist: wishlist ? wishlist.products : [], // Pass the products array
        cart
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error loading the wishlist' });
    }
  };

const addToWishlist = async(req,res)=>{
    const {productId} = req.body;
    const userId = req.user.id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
    
        // is there wishlist already for the user no then create one
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
          wishlist = new Wishlist({ user: userId, products: [] });
        }
    
        if (!wishlist.products.includes(productId)) {
          wishlist.products.push(productId);
          await wishlist.save();
        }
    
        res.status(200).json({ message: 'Product added to wishlist' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
}

const removeFromWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
  
    try {
      const wishlist = await Wishlist.findOne({ user: userId });
      if (!wishlist) {
        return res.status(404).json({ error: 'Wishlist not found' });
      }
  
      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== productId
      );
      await wishlist.save();
  
      res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error removing the product from wishlist' });
    }
  };
  

module.exports = {
    addToWishlist,
    loadWishlist,
    removeFromWishlist
}