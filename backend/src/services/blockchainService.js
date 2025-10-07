const { signer, ethers, waitForFinality, networkConfig } = require("../config/blockchain");

// ✅ Correct artifact path based on your Hardhat output
const abi = require("../../../smart-contracts/artifacts/contracts/SupplyChain.sol/PharmaceuticalSupplyChain.json").abi;

// ✅ Contract address from .env
const contractAddress = process.env.SUPPLYCHAIN_ADDRESS;
if (!contractAddress) {
  throw new Error("SUPPLYCHAIN_ADDRESS not set in environment");
}

// ✅ Connect contract with signer (wallet)
const contract = new ethers.Contract(contractAddress, abi, signer);

/**
 * 🧩 Register product on-chain
 * @param {string} serialHash - keccak256 hash of serial number
 * @param {string} encryptedProductId - bytes32 encoded product ID
 * @param {string} encryptedSerial - bytes32 encoded serial number
 */
async function registerItemOnChain(serialHash, productId, serialNumber) {
  try {
    console.log(`🔗 Registering product on ${networkConfig.consensus} blockchain...`);

    // ✅ Convert strings to bytes32 as expected by Solidity
    const encryptedProductId = ethers.encodeBytes32String(productId);
    const encryptedSerial = ethers.encodeBytes32String(serialNumber);

    const tx = await contract.registerProduct(serialHash, encryptedProductId, encryptedSerial);
    console.log(`📤 Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✓ Mined in block ${receipt.blockNumber}`);

    // Optional: wait for finality
    const finalReceipt = await waitForFinality(tx.hash);
    console.log(`✓ Finalized after ${networkConfig.confirmations} confirmations`);

    return {
      txHash: tx.hash,
      blockNumber: finalReceipt.blockNumber,
      gasUsed: finalReceipt.gasUsed?.toString() || "0",
      status: "finalized",
      consensus: networkConfig.consensus,
    };
  } catch (error) {
    console.error("✗ registerItemOnChain failed:", error.message);
    throw new Error(`Blockchain registration failed: ${error.message}`);
  }
}


/**
 * 🚚 Transfer product ownership (create + complete transaction)
 */
async function transferItemOnChain(serialHash, receiverAddress, encryptedProductId, encryptedSerial, encryptedShipperId, encryptedReceiverId) {
  try {
    console.log(`🔗 Transferring item to ${receiverAddress}...`);

    // Create transaction
    const createTx = await contract.createTransaction(
      serialHash,
      encryptedProductId,
      encryptedSerial,
      encryptedShipperId,
      encryptedReceiverId,
      receiverAddress
    );
    console.log(`📤 Transaction created: ${createTx.hash}`);

    const receiptCreate = await createTx.wait();
    console.log(`✓ Created in block ${receiptCreate.blockNumber}`);

    // Simulate completion by receiver (optional, can be done in UI or second call)
    const txHash = receiptCreate.hash;
    const completeTx = await contract.completeTransaction(txHash, serialHash);
    const receiptComplete = await completeTx.wait();

    console.log(`✅ Transaction completed: ${receiptComplete.transactionHash}`);

    return {
      txHash: receiptComplete.transactionHash,
      blockNumber: receiptComplete.blockNumber,
      gasUsed: receiptComplete.gasUsed?.toString() || "0",
      status: "completed",
      consensus: networkConfig.consensus,
    };
  } catch (error) {
    console.error("✗ transferItemOnChain failed:", error.message);
    throw new Error(`Blockchain transfer failed: ${error.message}`);
  }
}

/**
 * 👁 Get current owner of product
 */
async function getOwnerOf(serialHash) {
  try {
    const owner = await contract.getCurrentOwner(serialHash);
    return owner;
  } catch (error) {
    throw new Error(`Failed to get current owner: ${error.message}`);
  }
}

/**
 * ✅ Verify transaction on blockchain
 */
async function verifyTransaction(txHash) {
  try {
    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (!receipt) return { verified: false, reason: "Transaction not found" };

    const currentBlock = await ethers.provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    return {
      verified: receipt.status === 1,
      confirmations,
      finalized: confirmations >= networkConfig.confirmations,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString() || "0",
    };
  } catch (error) {
    return { verified: false, reason: error.message };
  }
}

module.exports = {
  registerItemOnChain,
  transferItemOnChain,
  getOwnerOf,
  verifyTransaction,
  contract,
};
