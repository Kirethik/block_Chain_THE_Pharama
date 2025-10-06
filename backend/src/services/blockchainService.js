const { signer, ethers, waitForFinality, networkConfig } = require("../config/blockchain");
const Transaction = require("../models/Transaction");
const abi = require("../../../smart-contracts/artifacts/contracts/SupplyChain.sol/SupplyChain.json").abi;

const contractAddress = process.env.SUPPLYCHAIN_ADDRESS;

if (!contractAddress) {
  throw new Error("SUPPLYCHAIN_ADDRESS not set in environment");
}

const contract = new ethers.Contract(contractAddress, abi, signer);

// Register item with enhanced tracking
async function registerItemOnChain(serialKey, ownerAddr, commitHex, metadata = {}) {
  try {
    console.log(`🔗 Registering item on ${networkConfig.consensus} blockchain...`);
    
    const tx = await contract.registerItem(serialKey, ownerAddr, commitHex);
    console.log(`📤 Transaction sent: ${tx.hash}`);
    
    // Wait for initial receipt
    const receipt = await tx.wait();
    console.log(`✓ Transaction mined in block ${receipt.blockNumber}`);
    
    // Wait for consensus finality
    const finalReceipt = await waitForFinality(tx.hash);
    console.log(`✓ Transaction finalized after ${networkConfig.confirmations} confirmations`);
    
    return {
      txHash: tx.hash,
      blockNumber: finalReceipt.blockNumber,
      gasUsed: finalReceipt.gasUsed.toString(),
      status: 'finalized',
      consensus: networkConfig.consensus
    };
  } catch (error) {
    console.error('✗ Registration failed:', error.message);
    throw new Error(`Blockchain registration failed: ${error.message}`);
  }
}

// Transfer item with enhanced tracking
async function transferItemOnChain(serialKey, newOwnerAddr, commitHex) {
  try {
    console.log(`🔗 Transferring item on ${networkConfig.consensus} blockchain...`);
    
    const tx = await contract.transferItem(serialKey, newOwnerAddr, commitHex);
    console.log(`📤 Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✓ Transaction mined in block ${receipt.blockNumber}`);
    
    const finalReceipt = await waitForFinality(tx.hash);
    console.log(`✓ Transaction finalized after ${networkConfig.confirmations} confirmations`);
    
    return {
      txHash: tx.hash,
      blockNumber: finalReceipt.blockNumber,
      gasUsed: finalReceipt.gasUsed.toString(),
      status: 'finalized',
      consensus: networkConfig.consensus
    };
  } catch (error) {
    console.error('✗ Transfer failed:', error.message);
    throw new Error(`Blockchain transfer failed: ${error.message}`);
  }
}

// Get current owner
async function getOwnerOf(serialKey) {
  try {
    return await contract.ownerOf(serialKey);
  } catch (error) {
    throw new Error(`Failed to get owner: ${error.message}`);
  }
}

// Get latest commit hash
async function getLatestCommit(serialKey) {
  try {
    return await contract.latestCommitOf(serialKey);
  } catch (error) {
    throw new Error(`Failed to get commit: ${error.message}`);
  }
}

// Verify transaction on blockchain
async function verifyTransaction(txHash) {
  try {
    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (!receipt) return { verified: false, reason: 'Transaction not found' };
    
    const currentBlock = await ethers.provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    
    return {
      verified: receipt.status === 1,
      confirmations,
      finalized: confirmations >= networkConfig.confirmations,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    return { verified: false, reason: error.message };
  }
}

module.exports = { 
  registerItemOnChain, 
  transferItemOnChain, 
  getOwnerOf,
  getLatestCommit,
  verifyTransaction,
  contract
};