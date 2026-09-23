const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

// GET /api/products  (public - used by the storefront)
async function getAllProducts(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/products  (admin only, multipart/form-data with "image" file)
async function createProduct(req, res) {
  try {
    const { name, category, price, productCode, description, featured } = req.body;

    if (!name || !category || !price || !productCode) {
      return res.status(400).json({ message: 'name, category, price and productCode are required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Product image is required' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    const product = await Product.create({
      name,
      category,
      price,
      productCode,
      description,
      imageUrl,
      featured: featured === undefined ? true : featured === 'true' || featured === true,
    });

    res.status(201).json({ product });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with that product code already exists' });
    }
    res.status(500).json({ message: 'Server error while creating product' });
  }
}

// PUT /api/products/:id  (admin only, image optional on update)
async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, category, price, productCode, description, featured } = req.body;

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (productCode !== undefined) product.productCode = productCode;
    if (description !== undefined) product.description = description;
    if (featured !== undefined) product.featured = featured === 'true' || featured === true;

    if (req.file) {
      // delete the old image file from disk before saving the new one
      const oldPath = path.join(__dirname, '..', product.imageUrl);
      fs.unlink(oldPath, () => {}); // ignore errors (file may already be gone)
      product.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    await product.save();
    res.json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating product' });
  }
}

// DELETE /api/products/:id  (admin only)
async function deleteProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // remove the image file from disk
    const imagePath = path.join(__dirname, '..', product.imageUrl);
    fs.unlink(imagePath, () => {});

    await product.deleteOne();
    res.json({ message: 'Product deleted', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};