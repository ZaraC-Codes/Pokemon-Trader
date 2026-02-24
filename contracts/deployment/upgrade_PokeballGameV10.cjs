/**
 * Upgrade PokeballGame to v1.10.0
 *
 * New features:
 * - Dual treasury split: 1.5% to treasury A + 1.5% to treasury B (was 3% to single treasury)
 * - treasuryWalletB - Second treasury wallet
 * - accumulatedUSDCFeesB - Separate fee accumulator for treasury B
 * - setTreasuryWallets(addressA, addressB) - Set both treasury wallets atomically
 * - setTreasuryWalletB(address) - Set treasury wallet B independently
 *
 * UNCHANGED:
 * - Total 3% fee rate, RTP (~95%), randomness, NFT logic, gasless throws
 * - All spawn management, ball pricing, Pyth Entropy, meta-transactions
 *
 * IMPORTANT: Set TREASURY_WALLET_B environment variable before running!
 *
 * Usage:
 *   TREASURY_WALLET_B=0x... npx hardhat run contracts/deployment/upgrade_PokeballGameV10.cjs --network apechain
 */

const hre = require('hardhat');

async function main() {
  console.log('='.repeat(70));
  console.log('UPGRADING POKEBALLGAME TO v1.10.0 (Dual Treasury)');
  console.log('='.repeat(70));
  console.log();

  // Treasury B address - MUST be set
  const TREASURY_WALLET_B = process.env.TREASURY_WALLET_B;
  if (!TREASURY_WALLET_B || !TREASURY_WALLET_B.startsWith('0x') || TREASURY_WALLET_B.length !== 42) {
    console.error('ERROR: TREASURY_WALLET_B environment variable must be set to a valid address');
    console.error('');
    console.error('Usage:');
    console.error('  TREASURY_WALLET_B=0xYourAddress npx hardhat run contracts/deployment/upgrade_PokeballGameV10.cjs --network apechain');
    process.exit(1);
  }

  // Load addresses
  const addresses = require('../addresses.json');
  const PROXY_ADDRESS = addresses.contracts.pokeballGame.proxy;

  console.log('Proxy Address:', PROXY_ADDRESS);
  console.log('Current Implementation:', addresses.contracts.pokeballGame.implementation);
  console.log('Current Version:', addresses.contracts.pokeballGame.version);
  console.log('Treasury Wallet B:', TREASURY_WALLET_B);
  console.log();

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const balance = await deployer.getBalance();
  console.log('Balance:', hre.ethers.utils.formatEther(balance), 'APE');
  console.log();

  // Show changes
  console.log('Changes in v1.10.0:');
  console.log('  - Single 3% treasury split into two 1.5% treasuries');
  console.log('  - Treasury A (existing wallet) receives 1.5%');
  console.log('  - Treasury B (new wallet) receives 1.5%');
  console.log('  - All withdrawals split between both wallets');
  console.log();
  console.log('UNCHANGED:');
  console.log('  - Total fee rate (3%), RTP (~95%), NFT pool (96%)');
  console.log('  - Randomness (Pyth Entropy), gasless throws, spawn management');
  console.log();

  // Compile
  console.log('Compiling PokeballGameV10...');
  await hre.run('compile');

  // Deploy new implementation
  console.log('Deploying new implementation...');
  const PokeballGameV10 = await hre.ethers.getContractFactory('contracts/PokeballGameV10.sol:PokeballGame');

  const newImpl = await PokeballGameV10.deploy();
  await newImpl.deployed();
  console.log('New implementation deployed at:', newImpl.address);
  console.log();

  // Upgrade proxy
  console.log('Upgrading proxy to new implementation...');

  const proxyABI = [
    'function upgradeToAndCall(address newImplementation, bytes memory data) external payable',
    'function upgradeTo(address newImplementation) external',
  ];
  const proxy = new hre.ethers.Contract(PROXY_ADDRESS, proxyABI, deployer);

  try {
    const tx = await proxy.upgradeToAndCall(newImpl.address, '0x', { gasLimit: 500000 });
    console.log('Upgrade TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('Upgrade confirmed in block:', receipt.blockNumber);
  } catch (err) {
    console.log('upgradeToAndCall failed, trying upgradeTo...');
    const tx = await proxy.upgradeTo(newImpl.address, { gasLimit: 500000 });
    console.log('Upgrade TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('Upgrade confirmed in block:', receipt.blockNumber);
  }

  console.log();

  // Initialize v1.10.0
  console.log('Initializing v1.10.0 with Treasury B:', TREASURY_WALLET_B);
  const game = await hre.ethers.getContractAt(
    'contracts/PokeballGameV10.sol:PokeballGame',
    PROXY_ADDRESS
  );

  try {
    const initTx = await game.initializeV1100(TREASURY_WALLET_B, { gasLimit: 200000 });
    console.log('Init TX:', initTx.hash);
    await initTx.wait();
    console.log('v1.10.0 initialization complete');
  } catch (err) {
    if (err.message.includes('Already initialized')) {
      console.log('v1.10.0 already initialized (skipping)');
    } else {
      throw err;
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('UPGRADE SUCCESSFUL');
  console.log('='.repeat(70));
  console.log();
  console.log('Proxy Address (unchanged):', PROXY_ADDRESS);
  console.log('New Implementation:', newImpl.address);
  console.log('Version: 1.10.0');
  console.log();

  // Verify the upgrade
  console.log('Verifying upgrade...');

  const treasuryA = await game.treasuryWallet();
  console.log('Treasury Wallet A:', treasuryA);

  const treasuryB = await game.treasuryWalletB();
  console.log('Treasury Wallet B:', treasuryB);

  const feesA = await game.accumulatedUSDCFees();
  console.log('Accumulated USDC Fees A:', hre.ethers.utils.formatUnits(feesA, 6), 'USDC.e');

  const feesB = await game.accumulatedUSDCFeesB();
  console.log('Accumulated USDC Fees B:', hre.ethers.utils.formatUnits(feesB, 6), 'USDC.e');

  const feeABps = await game.TREASURY_FEE_A_BPS();
  const feeBBps = await game.TREASURY_FEE_B_BPS();
  console.log('Treasury Fee A BPS:', feeABps.toString(), '(1.5%)');
  console.log('Treasury Fee B BPS:', feeBBps.toString(), '(1.5%)');

  const totalAPEReserve = await game.totalAPEReserve();
  console.log('Total APE Reserve:', hre.ethers.utils.formatEther(totalAPEReserve), 'APE');

  const relayerAddress = await game.relayerAddress();
  console.log('Relayer Address:', relayerAddress);

  const nftInventory = await game.getNFTInventoryCount();
  console.log('NFT Inventory Count:', nftInventory);
  console.log();

  console.log('='.repeat(70));
  console.log('NEXT STEPS');
  console.log('='.repeat(70));
  console.log();
  console.log('1. Update contracts/addresses.json:');
  console.log(`   "implementation": "${newImpl.address}",`);
  console.log(`   "version": "1.10.0"`);
  console.log();
  console.log('2. Update contracts/wallets.json:');
  console.log(`   "treasuryA": "${treasuryA}",`);
  console.log(`   "treasuryB": "${TREASURY_WALLET_B}"`);
  console.log();
  console.log('3. Update frontend ABI to abi_PokeballGameV10.json');
  console.log();
  console.log('4. Verify fee split:');
  console.log('   - Purchase balls, then check accumulatedUSDCFees and accumulatedUSDCFeesB');
  console.log('   - Both should accumulate at the same rate (1.5% each)');
  console.log();
  console.log('5. Update Hardhat tasks (withdrawTreasuryFunds) if needed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Upgrade failed:', error);
    process.exit(1);
  });
