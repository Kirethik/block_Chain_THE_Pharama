const EthCrypto = require("eth-crypto");
const { aesGcmEncryptJSON, aesGcmDecryptBase64 } = require("../utils/encrypt");
const Entity = require("../models/Entity");

/**
 * Create encrypted payload with access control
 * @param {Object} payload - Data to encrypt
 * @param {string} shipperAddress - Shipper's blockchain address
 * @param {string} receiverAddress - Receiver's blockchain address
 * @returns {Object} Encrypted data and keys
 */
async function createEncryptedPayload(payload, shipperAddress, receiverAddress) {
  try {
    // ✅ Fetch public keys from database using correct column
    console.log('🔍 Looking up public keys for:');
    console.log('  Shipper:', shipperAddress);
    console.log('  Receiver:', receiverAddress);
    console.log("📡 DB lookup results:");


    const shipper = await Entity.findOne({
      where: { blockchain_address: shipperAddress }
    });
    const receiver = await Entity.findOne({
      where: { blockchain_address: receiverAddress }
    });
    console.log("Shipper record:", shipper?.dataValues);
    console.log("Receiver record:", receiver?.dataValues);
    if (!shipper || !receiver) {
      throw new Error("Shipper or receiver not found in entity registry");
    }

    // ✅ Ensure public keys exist in DB
    if (!shipper.public_key || !receiver.public_key) {
      throw new Error("Missing public key for shipper or receiver");
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

    // Create commit hash for blockchain traceability
    const commitHash = EthCrypto.hash.keccak256([
      { type: "string", value: ciphertext },
      { type: "address", value: shipperAddress },
      { type: "address", value: receiverAddress },
      { type: "uint256", value: Date.now().toString() }
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
    const encryptedObject = EthCrypto.cipher.parse(encryptedKey);
    const symKeyHex = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject);
    const decrypted = aesGcmDecryptBase64(ciphertext, symKeyHex);
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Verify user has access to decrypt
 * @param {string} userAddress - User's blockchain address
 * @param {string} txId - Transaction ID
 * @returns {boolean} Whether user has access
 */
async function verifyAccess(userAddress, txId) {
  const Transaction = require("../models/Transaction");
  const tx = await Transaction.findOne({ where: { transaction_id: txId } });
  if (!tx) return false;

  return tx.shipper_address === userAddress || tx.receiver_address === userAddress;
}

module.exports = {
  createEncryptedPayload,
  decryptPayload,
  verifyAccess
};
