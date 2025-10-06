const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Entity extends Model {}

Entity.init({
  id: { 
    type: DataTypes.BIGINT, 
    primaryKey: true, 
    autoIncrement: true 
  },
  ethereum_address: {
    type: DataTypes.STRING(42),
    allowNull: false,
    unique: true
  },
  entity_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.ENUM('manufacturer', 'distributor', 'pharmacy', 'hospital', 'regulator'),
    allowNull: false
  },
  public_key: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Uncompressed public key for encryption"
  },
  gln: {
    type: DataTypes.STRING(13),
    comment: "Global Location Number (GS1 standard)"
  },
  license_number: {
    type: DataTypes.STRING(100)
  },
  contact_info: {
    type: DataTypes.JSON
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, { 
  sequelize, 
  tableName: "entities", 
  timestamps: true 
});

module.exports = Entity;
