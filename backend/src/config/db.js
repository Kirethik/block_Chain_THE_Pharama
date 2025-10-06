const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'pharma_supply_chain',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: "mysql",
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };