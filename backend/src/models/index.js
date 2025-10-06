const { sequelize } = require("../config/db");
const Transaction = require("./Transaction");
const Product = require("./Product");
const Entity = require("./Entity");

// Define relationships
Transaction.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'product_id' });
Product.hasMany(Transaction, { foreignKey: 'product_id', sourceKey: 'product_id' });

// Sync all models
async function syncModels() {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ All models synchronized');
  } catch (error) {
    console.error('✗ Model sync error:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  Transaction,
  Product,
  Entity,
  syncModels
};