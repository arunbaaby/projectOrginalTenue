const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const categoryOfferSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    startingDate:{
        type:Date,
        required:true
        
    },
    endingDate:{
        type:Date,
        required:true
    },
    categoryOffer: {
        category: { type: ObjectId, ref: "Category" },
        discount: { type: Number },
        offerStatus: {
          type: Boolean,
          default: true,
        },
        
      },
      is_active: {  
        type: Boolean,
        default: true  
    }
    
})
categoryOfferSchema.pre("save", function (next) {
    const currentDate = new Date();
    if (currentDate > this.endingDate) {
      this.categoryOffer.offerStatus = false;
    }
    next();
});

module.exports = mongoose.model("CategoryOffer", categoryOfferSchema);
  
