const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  reorderProducts,
  deleteProduct,
} = require('../controllers/productController');
const { requireAdminAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public - anyone visiting the site can view products
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin only - requires valid JWT
router.post('/', requireAdminAuth, upload.single('image'), createProduct);
router.put('/reorder', requireAdminAuth, reorderProducts);
router.put('/:id', requireAdminAuth, upload.single('image'), updateProduct);
router.delete('/:id', requireAdminAuth, deleteProduct);

module.exports = router;