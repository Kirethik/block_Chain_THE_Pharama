const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Entity = require('../models/Entity');
const { registerItemOnChain, transferItemOnChain, getOwnerOf, verifyTransaction } = require('../services/blockchainService');
const { createEncryptedPayload, decryptPayload, verifyAccess } = require('../services/privacyService');

// Middleware: Verify Ethereum signature
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

// POST /api/transactions/register
// Register new pharmaceutical product
router.post('/register', verifySignature, async (req, res) => {
  try {
    const { 
      productId, 
      serialNumber, 
      batchNumber,
      ownerAddress, 
      transactionData,
      metadata 
    } = req.body;
    
    // Verify manufacturer role
    const entity = await Entity.findOne({ 
      where: { ethereum_address: ownerAddress, entity_type: 'manufacturer' } 
    });
    
    if (!entity) {
      return res.status(403).json({ error: 'Only manufacturers can register products' });
    }
    
    // Verify product exists
    const product = await Product.findOne({ where: { product_id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found in registry' });
    }
    
    // Create unique key hash
    const keyHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${productId}|${serialNumber}`)
    );
    
    // Check if already registered
    const existing = await Transaction.findOne({ where: { key_hash: keyHash } });
    if (existing) {
      return res.status(409).json({ error: 'Product already registered' });
    }
    
    // Encrypt transaction data (manufacturer as both shipper and receiver initially)
    const { ciphertext, encForShipper, encForReceiver, commitHash } = 
      await createEncryptedPayload(transactionData, ownerAddress, ownerAddress);
    
    // Register on blockchain
    const blockchainResult = await registerItemOnChain(keyHash, ownerAddress, commitHash);
    
    // Store in database
    const transaction = await Transaction.create({
      key_hash: keyHash,
      product_id: productId,
      serial_number: serialNumber,
      batch_number: batchNumber,
      current_owner: ownerAddress,
      encrypted_data: ciphertext,
      shipper_enc_key: encForShipper,
      receiver_enc_key: encForReceiver,
      commit_hash: commitHash,
      onchain_tx_hash: blockchainResult.txHash,
      block_number: blockchainResult.blockNumber,
      gas_used: blockchainResult.gasUsed,
      status: blockchainResult.status,
      transaction_type: 'register',
      metadata
    });
    
    res.status(201).json({
      success: true,
      message: 'Product registered successfully',
      data: {
        transactionId: transaction.id,
        keyHash,
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

// POST /api/transactions/transfer
// Transfer product ownership
router.post('/transfer', verifySignature, async (req, res) => {
  try {
    const { 
      serialKey,
      keyHash,
      newOwnerAddress, 
      transactionData,
      metadata 
    } = req.body;
    
    const currentOwnerAddress = req.verifiedAddress;
    
    // Find existing transaction
    const existingTx = await Transaction.findOne({ 
      where: { key_hash: keyHash || serialKey } 
    });
    
    if (!existingTx) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Verify ownership on blockchain
    const blockchainOwner = await getOwnerOf(existingTx.key_hash);
    if (blockchainOwner.toLowerCase() !== currentOwnerAddress.toLowerCase()) {
      return res.status(403).json({ error: 'You are not the current owner' });
    }
    
    // Verify new owner exists
    const newOwner = await Entity.findOne({ 
      where: { ethereum_address: newOwnerAddress } 
    });
    
    if (!newOwner) {
      return res.status(404).json({ error: 'New owner not found in entity registry' });
    }
    
    // Encrypt transaction data for both parties
    const { ciphertext, encForShipper, encForReceiver, commitHash } = 
      await createEncryptedPayload(transactionData, currentOwnerAddress, newOwnerAddress);
    
    // Transfer on blockchain
    const blockchainResult = await transferItemOnChain(
      existingTx.key_hash, 
      newOwnerAddress, 
      commitHash
    );
    
    // Create new transaction record
    const transaction = await Transaction.create({
      key_hash: existingTx.key_hash,
      product_id: existingTx.product_id,
      serial_number: existingTx.serial_number,
      batch_number: existingTx.batch_number,
      current_owner: newOwnerAddress,
      previous_owner: currentOwnerAddress,
      encrypted_data: ciphertext,
      shipper_enc_key: encForShipper,
      receiver_enc_key: encForReceiver,
      commit_hash: commitHash,
      onchain_tx_hash: blockchainResult.txHash,
      block_number: blockchainResult.blockNumber,
      gas_used: blockchainResult.gasUsed,
      status: blockchainResult.status,
      transaction_type: 'transfer',
      metadata
    });
    
    // Update previous transaction status
    await existingTx.update({ status: 'finalized' });
    
    res.json({
      success: true,
      message: 'Product transferred successfully',
      data: {
        transactionId: transaction.id,
        keyHash: existingTx.key_hash,
        blockchainTxHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        consensus: blockchainResult.consensus,
        from: currentOwnerAddress,
        to: newOwnerAddress
      }
    });
    
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/:identifier
// Get transaction history
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { privateKey } = req.query;
    
    // Find by key hash or serial number
    const transactions = await Transaction.findAll({
      where: {
        [ethers.Op.or]: [
          { key_hash: identifier },
          { serial_number: identifier }
        ]
      },
      include: [{ model: Product }],
      order: [['createdAt', 'DESC']]
    });
    
    if (transactions.length === 0) {
      return res.status(404).json({ error: 'No transactions found' });
    }
    
    // If private key provided, decrypt data
    if (privateKey) {
      for (let tx of transactions) {
        try {
          const userAddress = ethers.computeAddress(privateKey);
          
          // Determine which encrypted key to use
          let encryptedKey;
          if (tx.current_owner === userAddress) {
            encryptedKey = tx.receiver_enc_key;
          } else if (tx.previous_owner === userAddress) {
            encryptedKey = tx.shipper_enc_key;
          } else {
            continue; // User not authorized for this transaction
          }
          
          // Decrypt
          const decrypted = await decryptPayload(
            tx.encrypted_data, 
            encryptedKey, 
            privateKey
          );
          
          tx.dataValues.decryptedData = decrypted;
        } catch (decryptError) {
          console.error('Decryption error:', decryptError.message);
        }
      }
    }
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
    
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/verify/:txHash
// Verify blockchain transaction
router.get('/verify/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const verification = await verifyTransaction(txHash);
    
    res.json({
      success: true,
      data: verification
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/owner/:address
// Get all transactions for an owner
router.get('/owner/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const transactions = await Transaction.findAll({
      where: { current_owner: address },
      include: [{ model: Product }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
