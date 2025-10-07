const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Entity = require('../models/Entity');

// ======================================
// POST /api/products - Register new product
// ======================================
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      gtin,
      manufacturer_id,     // ✅ matches DB
      ndc,
      description,
      category,
      dosage_form,
      strength,
      unit_of_measure
    } = req.body;

    // ✅ Verify manufacturer exists by entity_id
    const entity = await Entity.findOne({
      where: { 
        entity_id: manufacturer_id,
        entity_type: 'MANUFACTURER'
      }
    });

    if (!entity) {
      return res.status(404).json({ error: 'Manufacturer not found in entity registry' });
    }

    // ✅ Create new product
    const product = await Product.create({
      product_id,
      product_name,
      gtin,
      manufacturer_id,
      ndc,
      description,
      category,
      dosage_form,
      strength,
      unit_of_measure,
      is_active: true
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
    console.error('Product registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// GET /api/products - List all products
// ======================================
router.get('/', async (req, res) => {
  try {
    const { category, manufacturer_id, is_active } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (manufacturer_id) where.manufacturer_id = manufacturer_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const products = await Product.findAll({ where });

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// GET /api/products/:product_id - Get specific product
// ======================================
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
    console.error('Fetch product error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
