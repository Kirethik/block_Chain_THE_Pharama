const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Transaction extends Model {}

Transaction.init({
  id: { 
    type: DataTypes.BIGINT, 
    primaryKey: true, 
    autoIncrement: true 
  },
  key_hash: { 
    type: DataTypes.STRING(66), 
    allowNull: false,
    unique: true,
    comment: "Unique identifier: keccak256(productId|serialNumber)"
  },
  product_id: { 
    type: DataTypes.STRING(128), 
    allowNull: false,
    comment: "Product identifier (e.g., GTIN)"
  },
  serial_number: { 
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: "Serial number for this specific item"
  },
  batch_number: {
    type: DataTypes.STRING(128),
    comment: "Manufacturing batch number"
  },
  current_owner: {
    type: DataTypes.STRING(42),
    allowNull: false,
    comment: "Current owner's Ethereum address"
  },
  previous_owner: {
    type: DataTypes.STRING(42),
    comment: "Previous owner's address"
  },
  encrypted_data: { 
    type: DataTypes.TEXT,
    comment: "Base64 encoded encrypted transaction data (AES-GCM)"
  },
  shipper_enc_key: {
    type: DataTypes.TEXT,
    comment: "Encrypted symmetric key for shipper (ECIES)"
  },
  receiver_enc_key: {
    type: DataTypes.TEXT,
    comment: "Encrypted symmetric key for receiver (ECIES)"
  },
  ipfs_cid: { 
    type: DataTypes.STRING(255),
    comment: "IPFS content identifier for additional documents"
  },
  commit_hash: { 
    type: DataTypes.STRING(66),
    allowNull: false,
    comment: "SHA256 hash stored on blockchain"
  },
  onchain_tx_hash: { 
    type: DataTypes.STRING(66),
    unique: true,
    comment: "Blockchain transaction hash"
  },
  block_number: {
    type: DataTypes.BIGINT,
    comment: "Block number where transaction was confirmed"
  },
  status: { 
    type: DataTypes.ENUM('pending', 'confirmed', 'finalized', 'failed', 'revoked'), 
    defaultValue: 'pending',
    comment: "Transaction status based on consensus finality"
  },
  transaction_type: {
    type: DataTypes.ENUM('register', 'transfer', 'update'),
    allowNull: false,
    defaultValue: 'register'
  },
  gas_used: {
    type: DataTypes.STRING(20),
    comment: "Gas used for blockchain transaction"
  },
  gas_price: {
    type: DataTypes.STRING(30),
    comment: "Gas price in wei"
  },
  metadata: {
    type: DataTypes.JSON,
    comment: "Additional metadata (location, temperature, etc.)"
  }
}, { 
  sequelize, 
  tableName: "transactions", 
  timestamps: true,
  indexes: [
    { fields: ['key_hash'] },
    { fields: ['product_id'] },
    { fields: ['serial_number'] },
    { fields: ['current_owner'] },
    { fields: ['onchain_tx_hash'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Transaction;
