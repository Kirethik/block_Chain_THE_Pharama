const hre = require("hardhat");
const { ethers } = hre;
const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const supplyChain = await ethers.getContractAt("PharmaceuticalSupplyChain", CONTRACT_ADDRESS);
  const [admin, manufacturer] = await ethers.getSigners();

  console.log(`Admin: ${admin.address}`);
  console.log(`Manufacturer: ${manufacturer.address}`);

  // Connect to MySQL
  const db = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "pharma_supply_chain",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Authorize manufacturer (if not already)
  const authorized = await supplyChain.authorizedManufacturers(manufacturer.address);
  if (!authorized) {
    const authTx = await supplyChain.connect(admin).authorizeManufacturer(manufacturer.address);
    await authTx.wait();
    console.log(`✅ Authorized manufacturer ${manufacturer.address}`);
  }

  // Prepare product data
  const serialNumber = "LIPITOR-BATCH-001";
  const serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
  const encryptedProductId = ethers.encodeBytes32String("EncryptedLipitor1234");
  const encryptedSerial = ethers.encodeBytes32String("EncryptedSerial1155151515");

  console.log("⏳ Registering product on-chain...");
  const tx = await supplyChain.connect(manufacturer).registerProduct(serialHash, encryptedProductId, encryptedSerial);
  const receipt = await tx.wait();
  const txHash = receipt.hash;
  const blockNumber = receipt.blockNumber;
  console.log(`✅ On-chain registration complete: ${txHash}`);

  // Off-chain MySQL entry
  const blockchainNetwork = "ETHEREUM_TESTNET";
  const productId = "PROD001";
  const manufacturerId = "MFG001";
  const now = new Date();

  try {
    await db.execute(
      `INSERT INTO serialized_items 
      (serial_number, serial_number_hash, product_id, manufacturer_id, 
       current_owner_id, current_blockchain_address, blockchain_registered, 
       registration_tx_hash, registration_block_number, registration_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serialNumber,
        serialHash,
        productId,
        manufacturerId,
        manufacturerId,
        manufacturer.address,
        true,
        txHash,
        blockNumber,
        now,
      ]
    );

    await db.execute(
      `INSERT INTO transactions 
      (transaction_hash, blockchain_network, serial_number, serial_number_hash,
       product_id, shipper_id, receiver_id, shipper_address, receiver_address,
       transaction_type, status, block_number, transaction_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txHash,
        blockchainNetwork,
        serialNumber,
        serialHash,
        productId,
        manufacturerId,
        manufacturerId,
        manufacturer.address,
        manufacturer.address,
        "REGISTRATION",
        "CONFIRMED",
        blockNumber,
        now,
      ]
    );

    console.log(`✅ Indexed off-chain in MySQL for serial: ${serialNumber}`);
  } catch (err) {
    console.error("❌ MySQL error:", err);
  }

  console.log("🎉 Product successfully registered both on-chain and off-chain!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
