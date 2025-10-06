const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.SUPPLYCHAIN_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set SUPPLYCHAIN_ADDRESS environment variable");
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  const SupplyChain = await hre.ethers.getContractAt("SupplyChain", contractAddress);

  // Get contract stats
  console.log("\n📊 Contract Statistics:");
  const stats = await SupplyChain.getStats();
  console.log("   Total Items Registered:", stats.totalItems.toString());
  console.log("   Total Transfers:", stats.totalTxs.toString());

  // Example: Register an item
  console.log("\n📦 Registering test item...");
  const productId = "00300001234567";
  const serialNumber = "TEST-" + Date.now();
  const key = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`${productId}|${serialNumber}`));
  const commit = hre.ethers.randomBytes(32);

  try {
    const tx = await SupplyChain.registerItem(key, signer.address, commit);
    console.log("   Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("   ✓ Item registered in block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Verify registration
    const owner = await SupplyChain.ownerOf(key);
    console.log("   Current owner:", owner);

  } catch (error) {
    console.error("   Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });