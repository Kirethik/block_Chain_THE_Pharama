const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  
  // Get the network we're deploying to
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);
  
  // Deploy the contract
  console.log("\nDeploying PharmaceuticalSupplyChain contract...");
  const PharmaceuticalSupplyChain = await hre.ethers.getContractFactory("PharmaceuticalSupplyChain");
  const supplyChain = await PharmaceuticalSupplyChain.deploy();
  
  await supplyChain.waitForDeployment();
  const contractAddress = await supplyChain.getAddress();
  
  console.log(`PharmaceuticalSupplyChain deployed to: ${contractAddress}`);
  
  // Save deployment information
  const deploymentInfo = {
    network: network,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network}_deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);
  
  // Wait for block confirmations on non-local networks
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await supplyChain.deploymentTransaction().wait(6);
    console.log("Block confirmations received!");
    
    // Verify contract on Etherscan/Polygonscan
    if (network === "mainnet" || network === "sepolia" || network === "polygon" || network === "mumbai") {
      console.log("\nVerifying contract on block explorer...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: []
        });
        console.log("Contract verified successfully!");
      } catch (error) {
        console.log("Verification error:", error.message);
      }
    }
  }
  
  // Display contract interaction instructions
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${network}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${supplyChain.deploymentTransaction().hash}`);
  console.log("\n=== Next Steps ===");
  console.log("1. Update your .env file with the contract address");
  console.log("2. Update the MySQL database with contract information");
  console.log("3. Configure the backend API to use this contract address");
  console.log("4. Authorize manufacturers using: authorizeManufacturer(address)");
  
  return {
    contractAddress,
    deployer: deployer.address,
    network
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });