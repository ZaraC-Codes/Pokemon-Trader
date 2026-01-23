/**
 * Withdraw Test Funds Script
 *
 * Allows the owner to withdraw accumulated fees/revenue for recycling during testing.
 *
 * Usage:
 *   node scripts/withdraw_test_funds.cjs [action]
 *
 * Actions:
 *   status    - Show current balances (default)
 *   ape       - Withdraw accumulated APE fees from PokeballGame
 *   allape    - Emergency withdraw ALL APE from PokeballGame
 *   usdc      - Withdraw accumulated USDC.e fees from PokeballGame
 *   revenue   - Withdraw ALL USDC.e from SlabNFTManager (keeps NFTs)
 *   revenue:X - Withdraw specific amount X from SlabNFTManager (e.g., revenue:10.50)
 *
 * Requirements:
 *   - Must be called from the owner wallet
 *   - Set PRIVATE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = process.env.APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const POKEBALL_GAME_PROXY = '0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f';
const SLAB_NFT_MANAGER_PROXY = '0xbbdfa19f9719f9d9348F494E07E0baB96A85AA71';
const USDC_ADDRESS = '0xF1815bd50389c46847f0Bda824eC8da914045D14';

// Load ABIs
const POKEBALL_ABI = JSON.parse(fs.readFileSync('./contracts/abi/abi_PokeballGameV6.json', 'utf-8'));
// Use V2 ABI with emergencyWithdrawRevenue functions (raw array, not Hardhat artifact)
const SLAB_ABI = JSON.parse(fs.readFileSync('./contracts/abi/abi_SlabNFTManagerV2.json', 'utf-8'));

// Simple ERC-20 ABI for balance checks
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

async function getStatus(provider, signerAddress) {
  console.log('\n=== CURRENT BALANCES ===\n');
  console.log(`Owner/Signer: ${signerAddress}`);

  // Get contracts
  const pokeballGame = new ethers.Contract(POKEBALL_GAME_PROXY, POKEBALL_ABI, provider);
  const slabNFTManager = new ethers.Contract(SLAB_NFT_MANAGER_PROXY, SLAB_ABI, provider);
  const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

  // PokeballGame balances
  const pokeballAPEBalance = await provider.getBalance(POKEBALL_GAME_PROXY);
  const accumulatedAPEFees = await pokeballGame.accumulatedAPEFees();
  const accumulatedUSDCFees = await pokeballGame.accumulatedUSDCFees();

  // SlabNFTManager balances
  const slabUSDCBalance = await usdcContract.balanceOf(SLAB_NFT_MANAGER_PROXY);
  const inventoryCount = await slabNFTManager.getInventoryCount();

  // Treasury wallet
  const treasuryWallet = await pokeballGame.treasuryWallet();
  const treasuryAPE = await provider.getBalance(treasuryWallet);
  const treasuryUSDC = await usdcContract.balanceOf(treasuryWallet);

  // Signer balances (skip if read-only mode)
  let signerAPE = 0n;
  let signerUSDC = 0n;
  if (signerAddress !== 'N/A (read-only mode)') {
    signerAPE = await provider.getBalance(signerAddress);
    signerUSDC = await usdcContract.balanceOf(signerAddress);
  }

  console.log('\n--- PokeballGame ---');
  console.log(`  APE Balance:           ${ethers.formatEther(pokeballAPEBalance)} APE`);
  console.log(`  Accumulated APE Fees:  ${ethers.formatEther(accumulatedAPEFees)} APE`);
  console.log(`  Accumulated USDC Fees: $${Number(accumulatedUSDCFees) / 1e6} USDC.e`);

  console.log('\n--- SlabNFTManager ---');
  console.log(`  USDC.e Balance:        $${Number(slabUSDCBalance) / 1e6} USDC.e`);
  console.log(`  NFT Inventory:         ${inventoryCount} NFTs`);

  console.log('\n--- Treasury Wallet ---');
  console.log(`  Address:               ${treasuryWallet}`);
  console.log(`  APE Balance:           ${ethers.formatEther(treasuryAPE)} APE`);
  console.log(`  USDC.e Balance:        $${Number(treasuryUSDC) / 1e6} USDC.e`);

  if (signerAddress !== 'N/A (read-only mode)') {
    console.log('\n--- Your Wallet (Signer) ---');
    console.log(`  Address:               ${signerAddress}`);
    console.log(`  APE Balance:           ${ethers.formatEther(signerAPE)} APE`);
    console.log(`  USDC.e Balance:        $${Number(signerUSDC) / 1e6} USDC.e`);
  }

  // Summary
  console.log('\n=== WITHDRAWAL OPTIONS ===\n');
  if (accumulatedAPEFees > 0n) {
    console.log(`  node scripts/withdraw_test_funds.cjs ape       # Withdraw ${ethers.formatEther(accumulatedAPEFees)} APE fees`);
  }
  if (pokeballAPEBalance > 0n) {
    console.log(`  node scripts/withdraw_test_funds.cjs allape    # Emergency withdraw ${ethers.formatEther(pokeballAPEBalance)} APE`);
  }
  if (accumulatedUSDCFees > 0n) {
    console.log(`  node scripts/withdraw_test_funds.cjs usdc      # Withdraw $${Number(accumulatedUSDCFees) / 1e6} USDC.e fees`);
  }
  if (slabUSDCBalance > 0n) {
    console.log(`  node scripts/withdraw_test_funds.cjs revenue   # Withdraw $${Number(slabUSDCBalance) / 1e6} USDC.e from SlabNFTManager`);
  }
}

async function withdrawAPEFees(signer) {
  console.log('\n=== WITHDRAWING APE FEES ===\n');

  const pokeballGame = new ethers.Contract(POKEBALL_GAME_PROXY, POKEBALL_ABI, signer);

  const accumulatedAPEFees = await pokeballGame.accumulatedAPEFees();
  if (accumulatedAPEFees === 0n) {
    console.log('No APE fees to withdraw.');
    return;
  }

  console.log(`Withdrawing ${ethers.formatEther(accumulatedAPEFees)} APE fees...`);

  const tx = await pokeballGame.withdrawAPEFees();
  console.log(`Transaction: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
}

async function withdrawAllAPE(signer, provider) {
  console.log('\n=== EMERGENCY WITHDRAW ALL APE ===\n');

  const pokeballGame = new ethers.Contract(POKEBALL_GAME_PROXY, POKEBALL_ABI, signer);

  const balance = await provider.getBalance(POKEBALL_GAME_PROXY);
  if (balance === 0n) {
    console.log('No APE to withdraw.');
    return;
  }

  console.log(`Withdrawing ALL ${ethers.formatEther(balance)} APE...`);

  const tx = await pokeballGame.withdrawAllAPE();
  console.log(`Transaction: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
}

async function withdrawUSDCFees(signer) {
  console.log('\n=== WITHDRAWING USDC.e FEES ===\n');

  const pokeballGame = new ethers.Contract(POKEBALL_GAME_PROXY, POKEBALL_ABI, signer);

  const accumulatedUSDCFees = await pokeballGame.accumulatedUSDCFees();
  if (accumulatedUSDCFees === 0n) {
    console.log('No USDC.e fees to withdraw.');
    return;
  }

  console.log(`Withdrawing $${Number(accumulatedUSDCFees) / 1e6} USDC.e fees...`);

  const tx = await pokeballGame.withdrawUSDCFees();
  console.log(`Transaction: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
}

async function withdrawRevenue(signer, amount) {
  console.log('\n=== WITHDRAWING REVENUE FROM SLAB NFT MANAGER ===\n');

  const slabNFTManager = new ethers.Contract(SLAB_NFT_MANAGER_PROXY, SLAB_ABI, signer);
  const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer.provider);

  const balance = await usdcContract.balanceOf(SLAB_NFT_MANAGER_PROXY);
  if (balance === 0n) {
    console.log('No USDC.e to withdraw from SlabNFTManager.');
    return;
  }

  let tx;
  if (amount === 'all') {
    console.log(`Withdrawing ALL $${Number(balance) / 1e6} USDC.e (keeping NFTs)...`);
    tx = await slabNFTManager.emergencyWithdrawAllRevenue();
  } else {
    const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e6));
    if (amountWei > balance) {
      console.log(`Error: Requested $${amount} but only $${Number(balance) / 1e6} available.`);
      return;
    }
    console.log(`Withdrawing $${amount} USDC.e (keeping NFTs)...`);
    tx = await slabNFTManager.emergencyWithdrawRevenue(amountWei);
  }

  console.log(`Transaction: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
}

async function main() {
  // Parse action
  const action = process.argv[2] || 'status';

  // Setup provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Setup signer (required for write operations)
  let signer = null;
  if (PRIVATE_KEY && action !== 'status') {
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = await signer.getAddress();

    // Verify signer is owner
    const pokeballGame = new ethers.Contract(POKEBALL_GAME_PROXY, POKEBALL_ABI, provider);
    const owner = await pokeballGame.owner();

    if (signerAddress.toLowerCase() !== owner.toLowerCase()) {
      console.error(`\n❌ Error: Signer (${signerAddress}) is not the owner (${owner})`);
      console.error('Only the owner can withdraw funds.');
      process.exit(1);
    }
  }

  // Get signer address for status display
  const signerAddress = signer ? await signer.getAddress() : 'N/A (read-only mode)';

  // Execute action
  switch (action) {
    case 'status':
      await getStatus(provider, signerAddress);
      break;

    case 'ape':
      if (!signer) {
        console.error('Error: PRIVATE_KEY required for withdrawals. Set in .env.local');
        process.exit(1);
      }
      await withdrawAPEFees(signer);
      break;

    case 'allape':
      if (!signer) {
        console.error('Error: PRIVATE_KEY required for withdrawals. Set in .env.local');
        process.exit(1);
      }
      await withdrawAllAPE(signer, provider);
      break;

    case 'usdc':
      if (!signer) {
        console.error('Error: PRIVATE_KEY required for withdrawals. Set in .env.local');
        process.exit(1);
      }
      await withdrawUSDCFees(signer);
      break;

    case 'revenue':
      if (!signer) {
        console.error('Error: PRIVATE_KEY required for withdrawals. Set in .env.local');
        process.exit(1);
      }
      await withdrawRevenue(signer, 'all');
      break;

    default:
      // Check for revenue:X format
      if (action.startsWith('revenue:')) {
        const amount = action.split(':')[1];
        if (!signer) {
          console.error('Error: PRIVATE_KEY required for withdrawals. Set in .env.local');
          process.exit(1);
        }
        await withdrawRevenue(signer, amount);
      } else {
        console.error(`Unknown action: ${action}`);
        console.log('\nUsage: node scripts/withdraw_test_funds.cjs [action]');
        console.log('\nActions:');
        console.log('  status    - Show current balances (default)');
        console.log('  ape       - Withdraw accumulated APE fees from PokeballGame');
        console.log('  allape    - Emergency withdraw ALL APE from PokeballGame');
        console.log('  usdc      - Withdraw accumulated USDC.e fees from PokeballGame');
        console.log('  revenue   - Withdraw ALL USDC.e from SlabNFTManager (keeps NFTs)');
        console.log('  revenue:X - Withdraw specific amount X from SlabNFTManager');
        process.exit(1);
      }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
