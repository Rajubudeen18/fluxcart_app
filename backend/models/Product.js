const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock_quantity: { type: Number, default: 0 },
  image: String, // Stores the relative path, e.g., /uploads/12345.jpg
}, { 
    timestamps: true,
    // This ensures that virtual properties are included when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// A virtual property is not stored in the database.
// It's a getter that creates a property on the fly.
productSchema.virtual('imageUrl').get(function() {
  // The 'image' field already stores the correct relative path for the frontend
  // (e.g., /uploads/image.png). This virtual just makes it available
  // under the 'imageUrl' name that the frontend index.html expects.
  if (this.image) {
    return this.image;
  }
});

module.exports = mongoose.model("Product", productSchema);
