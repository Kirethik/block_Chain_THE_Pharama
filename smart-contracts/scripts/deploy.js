const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy SupplyChain contract
  console.log("📦 Deploying SupplyChain contract...");
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy(deployer.address);
  
  await supplyChain.waitForDeployment();
  const contractAddress = await supplyChain.getAddress();
  
  console.log("✅ SupplyChain deployed to:", contractAddress);
  console.log("   Admin:", deployer.address);
  console.log("   Network:", hre.network.name);
  console.log("   Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());

  // Grant initial roles (optional)
  if (process.env.INITIAL_MANUFACTURER) {
    console.log("\n🔑 Granting initial roles...");
    const tx = await supplyChain.grantManufacturer(process.env.INITIAL_MANUFACTURER);
    await tx.wait();
    console.log("✓ Manufacturer role granted to:", process.env.INITIAL_MANUFACTURER);
  }

  // Verification info
  console.log("\n📝 Verification command:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} ${deployer.address}`);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString()
  };

  fs.writeFileSync(
    `./deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n✅ Deployment info saved to deployments/", hre.network.name + ".json");
  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
