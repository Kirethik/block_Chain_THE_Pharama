const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Product extends Model {}

Product.init({
  product_id: { 
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gtin: {
    type: DataTypes.STRING(14)
  },
  manufacturer_id: {  // ✅ foreign key to entities.entity_id
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ndc: {
    type: DataTypes.STRING(11)
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING(100)
  },
  dosage_form: {
    type: DataTypes.STRING(100)
  },
  strength: {
    type: DataTypes.STRING(100)
  },
  unit_of_measure: {
    type: DataTypes.STRING(50)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_updated: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  tableName: "products",
  timestamps: false // ✅ prevent Sequelize from expecting createdAt/updatedAt
});

module.exports = Product;
