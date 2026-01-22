/**
 * usePurchaseBalls Hook
 *
 * Hook for purchasing PokeBalls from the PokeballGame contract.
 * Supports both APE and USDC.e payment methods.
 *
 * IMPORTANT: Both APE and USDC.e are ERC-20 tokens that require approval
 * before the contract can transfer them. Use useTokenApproval to check
 * and request approval before purchasing.
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
 * // Purchase 5 Great Balls with USDC.e
 * const handlePurchase = () => {
 *   if (write) {
 *     write(1, 5, false); // ballType=1 (Great Ball), quantity=5, useAPE=false
 *   }
 * };
 *
 * // Purchase 10 Poke Balls with APE
 * const handlePurchaseAPE = () => {
 *   if (write) {
 *     write(0, 10, true); // ballType=0 (Poke Ball), quantity=10, useAPE=true
 *   }
 * };
 * ```
 *
 * Note: The caller is responsible for approving USDC.e or APE tokens
 * before calling this hook. Use useTokenApproval from this package.
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
   * @param useAPE - If true, pay with APE token; if false, pay with USDC.e
   */
  write: ((ballType: BallType, quantity: number, useAPE: boolean) => void) | undefined;

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
    (ballType: BallType, quantity: number, useAPE: boolean) => {
      if (!POKEBALL_GAME_ADDRESS) {
        console.error('[usePurchaseBalls] Contract address not configured');
        return;
      }

      if (quantity <= 0) {
        console.error('[usePurchaseBalls] Quantity must be greater than 0');
        return;
      }

      // Calculate expected cost for logging (using default APE price)
      // Prices in USDC.e (6 decimals)
      const BALL_PRICES_USDC: Record<BallType, bigint> = {
        0: BigInt(1_000_000),    // $1.00
        1: BigInt(10_000_000),   // $10.00
        2: BigInt(25_000_000),   // $25.00
        3: BigInt(49_900_000),   // $49.90
      };
      const pricePerBallUSDC = BALL_PRICES_USDC[ballType];
      const totalCostUSDC = pricePerBallUSDC * BigInt(quantity);

      // If using APE, convert USDC cost to APE (approximate, actual uses contract's apePriceUSD)
      // Formula: apeAmount = (usdcAmount * 10^20) / apePriceUSD
      // Assuming ~$0.64 APE price (64000000 in 8 decimals)
      const apePriceUSD8Dec = BigInt(64000000);
      const totalCostAPE = useAPE
        ? (totalCostUSDC * BigInt(10 ** 20)) / apePriceUSD8Dec
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
          note: 'APE cost is estimated. Actual uses contract apePriceUSD.',
        }),
      });

      console.log('[usePurchaseBalls] IMPORTANT: Ensure token approval before this call!');
      console.log(`[usePurchaseBalls] Token to approve: ${useAPE ? 'APE' : 'USDC.e'}`);
      console.log(`[usePurchaseBalls] Spender: ${POKEBALL_GAME_ADDRESS}`);
      console.log(`[usePurchaseBalls] Min amount needed: ${useAPE ? totalCostAPE.toString() : totalCostUSDC.toString()} wei`);

      writeContract({
        address: POKEBALL_GAME_ADDRESS,
        abi: POKEBALL_GAME_ABI,
        functionName: 'purchaseBalls',
        args: [ballType, BigInt(quantity), useAPE],
        chainId: POKEBALL_GAME_CHAIN_ID,
      });
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
