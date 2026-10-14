const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    pid: {
      type: Number,
      required: true,
      unique: true,
      min: 1
    },
    pname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer'
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Product', productSchema);