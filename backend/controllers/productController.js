const Product = require("../models/Product");

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    console.log("Create product request body:", req.body);
    const newProduct = new Product(req.body);
    const saved = await newProduct.save();
    console.log("Product saved:", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(400).json({ error: "Validation failed" });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Delete failed" });
  }
};
