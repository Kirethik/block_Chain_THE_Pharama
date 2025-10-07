const hre = require("hardhat");
const { ethers } = hre;
const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS =
    process.env.SUPPLYCHAIN_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const supplyChain = await ethers.getContractAt(
    "PharmaceuticalSupplyChain",
    CONTRACT_ADDRESS
  );
  const [admin, manufacturer] = await ethers.getSigners();

  console.log(`Admin: ${admin.address}`);
  console.log(`Manufacturer: ${manufacturer.address}`);

  // ✅ Connect to MySQL
  const db = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "supplychain",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // ✅ Authorize manufacturer if not already
  const isAuthorized = await supplyChain.authorizedManufacturers(
    manufacturer.address
  );

  if (!isAuthorized) {
    console.log("⏳ Authorizing manufacturer...");
    const authTx = await supplyChain
      .connect(admin)
      .authorizeManufacturer(manufacturer.address);
    await authTx.wait();
    console.log(`✅ Authorized manufacturer: ${manufacturer.address}`);
  } else {
    console.log(`✅ Manufacturer already authorized: ${manufacturer.address}`);
  }

  // ✅ Prepare data for product registration
  const productId = "PROD001";
  const manufacturerId = "MFG001";
  const serialNumber = "LIPITOR-BATCH-0013";
  const serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
  const now = new Date();

  // These must be bytes32
  const encryptedProductId = ethers.encodeBytes32String("EncryptedLipitor1234");
  const encryptedSerial = ethers.encodeBytes32String("EncryptedSerial11551515");

  console.log("⏳ Registering product on-chain...");

  // ✅ Call contract with correct parameter types
  const tx = await supplyChain
    .connect(manufacturer)
    .registerProduct(serialHash, encryptedProductId, encryptedSerial);

  const receipt = await tx.wait();
  const txHash = receipt.hash;
  const blockNumber = receipt.blockNumber;

  console.log(`✅ On-chain registration complete: ${txHash}`);

  // ✅ Off-chain MySQL sync
  const blockchainNetwork = "ETHEREUM_TESTNET";
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
