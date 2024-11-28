const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const couponSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true, // Removes extra spaces
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        unique: true,
        trim: true, // Ensures no leading/trailing spaces
    },
    description: {
        type: String,
        trim: true, // Optional but keeps input clean
    },
    minimumAmount: {
        type: Number,
        min: 100,
        required: true,
    },
    maximumAmount: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value >= this.minimumAmount;
            },
            message: "Maximum amount must be greater than or equal to minimum amount.",
        },
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    usersUsed: [
        {
            type: ObjectId,
            ref: "User",
        },
    ],
    maxUsers: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
