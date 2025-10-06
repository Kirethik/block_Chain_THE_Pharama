const { ethers } = require("ethers");
require("dotenv").config();

// Multi-network support with consensus awareness
const networks = {
  ethereum: {
    rpc: process.env.ETHEREUM_RPC || "https://eth-mainnet.g.alchemy.com/v2/your-key",
    consensus: "proof-of-stake",
    confirmations: 2,
    blockTime: 12000,
    chainId: 1
  },
  polygon: {
    rpc: process.env.POLYGON_RPC || "https://polygon-rpc.com",
    consensus: "pos-with-checkpointing",
    confirmations: 10,
    blockTime: 2000,
    chainId: 137
  },
  localhost: {
    rpc: process.env.L2_RPC || "http://127.0.0.1:8545",
    consensus: "development",
    confirmations: 1,
    blockTime: 1000,
    chainId: 31337
  }
};

const currentNetwork = process.env.NETWORK || "localhost";
const networkConfig = networks[currentNetwork];

const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

// Wait for transaction finality based on consensus algorithm
async function waitForFinality(txHash) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return null;

  const currentBlock = await provider.getBlockNumber();
  const confirmations = currentBlock - receipt.blockNumber;

  if (confirmations >= networkConfig.confirmations) {
    return receipt;
  }

  // Wait for more confirmations
  return new Promise((resolve) => {
    const checkConfirmations = async () => {
      const current = await provider.getBlockNumber();
      if (current - receipt.blockNumber >= networkConfig.confirmations) {
        resolve(receipt);
      } else {
        setTimeout(checkConfirmations, networkConfig.blockTime);
      }
    };
    checkConfirmations();
  });
}

// Network health monitoring
async function getNetworkHealth() {
  try {
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();
    const network = await provider.getNetwork();

    return {
      network: currentNetwork,
      consensus: networkConfig.consensus,
      blockNumber,
      gasPrice: gasPrice.gasPrice.toString(),
      chainId: network.chainId.toString(),
      healthy: true
    };
  } catch (error) {
    return {
      network: currentNetwork,
      healthy: false,
      error: error.message
    };
  }
}

module.exports = { 
  provider, 
  signer, 
  ethers, 
  networkConfig,
  waitForFinality,
  getNetworkHealth
};