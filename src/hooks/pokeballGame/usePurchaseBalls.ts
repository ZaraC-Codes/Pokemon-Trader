/**
 * usePurchaseBalls Hook
 *
 * Hook for purchasing PokeBalls from the PokeballGame contract (v1.4.0+).
 * Supports both native APE and USDC.e payment methods.
 *
 * PAYMENT METHODS (v1.4.0):
 * - APE: Uses native APE via msg.value (like ETH on Ethereum). NO approval needed.
 * - USDC.e: Uses ERC-20 transferFrom. Requires approval via useTokenApproval.
 *
 * Usage:
 * ```tsx
 * const {
 *   write,
 *   isLoading,
 *   isPending,
 *   error,
 *   hash,
 *   receipt,
 * } = usePurchaseBalls();
 *
 * // Purchase 5 Great Balls with USDC.e (requires prior approval)
 * const handlePurchase = () => {
 *   if (write) {
 *     write(1, 5, false); // ballType=1 (Great Ball), quantity=5, useAPE=false
 *   }
 * };
 *
 * // Purchase 10 Poke Balls with native APE (no approval needed!)
 * const handlePurchaseAPE = () => {
 *   if (write) {
 *     write(0, 10, true); // ballType=0 (Poke Ball), quantity=10, useAPE=true
 *     // The hook automatically calculates and sends msg.value
 *   }
 * };
 * ```
 *
 * Note: Only USDC.e requires approval. APE payments send native currency directly.
 */

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { TransactionReceipt } from 'viem';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
  usePokeballGameAddress,
  type BallType,
} from './pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface UsePurchaseBallsReturn {
  /**
   * Function to initiate the purchase transaction.
   * @param ballType - Ball type (0-3)
   * @param quantity - Number of balls to purchase
   * @param useAPE - If true, pay with native APE; if false, pay with USDC.e
   * @param apePriceUSD8Dec - Optional APE price in 8 decimals for accurate APE cost calculation
   */
  write: ((ballType: BallType, quantity: number, useAPE: boolean, apePriceUSD8Dec?: bigint) => void) | undefined;

  /**
   * Whether the transaction is currently being submitted to the network.
   */
  isLoading: boolean;

  /**
   * Whether the transaction is pending confirmation (submitted but not yet mined).
   */
  isPending: boolean;

  /**
   * Error from the transaction, if any.
   */
  error: Error | undefined;

  /**
   * Transaction hash after submission.
   */
  hash: `0x${string}` | undefined;

  /**
   * Transaction receipt after confirmation.
   */
  receipt: TransactionReceipt | undefined;

  /**
   * Reset the hook state to initial values.
   */
  reset: () => void;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook for purchasing PokeBalls from the PokeballGame contract.
 *
 * @returns Object with write function, loading states, error, hash, and receipt
 */
export function usePurchaseBalls(): UsePurchaseBallsReturn {
  const { isConfigured } = usePokeballGameAddress();

  // Track the current transaction hash for receipt fetching
  const [currentHash, setCurrentHash] = useState<`0x${string}` | undefined>(undefined);

  // Wagmi write contract hook
  const {
    writeContract,
    isPending: isWritePending,
    error: writeError,
    data: writeHash,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction receipt
  const {
    data: receipt,
    isLoading: isReceiptLoading,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: currentHash,
    chainId: POKEBALL_GAME_CHAIN_ID,
  });

  // Update current hash when write succeeds
  if (writeHash && writeHash !== currentHash) {
    setCurrentHash(writeHash);
  }

  // Combined loading state
  const isLoading = isWritePending || isReceiptLoading;

  // Combined error
  const error = writeError || receiptError || undefined;

  // Write function
  const write = useCallback(
    (ballType: BallType, quantity: number, useAPE: boolean, apePriceUSD8Dec?: bigint) => {
      if (!POKEBALL_GAME_ADDRESS) {
        console.error('[usePurchaseBalls] Contract address not configured');
        return;
      }

      if (quantity <= 0) {
        console.error('[usePurchaseBalls] Quantity must be greater than 0');
        return;
      }

      // Calculate expected cost for logging and msg.value
      // Prices in USDC.e (6 decimals)
      const BALL_PRICES_USDC: Record<BallType, bigint> = {
        0: BigInt(1_000_000),    // $1.00
        1: BigInt(10_000_000),   // $10.00
        2: BigInt(25_000_000),   // $25.00
        3: BigInt(49_900_000),   // $49.90
      };
      const pricePerBallUSDC = BALL_PRICES_USDC[ballType];
      const totalCostUSDC = pricePerBallUSDC * BigInt(quantity);

      // Use provided APE price or default to ~$0.64 (64000000 in 8 decimals)
      const effectiveApePriceUSD = apePriceUSD8Dec && apePriceUSD8Dec > 0n
        ? apePriceUSD8Dec
        : BigInt(64000000);

      // If using APE, convert USDC cost to APE
      // Formula: apeAmount = (usdcAmount * 10^20) / apePriceUSD
      // Add 5% buffer for price fluctuations and rounding
      const totalCostAPE = useAPE
        ? ((totalCostUSDC * BigInt(10 ** 20)) / effectiveApePriceUSD) * BigInt(105) / BigInt(100)
        : BigInt(0);

      console.log('[usePurchaseBalls] Purchasing balls:', {
        ballType,
        quantity,
        useAPE,
        address: POKEBALL_GAME_ADDRESS,
        pricePerBallUSD: Number(pricePerBallUSDC) / 1_000_000,
        totalCostUSD: Number(totalCostUSDC) / 1_000_000,
        totalCostUSDCWei: totalCostUSDC.toString(),
        ...(useAPE && {
          estimatedAPECost: Number(totalCostAPE) / 1e18,
          totalCostAPEWei: totalCostAPE.toString(),
          apePriceUSD: Number(effectiveApePriceUSD) / 1e8,
          note: 'Sending native APE via msg.value (5% buffer included for price safety)',
        }),
      });

      if (useAPE) {
        // v1.4.0: APE payments use native APE via msg.value - NO approval needed!
        console.log('[usePurchaseBalls] Using native APE payment (no approval required)');
        console.log(`[usePurchaseBalls] Sending ${Number(totalCostAPE) / 1e18} APE via msg.value`);

        writeContract({
          address: POKEBALL_GAME_ADDRESS,
          abi: POKEBALL_GAME_ABI,
          functionName: 'purchaseBalls',
          args: [ballType, BigInt(quantity), true],
          value: totalCostAPE, // Native APE sent via msg.value
          chainId: POKEBALL_GAME_CHAIN_ID,
        });
      } else {
        // USDC.e payments use ERC-20 transferFrom - requires prior approval
        console.log('[usePurchaseBalls] Using USDC.e payment (requires ERC-20 approval)');
        console.log(`[usePurchaseBalls] Ensure USDC.e approval for ${POKEBALL_GAME_ADDRESS}`);

        writeContract({
          address: POKEBALL_GAME_ADDRESS,
          abi: POKEBALL_GAME_ABI,
          functionName: 'purchaseBalls',
          args: [ballType, BigInt(quantity), false],
          chainId: POKEBALL_GAME_CHAIN_ID,
        });
      }
    },
    [writeContract]
  );

  // Reset function
  const reset = useCallback(() => {
    setCurrentHash(undefined);
    resetWrite();
  }, [resetWrite]);

  // Return safe defaults if contract not configured
  if (!isConfigured) {
    return {
      write: undefined,
      isLoading: false,
      isPending: false,
      error: undefined,
      hash: undefined,
      receipt: undefined,
      reset: () => {},
    };
  }

  return {
    write,
    isLoading,
    isPending: isWritePending,
    error,
    hash: currentHash,
    receipt,
    reset,
  };
}

export default usePurchaseBalls;
