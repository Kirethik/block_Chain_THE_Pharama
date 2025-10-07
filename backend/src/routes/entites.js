const express = require('express');
const router = express.Router();
const Entity = require('../models/Entity');
const EthCrypto = require('eth-crypto');

// ======================================
// POST /api/entities - Register new entity
// ======================================
router.post('/', async (req, res) => {
  try {
    const {
      blockchain_address, // ✅ use correct name
      entity_id,          // ✅ your DB uses entity_id as PK
      entity_name,
      entity_type,
      gln,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code
    } = req.body;

    // Basic validation
    if (!blockchain_address || !entity_id || !entity_name || !entity_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if entity already exists
    const existing = await Entity.findOne({
      where: { blockchain_address }
    });
    if (existing) {
      return res.status(409).json({ error: 'Entity already registered' });
    }

    // Create entity record
    const entity = await Entity.create({
      entity_id,
      entity_name,
      entity_type,
      blockchain_address,
      gln,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Entity registered successfully',
      data: {
        entity_id: entity.entity_id,
        blockchain_address: entity.blockchain_address,
        entity_name: entity.entity_name,
        entity_type: entity.entity_type,
        is_active: entity.is_active
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Entity already exists' });
    }
    console.error('Entity creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// GET /api/entities - List all entities
// ======================================
router.get('/', async (req, res) => {
  try {
    const { entity_type, active } = req.query;
    
    const where = {};
    if (entity_type) where.entity_type = entity_type;
    if (active !== undefined) where.is_active = active === 'true';

    const entities = await Entity.findAll({
      where
    });

    res.json({
      success: true,
      count: entities.length,
      data: entities
    });

  } catch (error) {
    console.error('Fetch entities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// GET /api/entities/:address - Get one entity
// ======================================
router.get('/:address', async (req, res) => {
  try {
    const entity = await Entity.findOne({
      where: { blockchain_address: req.params.address }
    });

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json({
      success: true,
      data: entity
    });

  } catch (error) {
    console.error('Fetch entity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// PUT /api/entities/:address/verify - Verify entity
// ======================================
router.put('/:address/verify', async (req, res) => {
  try {
    const entity = await Entity.findOne({
      where: { blockchain_address: req.params.address } // ✅ fixed here too
    });

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    entity.verified = true;
    await entity.save();

    res.json({
      success: true,
      message: 'Entity verified successfully',
      data: entity
    });

  } catch (error) {
    console.error('Verify entity error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
