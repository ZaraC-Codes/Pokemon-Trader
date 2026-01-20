/**
 * Deployment Script for PokeballGame Contract
 * @author Z33Fi ("Z33Fi Made It")
 *
 * Network: ApeChain Mainnet (Chain ID: 33139)
 * Pattern: UUPS Proxy
 *
 * Usage:
 *   npx hardhat run contracts/deployment/deploy_PokeballGame.js --network apechain
 */

const { ethers, upgrades } = require("hardhat");

// ============ Contract Addresses (ApeChain Mainnet) ============

const ADDRESSES = {
  // Tokens
  USDC_E: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
  APE: "0x4d224452801aced8b2f0aebe155379bb5d594381",

  // External Contracts
  SLAB_MACHINE: "0xC2DC75bdd0bAa476fcE8A9C628fe45a72e19C466",
  SLAB_NFT: "0x8a981C2cfdd7Fbc65395dD2c02ead94e9a2f65a7",
  POP_VRNG: "0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1",
};

// ============ Wallet Configuration ============
// From contracts/wallets.json

const WALLETS = {
  // Owner wallet - controls upgrades and admin functions
  OWNER: "0x47c11427B9f0DF4e8bdB674f5e23C8E994befC06",

  // Treasury wallet - receives 3% platform fees
  TREASURY: "0x1D1d0E6eF415f2BAe0c21939c50Bc4ffBeb65c74",

  // NFT Revenue wallet - holds funds for SlabMachine purchases
  NFT_REVENUE: "0x628376239B6ccb6F21d0a6E4196a18F98F86bd48",
};

// Initial APE price in USD (8 decimals)
// Example: $1.50 = 150000000
const INITIAL_APE_PRICE = 150000000; // $1.50 USD

async function main() {
  console.log("============================================");
  console.log("  PokeballGame Deployment Script");
  console.log("  Network: ApeChain Mainnet (33139)");
  console.log("  Pattern: UUPS Proxy");
  console.log("============================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "APE\n");

  // Validate wallet addresses are proper checksummed addresses
  console.log("Validating configuration...");

  const { isAddress } = await import("ethers");
  if (!isAddress(WALLETS.OWNER)) {
    throw new Error("Invalid WALLETS.OWNER address");
  }
  if (!isAddress(WALLETS.TREASURY)) {
    throw new Error("Invalid WALLETS.TREASURY address");
  }
  if (!isAddress(WALLETS.NFT_REVENUE)) {
    throw new Error("Invalid WALLETS.NFT_REVENUE address");
  }

  console.log("Configuration validated!\n");

  // Display deployment parameters
  console.log("Deployment Parameters:");
  console.log("----------------------");
  console.log("Owner Wallet:      ", WALLETS.OWNER);
  console.log("Treasury Wallet:   ", WALLETS.TREASURY);
  console.log("NFT Revenue Wallet:", WALLETS.NFT_REVENUE);
  console.log("USDC.e Address:    ", ADDRESSES.USDC_E);
  console.log("APE Address:       ", ADDRESSES.APE);
  console.log("POP VRNG Address:  ", ADDRESSES.POP_VRNG);
  console.log("SlabMachine:       ", ADDRESSES.SLAB_MACHINE);
  console.log("Slab NFT:          ", ADDRESSES.SLAB_NFT);
  console.log("Initial APE Price: ", INITIAL_APE_PRICE, "(8 decimals)\n");

  // Deploy implementation and proxy
  console.log("Deploying PokeballGame with UUPS proxy...\n");

  const PokeballGame = await ethers.getContractFactory("PokeballGame");

  const pokeballGame = await upgrades.deployProxy(
    PokeballGame,
    [
      WALLETS.OWNER,           // _owner
      WALLETS.TREASURY,        // _treasury
      WALLETS.NFT_REVENUE,     // _nftRevenue
      ADDRESSES.USDC_E,        // _usdce
      ADDRESSES.APE,           // _ape
      ADDRESSES.POP_VRNG,      // _vrng
      ADDRESSES.SLAB_MACHINE,  // _slabMachine
      ADDRESSES.SLAB_NFT,      // _slabNFT
      INITIAL_APE_PRICE        // _initialAPEPrice
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await pokeballGame.waitForDeployment();

  const proxyAddress = await pokeballGame.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("============================================");
  console.log("  Deployment Complete!");
  console.log("============================================\n");
  console.log("Proxy Address:          ", proxyAddress);
  console.log("Implementation Address: ", implementationAddress);
  console.log("\n");

  // Verify contract state
  console.log("Verifying contract state...\n");

  const owner = await pokeballGame.owner();
  const treasury = await pokeballGame.treasuryWallet();
  const nftRevenue = await pokeballGame.nftRevenueWallet();
  const apePrice = await pokeballGame.apePriceUSD();
  const paused = await pokeballGame.paused();

  console.log("Contract State:");
  console.log("---------------");
  console.log("Owner:            ", owner);
  console.log("Treasury:         ", treasury);
  console.log("NFT Revenue:      ", nftRevenue);
  console.log("APE Price (USD):  ", apePrice.toString());
  console.log("Paused:           ", paused);
  console.log("\n");

  // Output for frontend integration
  console.log("============================================");
  console.log("  Frontend Integration");
  console.log("============================================\n");
  console.log("Add to your frontend config:\n");
  console.log(`const POKEBALL_GAME_ADDRESS = "${proxyAddress}";`);
  console.log("\n");

  // Output for verification
  console.log("============================================");
  console.log("  Contract Verification");
  console.log("============================================\n");
  console.log("To verify on Apescan, run:\n");
  console.log(`npx hardhat verify --network apechain ${implementationAddress}`);
  console.log("\n");

  // Return deployment info
  return {
    proxy: proxyAddress,
    implementation: implementationAddress,
    deployer: deployer.address,
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("Deployment successful!");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

/**
 * Post-Deployment Checklist:
 *
 * 1. ✅ Verify contract on Apescan
 * 2. ✅ Transfer ownership to multisig (if applicable)
 * 3. ✅ Spawn initial Pokemon using forceSpawnPokemon()
 * 4. ✅ Set correct APE price from oracle
 * 5. ✅ Approve USDC.e for SlabMachine interactions
 * 6. ✅ Test ball purchase with small amount
 * 7. ✅ Test throw mechanics
 * 8. ✅ Monitor first few catches
 *
 * Emergency Functions:
 * - pause(): Halt all game operations
 * - unpause(): Resume game operations
 * - withdrawFees(): Withdraw accumulated platform fees
 * - setAPEPrice(): Update APE price if oracle fails
 */
