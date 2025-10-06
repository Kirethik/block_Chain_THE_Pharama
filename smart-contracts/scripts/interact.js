const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.SUPPLYCHAIN_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set SUPPLYCHAIN_ADDRESS environment variable");
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  // Use the correct contract name and address
  const SupplyChain = await hre.ethers.getContractAt("PharmaceuticalSupplyChain", contractAddress);

  // --- Contract Statistics (Removed/Simplified) ---
  // Your contract doesn't have getStats(), so we'll check the owner and a registered status instead.
  console.log("\n📊 Contract Owner Check:");
  const contractOwner = await SupplyChain.contractOwner();
  console.log("   Contract Owner Address:", contractOwner);
  const isAuth = await SupplyChain.authorizedManufacturers(signer.address);
  console.log("   Signer is Authorized Manufacturer:", isAuth);


  // --- Example: Register an item (Initial Transaction) ---
  console.log("\n📦 Registering test item...");
  
  // Data elements required for the transaction
  const productId = "00300001234567";
  const serialNumber = "TEST-" + Date.now();
  const serialHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`${productId}|${serialNumber}`));
  
  // Encrypted data (must be provided as bytes32)
  const dummyEncryptedProductId = hre.ethers.encodeBytes32String("ePID");
  const dummyEncryptedSerialNumber = hre.ethers.encodeBytes32String("eSN");


  try {
    // Use the correct function: registerProduct(hash, ePID, eSN)
    const tx = await SupplyChain.registerProduct(
      serialHash, 
      dummyEncryptedProductId, 
      dummyEncryptedSerialNumber
    );
    console.log("   Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("   ✓ Item registered in block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Verify registration using the correct function: getCurrentOwner(hash)
    const owner = await SupplyChain.getCurrentOwner(serialHash);
    console.log("   Current owner:", owner);

  } catch (error) {
    console.error("   Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });