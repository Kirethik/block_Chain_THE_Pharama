const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Product extends Model {}

Product.init({
  id: { 
    type: DataTypes.BIGINT, 
    primaryKey: true, 
    autoIncrement: true 
  },
  product_id: { 
    type: DataTypes.STRING(128), 
    allowNull: false,
    unique: true,
    comment: "Product identifier (GTIN)"
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  manufacturer_address: {
    type: DataTypes.STRING(42),
    allowNull: false,
    comment: "Manufacturer's Ethereum address"
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING(100),
    comment: "e.g., Vaccine, Antibiotic, Insulin"
  },
  requires_cold_chain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiry_period_days: {
    type: DataTypes.INTEGER,
    comment: "Days until expiration from manufacture date"
  },
  regulatory_approvals: {
    type: DataTypes.JSON,
    comment: "FDA, EMA, etc. approval numbers"
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, { 
  sequelize, 
  tableName: "products", 
  timestamps: true 
});

module.exports = Product;