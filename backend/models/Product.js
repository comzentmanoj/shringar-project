// Manoj Maurya\Angular Projects\shringar-project\backend\models\Product.js



const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // e.g. Necklaces, Earrings, Bracelets, Rings
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    productCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      // used in the WhatsApp enquiry message, e.g. "SL001"
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image is required'],
      // stored as a relative path like /uploads/products/xyz.jpg
    },
    description: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: true,
      // controls whether it shows on the public "Collection" section
    },
    isHero: {
      type: Boolean,
      default: false,
      // controls whether it shows on the Hero Carousel slider
    },
    heroOrder: {
      type: Number,
      default: 0,
      // display order in the Hero Carousel slider
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);