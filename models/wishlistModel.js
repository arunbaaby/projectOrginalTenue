const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const wishlistSchema = new mongoose.Schema(
    {
      user: {
        type: ObjectId,
        ref: 'User',
        required: true,
      },
      products: [
        {
          type: ObjectId,
          ref: 'Product', 
          required: true, 
        },
      ],
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model('Wishlist', wishlistSchema);