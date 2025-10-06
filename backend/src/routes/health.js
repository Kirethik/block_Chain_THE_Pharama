const express = require('express');
const router = express.Router();
const { getNetworkHealth } = require('../config/blockchain');
const { testConnection } = require('../config/db');

// GET /api/health - System health check
router.get('/', async (req, res) => {
  try {
    const [blockchainHealth, dbHealth] = await Promise.all([
      getNetworkHealth(),
      testConnection()
    ]);

    const overallHealth = blockchainHealth.healthy && dbHealth;

    res.status(overallHealth ? 200 : 503).json({
      success: overallHealth,
      timestamp: new Date().toISOString(),
      services: {
        blockchain: blockchainHealth,
        database: {
          healthy: dbHealth,
          status: dbHealth ? 'connected' : 'disconnected'
        }
      }
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;