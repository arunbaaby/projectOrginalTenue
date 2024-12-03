const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const productOfferSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    startingDate: {
        type: Date,
        required: true
    },
    endingDate: {
        type: Date,
        required: true
    },
    productOffer: {
        product: { type: ObjectId, ref: "Product" },
        discount: { type: Number },
        offerStatus: {
            type: Boolean,
            default: true,
        },
    }
});

productOfferSchema.pre("save", function (next) {
    const currentDate = new Date();
    if (currentDate > this.endingDate) {
        this.productOffer.offerStatus = false;
    }
    next();
});

module.exports = mongoose.model("ProductOffer", productOfferSchema);