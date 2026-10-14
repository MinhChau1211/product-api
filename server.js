
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health endpoint - CD version test
app.get('/health', async (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;

  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'unavailable',
    database: databaseReady ? 'connected' : 'disconnected',
    version: 'cd-test-1'
  });
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { pid, pname, price, quantity } = req.body;

    if (pid === undefined || pname === undefined ||
        price === undefined || quantity === undefined) {
      return res.status(400).json({
        message: 'pid, pname, price and quantity are required'
      });
    }

    const product = await Product.create({
      pid, pname, price, quantity
    });

    return res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Product pid already exists'
      });
    }

    if (error.name === 'ValidationError' ||
        error.name === 'CastError') {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ pid: 1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get product by pid
app.get('/api/products/:pid', async (req, res) => {
  try {
    const pid = Number(req.params.pid);

    if (!Number.isInteger(pid) || pid < 1) {
      return res.status(400).json({ message: 'Invalid pid' });
    }

    const product = await Product.findOne({ pid });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Update product by pid
app.put('/api/products/:pid', async (req, res) => {
  try {
    const pid = Number(req.params.pid);

    if (!Number.isInteger(pid) || pid < 1) {
      return res.status(400).json({ message: 'Invalid pid' });
    }

    const allowedFields = ['pname', 'price', 'quantity'];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'Provide at least one field to update'
      });
    }

    const product = await Product.findOneAndUpdate(
      { pid },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    if (error.name === 'ValidationError' ||
        error.name === 'CastError') {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Delete product by pid
app.delete('/api/products/:pid', async (req, res) => {
  try {
    const pid = Number(req.params.pid);

    if (!Number.isInteger(pid) || pid < 1) {
      return res.status(400).json({
        message: 'Invalid pid'
      });
    }

    const product = await Product.findOneAndDelete({ pid });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Connect MongoDB and start server
async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Product API listening on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start Product API:', error.message);
    process.exit(1);
  });
}

module.exports = app;
