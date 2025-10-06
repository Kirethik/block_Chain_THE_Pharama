const express = require('express');
const router = express.Router();
const Entity = require('../models/Entity');
const EthCrypto = require('eth-crypto');

// POST /api/entities - Register new entity
router.post('/', async (req, res) => {
  try {
    const {
      ethereum_address,
      entity_name,
      entity_type,
      private_key,
      gln,
      license_number,
      contact_info
    } = req.body;

    // Derive public key from private key if not provided
    let public_key = req.body.public_key;
    if (!public_key && private_key) {
      public_key = EthCrypto.publicKeyByPrivateKey(private_key);
    }

    if (!public_key) {
      return res.status(400).json({ 
        error: 'Either public_key or private_key must be provided' 
      });
    }

    const entity = await Entity.create({
      ethereum_address,
      entity_name,
      entity_type,
      public_key,
      gln,
      license_number,
      contact_info,
      verified: false,
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'Entity registered successfully',
      data: {
        id: entity.id,
        ethereum_address: entity.ethereum_address,
        entity_name: entity.entity_name,
        entity_type: entity.entity_type,
        verified: entity.verified
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Entity already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/entities - List all entities
router.get('/', async (req, res) => {
  try {
    const { entity_type, verified } = req.query;
    
    const where = { active: true };
    if (entity_type) where.entity_type = entity_type;
    if (verified !== undefined) where.verified = verified === 'true';

    const entities = await Entity.findAll({
      where,
      attributes: { exclude: ['private_key'] }
    });

    res.json({
      success: true,
      count: entities.length,
      data: entities
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/entities/:address - Get specific entity
router.get('/:address', async (req, res) => {
  try {
    const entity = await Entity.findOne({
      where: { ethereum_address: req.params.address },
      attributes: { exclude: ['private_key'] }
    });

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json({
      success: true,
      data: entity
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/entities/:address/verify - Verify an entity (admin only)
router.put('/:address/verify', async (req, res) => {
  try {
    const entity = await Entity.findOne({
      where: { ethereum_address: req.params.address }
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
