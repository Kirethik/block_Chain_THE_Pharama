const { expect } = require("chai");
const { ethers } = require("hardhat");
// Use 'anyValue' from the Hardhat chai matchers to handle the timestamp comparison issue
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs"); 
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PharmaceuticalSupplyChain", function () {
  let supplyChain;
  let admin, manufacturer, distributor, pharmacy, user;
  let serialHash, dummyEncryptedBytes;

  beforeEach(async function () {
    [admin, manufacturer, distributor, pharmacy, user] = await ethers.getSigners();

    // Get the contract factory and deploy the contract
    const PharmaceuticalSupplyChainFactory = await ethers.getContractFactory("PharmaceuticalSupplyChain", admin);
    supplyChain = await PharmaceuticalSupplyChainFactory.deploy();
    await supplyChain.waitForDeployment();

    // Authorize the manufacturer test account. The admin (deployer) is authorized in the constructor.
    await supplyChain.connect(admin).authorizeManufacturer(manufacturer.address);

    // Prepare test data: Hash of a serial number for on-chain mapping
    serialHash = ethers.keccak256(ethers.toUtf8Bytes("product|serial1"));
    // Dummy encrypted data (bytes32) to satisfy the required function arguments for privacy
    dummyEncryptedBytes = ethers.encodeBytes32String("dummy");
  });

// =========================================================================
// DEPLOYMENT & ACCESS CONTROL TESTS
// =========================================================================
  describe("Deployment & Authorization", function () {
    it("Should set the deployer as the contractOwner", async function () {
      expect(await supplyChain.contractOwner()).to.equal(admin.address);
    });

    it("Should authorize the manufacturer account", async function () {
      expect(await supplyChain.authorizedManufacturers(manufacturer.address)).to.be.true;
    });

    it("Should fail to authorize manufacturer if not owner", async function () {
      await expect(
        supplyChain.connect(user).authorizeManufacturer(user.address)
      ).to.be.revertedWith("Only contract owner can perform this action");
    });
  });

// =========================================================================
// PRODUCT REGISTRATION (INITIAL TRANSACTION) & OWNERSHIP VALIDATION
// =========================================================================
  describe("Product Registration", function () {
    it("Should register a new product successfully (Initial Transaction)", async function () {
      // The two dummy bytes32 are for encryptedProductId and encryptedSerialNumber
      await supplyChain.connect(manufacturer).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes);
      
      // Check ownership is set to the manufacturer (using the contract's getCurrentOwner function)
      expect(await supplyChain.getCurrentOwner(serialHash)).to.equal(manufacturer.address);
      expect(await supplyChain.isRegistered(serialHash)).to.be.true;
    });

    it("Should fail if non-manufacturer tries to register", async function () {
      await expect(
        supplyChain.connect(user).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes)
      ).to.be.revertedWith("Only authorized manufacturers can register products");
    });

    it("Should fail to register duplicate product", async function () {
      await supplyChain.connect(manufacturer).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes);
      
      await expect(
        supplyChain.connect(manufacturer).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes)
      ).to.be.revertedWith("Product already registered");
    });

    it("Should emit ProductRegistered event", async function () {
      await expect(supplyChain.connect(manufacturer).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes))
        .to.emit(supplyChain, "ProductRegistered")
        // FIX: Replaced explicit timestamp with anyValue to avoid timing error.
        .withArgs(serialHash, manufacturer.address, anyValue); 
    });
  });

// =========================================================================
// PRODUCT TRANSFER (OWNERSHIP VALIDATION)
// =========================================================================
  describe("Product Transfer (Create & Complete)", function () {
    let txHash;
    const eShipperID = ethers.encodeBytes32String("MFG001");
    const eReceiverID = ethers.encodeBytes32String("DIST001");

    beforeEach(async function () {
      // 1. Register the item (Manufacturer is the current owner)
      await supplyChain.connect(manufacturer).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes);
    });

    it("Should successfully execute the two-step transfer (Manufacturer -> Distributor)", async function () {
      
      // STEP 1: Shipper (Manufacturer) creates the transaction
      const createTx = await supplyChain.connect(manufacturer).createTransaction(
        serialHash, 
        dummyEncryptedBytes, 
        dummyEncryptedBytes, 
        eShipperID, 
        eReceiverID, 
        distributor.address // Receiver's address
      );
      const receipt = await createTx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'TransactionCreated');
      txHash = event.args[0];

      // Ownership should NOT change yet (Manufacturer is still owner)
      expect(await supplyChain.getCurrentOwner(serialHash)).to.equal(manufacturer.address);

      // STEP 2: Receiver (Distributor) completes the transaction
      await expect(supplyChain.connect(distributor).completeTransaction(txHash, serialHash))
        .to.emit(supplyChain, "TransactionCompleted");

      // Ownership MUST change now (Distributor is the new owner)
      expect(await supplyChain.getCurrentOwner(serialHash)).to.equal(distributor.address);
    });

    it("Should fail if non-owner tries to create transaction", async function () {
      // User is not the current owner (Manufacturer is)
      await expect(
        supplyChain.connect(user).createTransaction(
          serialHash, dummyEncryptedBytes, dummyEncryptedBytes, 
          eShipperID, eReceiverID, distributor.address
        )
      ).to.be.revertedWith("You are not the current owner of this item");
    });

    it("Should fail if non-receiver tries to complete transaction", async function () {
      // Create transaction first
      const createTx = await supplyChain.connect(manufacturer).createTransaction(
        serialHash, dummyEncryptedBytes, dummyEncryptedBytes, 
        eShipperID, eReceiverID, distributor.address
      );
      const receipt = await createTx.wait();
      txHash = receipt.logs.find(log => log.fragment && log.fragment.name === 'TransactionCreated').args[0];

      // Attempt to complete by Manufacturer (shipper) -> should fail
      await expect(
        supplyChain.connect(manufacturer).completeTransaction(txHash, serialHash)
      ).to.be.revertedWith("Only receiver can complete transaction");
    });
  });

// =========================================================================
// VISIBILITY RESTRICTION (PRIVACY REQUIREMENT)
// =========================================================================
  describe("Visibility Restriction", function () {
    let txHash;
    const eShipperID = ethers.encodeBytes32String("MFG001");
    const eReceiverID = ethers.encodeBytes32String("DIST001");

    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerProduct(serialHash, dummyEncryptedBytes, dummyEncryptedBytes);
      
      // Create transaction
      const createTx = await supplyChain.connect(manufacturer).createTransaction(
        serialHash, dummyEncryptedBytes, dummyEncryptedBytes, eShipperID, eReceiverID, distributor.address
      );
      const receipt = await createTx.wait();
      txHash = receipt.logs.find(log => log.fragment && log.fragment.name === 'TransactionCreated').args[0];
    });

    it("Should allow Shipper (Manufacturer) to view transaction", async function () {
      // Shipper retrieves the encrypted payload
      const txData = await supplyChain.connect(manufacturer).getTransaction(txHash);
      expect(txData.encryptedShipperId).to.equal(eShipperID);
    });

    it("Should allow Receiver (Distributor) to view transaction", async function () {
      // Receiver retrieves the encrypted payload
      const txData = await supplyChain.connect(distributor).getTransaction(txHash);
      expect(txData.encryptedReceiverId).to.equal(eReceiverID);
    });

    it("Should fail for an unauthorized party (User) to view transaction", async function () {
      // User is not the shipper or receiver
      await expect(
        supplyChain.connect(user).getTransaction(txHash)
      ).to.be.revertedWith("Only shipper or receiver can view transaction");
    });

    it("Should fail for another authorized entity (Pharmacy) to view transaction", async function () {
      // Pharmacy is not the shipper or receiver for THIS transaction
      await expect(
        supplyChain.connect(pharmacy).getTransaction(txHash)
      ).to.be.revertedWith("Only shipper or receiver can view transaction");
    });
  });
});