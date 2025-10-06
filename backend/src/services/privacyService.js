const EthCrypto = require("eth-crypto");
const { aesGcmEncryptJSON, aesGcmDecryptBase64 } = require("../utils/encrypt");
const Entity = require("../models/Entity");

/**
 * Create encrypted payload with access control
 * @param {Object} payload - Data to encrypt
 * @param {string} shipperAddress - Shipper's Ethereum address
 * @param {string} receiverAddress - Receiver's Ethereum address
 * @returns {Object} Encrypted data and keys
 */
async function createEncryptedPayload(payload, shipperAddress, receiverAddress) {
  try {
    // Fetch public keys from database
    const shipper = await Entity.findOne({ where: { ethereum_address: shipperAddress } });
    const receiver = await Entity.findOne({ where: { ethereum_address: receiverAddress } });
    
    if (!shipper || !receiver) {
      throw new Error("Shipper or receiver not found in entity registry");
    }
    
    const shipperPub = shipper.public_key;
    const receiverPub = receiver.public_key;
    
    // AES-GCM encrypt the payload
    const { payload: ciphertext, key: symKeyHex } = aesGcmEncryptJSON(payload);
    
    // Encrypt symmetric key for both participants using ECIES
    const encForShipper = EthCrypto.cipher.stringify(
      await EthCrypto.encryptWithPublicKey(shipperPub, symKeyHex)
    );
    
    const encForReceiver = EthCrypto.cipher.stringify(
      await EthCrypto.encryptWithPublicKey(receiverPub, symKeyHex)
    );
    
    // Create commit hash for blockchain
    const commitHash = EthCrypto.hash.keccak256([
      { type: 'string', value: ciphertext },
      { type: 'address', value: shipperAddress },
      { type: 'address', value: receiverAddress },
      { type: 'uint256', value: Date.now().toString() }
    ]);
    
    return { 
      ciphertext, 
      encForShipper, 
      encForReceiver, 
      symKeyHex,
      commitHash
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt payload using encrypted key
 * @param {string} ciphertext - Base64 encrypted data
 * @param {string} encryptedKey - Encrypted symmetric key
 * @param {string} privateKey - User's private key
 * @returns {Object} Decrypted payload
 */
async function decryptPayload(ciphertext, encryptedKey, privateKey) {
  try {
    // Decrypt symmetric key using private key
    const encryptedObject = EthCrypto.cipher.parse(encryptedKey);
    const symKeyHex = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject);
    
    // Decrypt the actual payload
    const decrypted = aesGcmDecryptBase64(ciphertext, symKeyHex);
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Verify user has access to decrypt
 * @param {string} userAddress - User's Ethereum address
 * @param {string} txId - Transaction ID
 * @returns {boolean} Whether user has access
 */
async function verifyAccess(userAddress, txId) {
  const tx = await Transaction.findOne({ where: { id: txId } });
  if (!tx) return false;
  
  // User must be either current owner or previous owner
  return tx.current_owner === userAddress || tx.previous_owner === userAddress;
}

module.exports = { 
  createEncryptedPayload, 
  decryptPayload,
  verifyAccess
};