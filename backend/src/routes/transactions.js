const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Entity = require('../models/Entity');
const {
  registerItemOnChain,
  transferItemOnChain,
  getOwnerOf,
  verifyTransaction
} = require('../services/blockchainService');
const { createEncryptedPayload, decryptPayload } = require('../services/privacyService');

// 🧩 Middleware: Verify Ethereum signature
function verifySignature(req, res, next) {
  const { signature, message, address } = req.body;
  if (!signature || !message || !address) {
    return res.status(400).json({ error: 'Missing signature data' });
  }

  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    req.verifiedAddress = address;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Signature verification failed' });
  }
}

// =====================================================
// 🧩 POST /api/transactions/register
// Register a new pharmaceutical product
// =====================================================
router.post('/register', async (req, res) => {
  try {
    const {
      productId,
      serialNumber,
      batchNumber,
      ownerAddress,
      transactionData,
      metadata
    } = req.body;

    // ✅ Verify manufacturer role (uppercase ENUM + correct field)
    const entity = await Entity.findOne({
      where: { blockchain_address: ownerAddress, entity_type: 'MANUFACTURER' }
    });

    if (!entity) {
      return res.status(403).json({ error: 'Only manufacturers can register products' });
    }

    // ✅ Verify product exists
    const product = await Product.findOne({ where: { product_id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found in registry' });
    }

    // ✅ Generate a 32-byte hash for blockchain
    const serialHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${productId}|${serialNumber}`)
    );

    // ✅ Check if already registered
    const existing = await Transaction.findOne({
      where: { serial_number_hash: serialHash }
    });
    if (existing) {
      return res.status(409).json({ error: 'Product already registered' });
    }

    // ✅ Encrypt transaction data
    const { ciphertext, encForShipper, encForReceiver, commitHash } =
      await createEncryptedPayload(transactionData, ownerAddress, ownerAddress);

    // ✅ Register on blockchain (use correct args: serialHash, productId, serialNumber)
    const blockchainResult = await registerItemOnChain(serialHash, productId, serialNumber);

    // ✅ Store in MySQL
    const transaction = await Transaction.create({
      transaction_hash: blockchainResult.txHash,
      blockchain_network: 'ETHEREUM_TESTNET',
      serial_number: serialNumber,
      serial_number_hash: serialHash,
      product_id: productId,
      shipper_id: entity.entity_id,
      receiver_id: entity.entity_id,
      shipper_address: ownerAddress,
      receiver_address: ownerAddress,
      transaction_type: 'REGISTRATION',
      status: blockchainResult.status === 'finalized' ? 'CONFIRMED' : 'PENDING',
      block_number: blockchainResult.blockNumber,
      gas_used: blockchainResult.gasUsed,
      encrypted_data_hash: commitHash,
      notes: JSON.stringify(metadata || {})
    });

    res.status(201).json({
      success: true,
      message: 'Product registered successfully',
      data: {
        transactionId: transaction.transaction_id,
        serialHash,
        blockchainTxHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        consensus: blockchainResult.consensus,
        status: blockchainResult.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 🧩 POST /api/transactions/transfer
// Transfer ownership between entities
// =====================================================
router.post('/transfer', verifySignature, async (req, res) => {
  try {
    const {
      serialHash,
      newOwnerAddress,
      transactionData,
      metadata
    } = req.body;

    const currentOwnerAddress = req.verifiedAddress;

    // ✅ Find existing transaction
    const existingTx = await Transaction.findOne({
      where: { serial_number_hash: serialHash }
    });

    if (!existingTx) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // ✅ Verify blockchain ownership
    const blockchainOwner = await getOwnerOf(existingTx.serial_number_hash);
    if (blockchainOwner.toLowerCase() !== currentOwnerAddress.toLowerCase()) {
      return res.status(403).json({ error: 'You are not the current owner' });
    }

    // ✅ Verify new owner exists
    const newOwner = await Entity.findOne({
      where: { blockchain_address: newOwnerAddress }
    });

    if (!newOwner) {
      return res.status(404).json({ error: 'New owner not found in entity registry' });
    }

    // ✅ Encrypt transaction data
    const { ciphertext, encForShipper, encForReceiver, commitHash } =
      await createEncryptedPayload(transactionData, currentOwnerAddress, newOwnerAddress);

    // ✅ Transfer on blockchain
    const blockchainResult = await transferItemOnChain(
      serialHash,
      newOwnerAddress,
      existingTx.product_id,
      existingTx.serial_number
    );

    // ✅ Record new transaction in DB
    const transaction = await Transaction.create({
      transaction_hash: blockchainResult.txHash,
      blockchain_network: 'ETHEREUM_TESTNET',
      serial_number: existingTx.serial_number,
      serial_number_hash: serialHash,
      product_id: existingTx.product_id,
      shipper_id: existingTx.shipper_id,
      receiver_id: newOwner.entity_id,
      shipper_address: currentOwnerAddress,
      receiver_address: newOwnerAddress,
      transaction_type: 'TRANSFER',
      status: blockchainResult.status === 'finalized' ? 'CONFIRMED' : 'PENDING',
      block_number: blockchainResult.blockNumber,
      gas_used: blockchainResult.gasUsed,
      encrypted_data_hash: commitHash,
      notes: JSON.stringify(metadata || {})
    });

    // ✅ Update previous transaction
    await existingTx.update({ status: 'COMPLETED' });

    res.json({
      success: true,
      message: 'Product transferred successfully',
      data: {
        transactionId: transaction.transaction_id,
        serialHash,
        blockchainTxHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        from: currentOwnerAddress,
        to: newOwnerAddress
      }
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
