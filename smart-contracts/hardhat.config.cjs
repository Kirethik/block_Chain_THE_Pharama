// Converted to CommonJS for Hardhat compatibility
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {}
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    mumbai: {
      url: process.env.MUMBAI_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    l2test: {
      url: process.env.L2_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
