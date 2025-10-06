const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Entity = require('../models/Entity');

// POST /api/products - Register new product
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      manufacturer,
      manufacturer_address,
      description,
      category,
      requires_cold_chain,
      expiry_period_days,
      regulatory_approvals
    } = req.body;

    // Verify manufacturer exists
    const entity = await Entity.findOne({
      where: { 
        ethereum_address: manufacturer_address,
        entity_type: 'manufacturer'
      }
    });

    if (!entity) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }

    const product = await Product.create({
      product_id,
      product_name,
      manufacturer,
      manufacturer_address,
      description,
      category,
      requires_cold_chain,
      expiry_period_days,
      regulatory_approvals
    });

    res.status(201).json({
      success: true,
      message: 'Product registered successfully',
      data: product
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Product ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products - List all products
router.get('/', async (req, res) => {
  try {
    const { category, manufacturer, active } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (manufacturer) where.manufacturer = manufacturer;
    if (active !== undefined) where.active = active === 'true';

    const products = await Product.findAll({ where });

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:product_id - Get specific product
router.get('/:product_id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { product_id: req.params.product_id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;