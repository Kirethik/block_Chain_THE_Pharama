const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Entity extends Model {}

Entity.init({
  entity_id: { // ✅ Primary key matches DB exactly
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true
  },
  entity_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.ENUM('MANUFACTURER', 'DISTRIBUTOR', 'DISPENSER', 'HOSPITAL', 'PHARMACY'),
    allowNull: false
  },
  blockchain_address: { // ✅ Matches DB column
    type: DataTypes.STRING(42),
    allowNull: false,
    unique: true
  },
  
  // 🆕 Add this field to match the 'public_key' column used in encryption
  public_key: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Uncompressed Ethereum public key (starts with 04)"
  },

  gln: {
    type: DataTypes.STRING(13)
  },
  email: {
    type: DataTypes.STRING(255)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING(100)
  },
  state: {
    type: DataTypes.STRING(100)
  },
  country: {
    type: DataTypes.STRING(100)
  },
  postal_code: {
    type: DataTypes.STRING(20)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  registration_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: "entities",
  timestamps: false // ✅ because registration_date & last_updated exist
});

module.exports = Entity;
