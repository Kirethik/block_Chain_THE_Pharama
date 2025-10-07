require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.ETHEREUM_MAINNET_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto"
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto"
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_URL || "https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 50000000000 // 50 gwei
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_URL || "https://polygon-mumbai.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 30000000000 // 30 gwei
    },
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ETHEREUM_MAINNET_URL || "",
        enabled: false
      }
    },
        localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      mining: {
        auto: true,    // ⛏️ Mine automatically
        interval: 0    // ⚡ Instant mining (no delay)
      }
    }

  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || ""
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
