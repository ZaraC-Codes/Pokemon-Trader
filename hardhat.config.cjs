/**
 * Hardhat Configuration for Pokemon Trader
 * @author Z33Fi ("Z33Fi Made It")
 *
 * Network: ApeChain Mainnet (Chain ID: 33139)
 */

require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

// Load environment variables if available
let deployerKey = [];
let rpcUrl = "https://apechain.calderachain.xyz/http";
let apescanApiKey = "";

try {
  require("dotenv").config();
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    deployerKey = [process.env.DEPLOYER_PRIVATE_KEY];
  }
  if (process.env.APECHAIN_RPC_URL) {
    rpcUrl = process.env.APECHAIN_RPC_URL;
  }
  if (process.env.APESCAN_API_KEY) {
    apescanApiKey = process.env.APESCAN_API_KEY;
  }
} catch (e) {
  // dotenv not installed or no .env file, use defaults
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    apechain: {
      url: rpcUrl,
      chainId: 33139,
      accounts: deployerKey,
    },
  },
  etherscan: {
    apiKey: {
      apechain: apescanApiKey,
    },
    customChains: [
      {
        network: "apechain",
        chainId: 33139,
        urls: {
          apiURL: "https://api.apescan.io/api",
          browserURL: "https://apescan.io",
        },
      },
    ],
  },
};
