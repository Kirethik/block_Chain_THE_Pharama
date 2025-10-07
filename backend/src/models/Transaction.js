const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Transaction extends Model {}

Transaction.init({
  transaction_id: { // ✅ Matches SQL schema primary key
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_hash: { // ✅ Unique transaction identifier (replaces key_hash)
    type: DataTypes.STRING(66),
    unique: true,
    allowNull: false
  },
  blockchain_network: { // ✅ Enum matches schema
    type: DataTypes.ENUM('ETHEREUM_MAINNET', 'POLYGON_MAINNET', 'ETHEREUM_TESTNET', 'POLYGON_TESTNET'),
    allowNull: false,
    defaultValue: 'ETHEREUM_TESTNET'
  },
  serial_number: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  serial_number_hash: {
    type: DataTypes.STRING(66),
    allowNull: false
  },
  product_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  shipper_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  receiver_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  shipper_address: {
    type: DataTypes.STRING(42),
    allowNull: false
  },
  receiver_address: {
    type: DataTypes.STRING(42),
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('REGISTRATION', 'TRANSFER', 'COMPLETION'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  block_number: {
    type: DataTypes.BIGINT
  },
  transaction_timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  confirmation_timestamp: {
    type: DataTypes.DATE
  },
  gas_used: {
    type: DataTypes.BIGINT
  },
  gas_price: {
    type: DataTypes.BIGINT
  },
  transaction_fee_wei: {
    type: DataTypes.BIGINT
  },
  encrypted_data_hash: {
    type: DataTypes.STRING(66)
  },
  notes: {
    type: DataTypes.TEXT
  },
  created_date: { // ✅ Matches SQL
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_updated: { // ✅ Matches SQL
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: "transactions",
  timestamps: false // ✅ because created_date and last_updated are managed manually
});

module.exports = Transaction;
