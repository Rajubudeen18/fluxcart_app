const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use promises for async/await file operations
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const Product = require('../models/Product');

// --- Multer Configuration for File Uploads ---

// Define storage for uploaded files.
// Files will be stored in the 'uploads/' directory in the backend's root.
// Your Express server in `index.js` is already configured to serve this directory.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwrites.
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// --- API Routes ---

/**
 * @route   POST /
 * @desc    Create a new product (handles multipart/form-data with an image)
 */
router.post('/', [verifyToken, isAdmin, upload.single('image')], async (req, res) => {
  try {
    const { name, description, price, stock_quantity } = req.body;

    // Construct the URL path for the image to be stored in the database.
    // This path will be used by the frontend to fetch the image.
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newProduct = new Product({
      name,
      description,
      price,
      stock_quantity,
      image: imagePath
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error during product creation.' });
  }
});

/**
 * @route   GET /
 * @desc    Get all products
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.find({});
        // If no products are found, this will correctly return an empty array []
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a product
 * @access  Private (should be protected by an auth middleware in a real app)
 */
router.put('/:id', [verifyToken, isAdmin, upload.single('image')], async (req, res) => {
  try {
    const { name, description, price, stock_quantity } = req.body;
    const updateData = { name, description, price, stock_quantity };

    if (req.file) {
      // If a new image is uploaded, find the old product to delete its image
      const oldProduct = await Product.findById(req.params.id).select('image').lean();
      if (oldProduct && oldProduct.image) {
        // oldProduct.image is stored as '/uploads/filename.ext'.
        // We need the absolute file system path to delete it.
        const filename = path.basename(oldProduct.image);
        const oldImagePath = path.join(__dirname, '..', 'uploads', filename);
        try {
          await fs.unlink(oldImagePath);
        } catch (unlinkError) {
          // If the file doesn't exist, that's fine. Log other errors.
          if (unlinkError.code !== 'ENOENT') {
            console.error('Error deleting old image:', unlinkError);
          }
        }
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error during product update.' });
  }
});

/**
 * @route   DELETE /:id
 * @desc    Delete a product
 * @access  Private (should be protected by an auth middleware in a real app)
 */
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id); // This returns the deleted document
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If the deleted product had an image, remove it from the filesystem.
    if (product.image) {
      // product.image is stored as '/uploads/filename.ext'.
      // We need the absolute file system path to delete it.
      const filename = path.basename(product.image);
      const imagePath = path.join(__dirname, '..', 'uploads', filename);
      try {
        await fs.unlink(imagePath);
      } catch (unlinkError) {
        // If the file doesn't exist, that's fine. Log other errors.
        if (unlinkError.code !== 'ENOENT') {
          console.error("Error deleting product image:", unlinkError);
        }
      }
    }

    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error during product deletion.' });
  }
});

module.exports = router;