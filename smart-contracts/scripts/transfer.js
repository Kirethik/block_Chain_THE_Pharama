  const hre = require("hardhat");
  const { ethers } = hre;
  const mysql = require("mysql2/promise");
  require("dotenv").config();

  async function main() {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const supplyChain = await ethers.getContractAt("PharmaceuticalSupplyChain", CONTRACT_ADDRESS);

    const [admin, manufacturer, distributor] = await ethers.getSigners();

    console.log(`Manufacturer: ${manufacturer.address}`);
    console.log(`Distributor: ${distributor.address}`);

    // MySQL Connection
    const db = await mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "supplychain",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Product identifiers
    const serialNumber = "LIPITOR-BATCH-005";
    const serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));

    // Encrypted IDs
    const encryptedProductId = ethers.encodeBytes32String("EncryptedLipitor1234");
    const encryptedSerial = ethers.encodeBytes32String("EncryptedSerial1155151515");
    const encryptedShipperId = ethers.encodeBytes32String("MFG001");
    const encryptedReceiverId = ethers.encodeBytes32String("DIST001");

    // =============================================
    // STEP 1: CREATE TRANSACTION (Manufacturer → Distributor)
    // =============================================
    console.log("⏳ Creating transaction (on-chain)...");
    const createTx = await supplyChain.connect(manufacturer).createTransaction(
      serialHash,
      encryptedProductId,
      encryptedSerial,
      encryptedShipperId,
      encryptedReceiverId,
      distributor.address
    );
    const receiptCreate = await createTx.wait();
    const txCreatedHash = receiptCreate.hash;

    console.log(`✅ Transaction created: ${txCreatedHash}`);

    // Find the emitted TransactionCreated event
    const eventLog = receiptCreate.logs.find(
      (log) => log.fragment && log.fragment.name === "TransactionCreated"
    );
    const txHash = eventLog.args[0];
    const blockNumber = receiptCreate.blockNumber;

    // =============================================
    // STEP 2: COMPLETE TRANSACTION (Distributor confirms)
    // =============================================
    console.log("⏳ Distributor completing transaction...");
    const completeTx = await supplyChain.connect(distributor).completeTransaction(txHash, serialHash);
    const receiptComplete = await completeTx.wait();
    const txCompleteHash = receiptComplete.hash;
    console.log(`✅ Transaction completed: ${txCompleteHash}`);

    // =============================================
    // STEP 3: UPDATE OFF-CHAIN DATABASE
    // =============================================
    const blockchainNetwork = "ETHEREUM_TESTNET";
    const productId = "PROD001";
    const shipperId = "MFG001";
    const receiverId = "DIST001";
    const now = new Date();

    try {
      // Add new transaction record
      await db.execute(
        `INSERT INTO transactions 
        (transaction_hash, blockchain_network, serial_number, serial_number_hash,
        product_id, shipper_id, receiver_id, shipper_address, receiver_address,
        transaction_type, status, block_number, transaction_timestamp, confirmation_timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txHash,
          blockchainNetwork,
          serialNumber,
          serialHash,
          productId,
          shipperId,
          receiverId,
          manufacturer.address,
          distributor.address,
          "TRANSFER",
          "COMPLETED",
          blockNumber,
          now,
          now,
        ]
      );

      // Update serialized_items (ownership)
      await db.execute(
        `UPDATE serialized_items 
        SET current_owner_id=?, current_blockchain_address=?, status='DELIVERED', last_updated=?
        WHERE serial_number=?`,
        [receiverId, distributor.address, now, serialNumber]
      );

      // Add to transaction_history
      await db.execute(
        `INSERT INTO transaction_history 
        (serial_number, transaction_hash, from_entity_id, to_entity_id, transaction_timestamp, previous_owner, new_owner)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [serialNumber, txHash, shipperId, receiverId, now, shipperId, receiverId]
      );

      console.log("✅ Off-chain MySQL updated with new ownership transfer.");
    } catch (err) {
      console.error("❌ MySQL Error:", err);
    }

    console.log("🎉 Transfer process completed successfully (on-chain + off-chain).");
  }

  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
