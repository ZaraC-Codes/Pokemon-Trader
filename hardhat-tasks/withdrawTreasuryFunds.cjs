/**
 * Withdraw Treasury Funds Task
 *
 * Withdraws accumulated USDC.e fees from PokeballGame to both treasuries (v1.10.0).
 * Treasury A receives accumulatedUSDCFees, Treasury B receives accumulatedUSDCFeesB.
 *
 * Usage:
 *   npx hardhat withdrawTreasuryFunds --all --network apechain
 *   npx hardhat withdrawTreasuryFunds --amount 50 --network apechain
 */

const { task, types } = require('hardhat/config');
const {
  header,
  subheader,
  info,
  success,
  warning,
  error,
  formatUSDC,
} = require('./helpers/formatOutput.cjs');
const {
  POKEBALL_GAME_PROXY,
  getPokeballGameBalances,
  getSignerInfo,
} = require('./helpers/getContractBalances.cjs');

const POKEBALL_GAME_TREASURY_ABI = [
  'function accumulatedUSDCFees() external view returns (uint256)',
  'function accumulatedUSDCFeesB() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function treasuryWallet() external view returns (address)',
  'function treasuryWalletB() external view returns (address)',
  'function withdrawUSDCFees() external',
];

task('withdrawTreasuryFunds', 'Withdraw accumulated USDC.e fees from PokeballGame')
  .addOptionalParam('all', 'Withdraw all fees', false, types.boolean)
  .addOptionalParam('amount', 'Specific amount to withdraw (USD)', undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const { all, amount } = taskArgs;

    if (!all && !amount) {
      throw new Error('Must specify --all or --amount');
    }

    header('WITHDRAW TREASURY FUNDS - PokeballGame (v1.10.0 Dual Treasury)');

    const [signer] = await hre.ethers.getSigners();
    info('Signer', signer.address);
    console.log();

    // Get current state
    const gameContract = new hre.ethers.Contract(
      POKEBALL_GAME_PROXY,
      POKEBALL_GAME_TREASURY_ABI,
      signer
    );

    const [accumulatedFeesA, accumulatedFeesB, owner, treasuryWalletA, treasuryWalletB] = await Promise.all([
      gameContract.accumulatedUSDCFees(),
      gameContract.accumulatedUSDCFeesB().catch(() => hre.ethers.BigNumber.from(0)),
      gameContract.owner(),
      gameContract.treasuryWallet(),
      gameContract.treasuryWalletB().catch(() => 'N/A (pre-v1.10.0)'),
    ]);

    const totalFees = accumulatedFeesA.add(accumulatedFeesB);

    // Verify ownership
    subheader('Ownership Check');
    info('Contract Owner', owner);
    if (signer.address.toLowerCase() !== owner.toLowerCase()) {
      error(`Signer ${signer.address} is not the owner!`);
      throw new Error('Only the contract owner can withdraw');
    }
    success('Signer is owner');
    console.log();

    // Check current balance
    subheader('Current State (v1.10.0 Dual Treasury)');
    info('Contract', POKEBALL_GAME_PROXY);
    info('Treasury A Wallet', treasuryWalletA);
    info('Treasury A Fees', formatUSDC(accumulatedFeesA));
    info('Treasury B Wallet', treasuryWalletB);
    info('Treasury B Fees', formatUSDC(accumulatedFeesB));
    info('Total Fees', formatUSDC(totalFees));
    console.log();

    if (totalFees.lte(0)) {
      warning('No fees to withdraw');
      return;
    }

    // Note: The contract's withdrawUSDCFees() withdraws ALL accumulated fees from both pools
    // There's no partial withdrawal function in the current contract
    if (!all && amount) {
      const requestedAmount = hre.ethers.utils.parseUnits(amount, 6);
      if (requestedAmount.lt(totalFees)) {
        warning(
          `Note: PokeballGame only supports full withdrawal. ` +
          `Requested ${formatUSDC(requestedAmount)} but will withdraw all ${formatUSDC(totalFees)}`
        );
      }
    }

    subheader('Withdrawal Plan');
    info('Will Withdraw (A)', formatUSDC(accumulatedFeesA) + ' → ' + treasuryWalletA);
    info('Will Withdraw (B)', formatUSDC(accumulatedFeesB) + ' → ' + treasuryWalletB);
    info('Total', formatUSDC(totalFees));
    console.log();

    // Execute withdrawal
    subheader('Executing Withdrawal');
    try {
      const tx = await gameContract.withdrawUSDCFees({ gasLimit: 300000 });
      info('TX Hash', tx.hash);
      console.log('Waiting for confirmation...');

      const receipt = await tx.wait();
      success(`Confirmed in block ${receipt.blockNumber}`);
      console.log();

      // Check new balance
      const [newFeesA, newFeesB] = await Promise.all([
        gameContract.accumulatedUSDCFees(),
        gameContract.accumulatedUSDCFeesB().catch(() => hre.ethers.BigNumber.from(0)),
      ]);

      subheader('Result');
      info('Previous Fees (A)', formatUSDC(accumulatedFeesA));
      info('New Fees (A)', formatUSDC(newFeesA));
      info('Previous Fees (B)', formatUSDC(accumulatedFeesB));
      info('New Fees (B)', formatUSDC(newFeesB));
      info('Total Withdrawn', formatUSDC(totalFees.sub(newFeesA).sub(newFeesB)));
      success('Withdrawal complete!');
    } catch (err) {
      error(`Withdrawal failed: ${err.message}`);
      throw err;
    }
  });

module.exports = {};
