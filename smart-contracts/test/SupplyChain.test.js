const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SupplyChain", function () {
  let supplyChain;
  let admin, manufacturer, distributor, pharmacy, regulator, user;
  let itemKey, commit;

  beforeEach(async function () {
    [admin, manufacturer, distributor, pharmacy, regulator, user] = await ethers.getSigners();

    const SupplyChain = await ethers.getContractFactory("SupplyChain", admin);
    supplyChain = await SupplyChain.deploy(admin.address);
    await supplyChain.waitForDeployment();

    // Grant roles
    await supplyChain.connect(admin).grantManufacturer(manufacturer.address);
    await supplyChain.connect(admin).grantDistributor(distributor.address);
    await supplyChain.connect(admin).grantPharmacy(pharmacy.address);
    await supplyChain.connect(admin).grantRegulator(regulator.address);

    // Prepare test data
    itemKey = ethers.keccak256(ethers.toUtf8Bytes("product|serial1"));
    commit = ethers.randomBytes(32);
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await supplyChain.hasRole(await supplyChain.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should grant manufacturer role correctly", async function () {
      expect(await supplyChain.hasRole(await supplyChain.MANUFACTURER_ROLE(), manufacturer.address)).to.be.true;
    });
  });

  describe("Item Registration", function () {
    it("Should register a new item successfully", async function () {
      await supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit);
      
      expect(await supplyChain.ownerOf(itemKey)).to.equal(manufacturer.address);
      expect(await supplyChain.itemExists(itemKey)).to.be.true;
    });

    it("Should fail if non-manufacturer tries to register", async function () {
      await expect(
        supplyChain.connect(user).registerItem(itemKey, user.address, commit)
      ).to.be.reverted;
    });

    it("Should fail to register duplicate item", async function () {
      await supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit);
      
      await expect(
        supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit)
      ).to.be.revertedWith("Item already exists");
    });

    it("Should emit ItemRegistered event", async function () {
      await expect(supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit))
        .to.emit(supplyChain, "ItemRegistered")
        .withArgs(itemKey, manufacturer.address, manufacturer.address, commit, await time.latest() + 1);
    });

    it("Should update statistics correctly", async function () {
      await supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit);
      
      const stats = await supplyChain.getStats();
      expect(stats.totalItems).to.equal(1);
      expect(stats.totalTxs).to.equal(0); // No transfers yet
    });
  });

  describe("Item Transfer", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit);
    });

    it("Should transfer item successfully", async function () {
      const newCommit = ethers.randomBytes(32);
      await supplyChain.connect(manufacturer).transferItem(itemKey, distributor.address, newCommit);
      
      expect(await supplyChain.ownerOf(itemKey)).to.equal(distributor.address);
    });

    it("Should fail if non-owner tries to transfer", async function () {
      await expect(
        supplyChain.connect(user).transferItem(itemKey, user.address, commit)
      ).to.be.revertedWith("Not the current owner");
    });

    it("Should fail to transfer to zero address", async function () {
      await expect(
        supplyChain.connect(manufacturer).transferItem(itemKey, ethers.ZeroAddress, commit)
      ).to.be.revertedWith("Invalid new owner address");
    });

    it("Should emit ItemTransferred event", async function () {
      const newCommit = ethers.randomBytes(32);
      
      await expect(supplyChain.connect(manufacturer).transferItem(itemKey, distributor.address, newCommit))
        .to.emit(supplyChain, "ItemTransferred")
        .withArgs(itemKey, manufacturer.address, distributor.address, newCommit, await time.latest() + 1);
    });

    it("Should update transfer count", async function () {
      await supplyChain.connect(manufacturer).transferItem(itemKey, distributor.address, commit);
      
      const item = await supplyChain.getItem(itemKey);
      expect(item.transferCount).to.equal(1);
    });

    it("Should record transfer history", async function () {
      await supplyChain.connect(manufacturer).transferItem(itemKey, distributor.address, commit);
      
      const history = await supplyChain.getTransferHistory(itemKey);
      expect(history.length).to.equal(2); // Initial + transfer
      expect(history[1].from).to.equal(manufacturer.address);
      expect(history[1].to).to.equal(distributor.address);
    });
  });

  describe("Batch Operations", function () {
    it("Should register multiple items in batch", async function () {
      const keys = [
        ethers.keccak256(ethers.toUtf8Bytes("product|serial1")),
        ethers.keccak256(ethers.toUtf8Bytes("product|serial2")),
        ethers.keccak256(ethers.toUtf8Bytes("product|serial3"))
      ];
      const commits = [
        ethers.randomBytes(32),
        ethers.randomBytes(32),
        ethers.randomBytes(32)
      ];

      await supplyChain.connect(manufacturer).batchRegisterItems(keys, manufacturer.address, commits);

      expect(await supplyChain.itemExists(keys[0])).to.be.true;
      expect(await supplyChain.itemExists(keys[1])).to.be.true;
      expect(await supplyChain.itemExists(keys[2])).to.be.true;
    });

    it("Should transfer multiple items in batch", async function () {
      const keys = [
        ethers.keccak256(ethers.toUtf8Bytes("product|serial1")),
        ethers.keccak256(ethers.toUtf8Bytes("product|serial2"))
      ];
      const commits = [
        ethers.randomBytes(32),
        ethers.randomBytes(32)
      ];

      // Register first
      await supplyChain.connect(manufacturer).batchRegisterItems(keys, manufacturer.address, commits);

      // Transfer
      const newCommits = [ethers.randomBytes(32), ethers.randomBytes(32)];
      await supplyChain.connect(manufacturer).batchTransferItems(keys, distributor.address, newCommits);

      expect(await supplyChain.ownerOf(keys[0])).to.equal(distributor.address);
      expect(await supplyChain.ownerOf(keys[1])).to.equal(distributor.address);
    });
  });

  describe("Recall Mechanism", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit);
    });

    it("Should allow manufacturer to recall item", async function () {
      await supplyChain.connect(manufacturer).recallItem(itemKey, "Safety concern");
      
      expect(await supplyChain.isRecalled(itemKey)).to.be.true;
    });

    it("Should allow regulator to recall item", async function () {
      await supplyChain.connect(regulator).recallItem(itemKey, "Regulatory issue");
      
      expect(await supplyChain.isRecalled(itemKey)).to.be.true;
    });

    it("Should prevent transfer of recalled item", async function () {
      await supplyChain.connect(manufacturer).recallItem(itemKey, "Safety concern");
      
      await expect(
        supplyChain.connect(manufacturer).transferItem(itemKey, distributor.address, commit)
      ).to.be.revertedWith("Item has been recalled");
    });

    it("Should emit ItemRecalled event", async function () {
      await expect(supplyChain.connect(manufacturer).recallItem(itemKey, "Safety concern"))
        .to.emit(supplyChain, "ItemRecalled");
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow admin to pause contract", async function () {
      await supplyChain.connect(admin).pause();
      expect(await supplyChain.paused()).to.be.true;
    });

    it("Should prevent operations when paused", async function () {
      await supplyChain.connect(admin).pause();
      
      await expect(
        supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow admin to unpause", async function () {
      await supplyChain.connect(admin).pause();
      await supplyChain.connect(admin).unpause();
      
      expect(await supplyChain.paused()).to.be.false;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerItem(itemKey, manufacturer.address, commit);
    });

    it("Should return complete item information", async function () {
      const item = await supplyChain.getItem(itemKey);
      
      expect(item.exists).to.be.true;
      expect(item.currentOwner).to.equal(manufacturer.address);
      expect(item.manufacturer).to.equal(manufacturer.address);
      expect(item.recalled).to.be.false;
    });

    it("Should return transfer history", async function () {
      await supplyChain.connect(manufacturer).transferItem(itemKey, distributor.address, commit);
      
      const history = await supplyChain.getTransferHistory(itemKey);
      expect(history.length).to.equal(2);
    });

    it("Should check entity authorization", async function () {
      expect(await supplyChain.isAuthorizedEntity(manufacturer.address)).to.be.true;
      expect(await supplyChain.isAuthorizedEntity(user.address)).to.be.false;
    });
  });
});