const { sequelize } = require("../config/db");
const Transaction = require("./Transaction");
const Product = require("./Product");
const Entity = require("./Entity");

// Define relationships
Transaction.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'product_id' });
Product.hasMany(Transaction, { foreignKey: 'product_id', sourceKey: 'product_id' });

// Transactions linked to entities
Transaction.belongsTo(Entity, { as: 'shipper', foreignKey: 'shipper_id' });
Transaction.belongsTo(Entity, { as: 'receiver', foreignKey: 'receiver_id' });

Entity.hasMany(Transaction, { as: 'ShippedTransactions', foreignKey: 'shipper_id' });
Entity.hasMany(Transaction, { as: 'ReceivedTransactions', foreignKey: 'receiver_id' });

// Safe sync function
async function syncModels() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    await sequelize.sync({ alter: false });
    console.log('✓ All models synchronized (no forced recreation)');
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
