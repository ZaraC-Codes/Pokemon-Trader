/**
 * useThrowBall Hook
 *
 * Hook for throwing a PokeBall at a Pokemon in the PokeballGame contract.
 * Initiates a catch attempt which triggers a Pyth Entropy callback.
 *
 * v1.6.0: throwBall() is now PAYABLE and requires msg.value for the Entropy fee.
 * The hook automatically fetches and includes the fee.
 *
 * Usage:
 * ```tsx
 * const {
 *   write,
 *   isLoading,
 *   isPending,
 *   error,
 *   hash,
 *   requestId,
 *   throwFee,
 * } = useThrowBall();
 *
 * // Throw a Great Ball at Pokemon in slot 0
 * const handleThrow = () => {
 *   if (write) {
 *     write(0, 1); // pokemonSlot=0, ballType=1 (Great Ball)
 *   }
 * };
 *
 * // Monitor the request ID for Entropy callback
 * useEffect(() => {
 *   if (requestId) {
 *     console.log('Waiting for Entropy result:', requestId);
 *   }
 * }, [requestId]);
 * ```
 *
 * Note: The contract uses pokemonSlot (0-19), not pokemonId directly.
 * Use useGetPokemonSpawns to get the slot index for a Pokemon.
 */

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract } from 'wagmi';
import { decodeEventLog, type TransactionReceipt } from 'viem';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
  MAX_ACTIVE_POKEMON,
  usePokeballGameAddress,
  type BallType,
} from './pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface UseThrowBallReturn {
  /**
   * Function to throw a ball at a Pokemon.
   * @param pokemonSlot - Pokemon slot index (0-19)
   * @param ballType - Ball type to throw (0-3)
   */
  write: ((pokemonSlot: number, ballType: BallType) => void) | undefined;

  /**
   * Whether the transaction is currently being processed.
   */
  isLoading: boolean;

  /**
   * Whether the transaction is pending submission.
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
   * Entropy sequence number from the ThrowAttempted event (v1.6.0).
   * Use this to track the catch result via Entropy callback.
   */
  requestId: bigint | undefined;

  /**
   * Current throw fee required by Pyth Entropy (in wei).
   * This is automatically included when calling write().
   */
  throwFee: bigint | undefined;

  /**
   * Whether the throw fee is being loaded.
   */
  isFeeLoading: boolean;

  /**
   * Reset the hook state to initial values.
   */
  reset: () => void;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook for throwing a PokeBall at a Pokemon.
 *
 * @returns Object with write function, loading states, error, hash, receipt, requestId, and throwFee
 */
export function useThrowBall(): UseThrowBallReturn {
  const { isConfigured } = usePokeballGameAddress();
  const publicClient = usePublicClient({ chainId: POKEBALL_GAME_CHAIN_ID });

  // Track the current transaction hash and request ID
  const [currentHash, setCurrentHash] = useState<`0x${string}` | undefined>(undefined);
  const [requestId, setRequestId] = useState<bigint | undefined>(undefined);

  // Fetch the current throw fee from contract (v1.6.0 - Pyth Entropy)
  const {
    data: throwFee,
    isLoading: isFeeLoading,
    refetch: refetchFee,
  } = useReadContract({
    address: POKEBALL_GAME_ADDRESS,
    abi: POKEBALL_GAME_ABI,
    functionName: 'getThrowFee',
    chainId: POKEBALL_GAME_CHAIN_ID,
    query: {
      enabled: isConfigured,
      staleTime: 30_000, // Refresh every 30 seconds
    },
  });

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
  useEffect(() => {
    if (writeHash && writeHash !== currentHash) {
      setCurrentHash(writeHash);
      setRequestId(undefined); // Reset request ID for new transaction
    }
  }, [writeHash, currentHash]);

  // Extract requestId from ThrowAttempted event in receipt
  useEffect(() => {
    if (receipt && receipt.logs && !requestId) {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: POKEBALL_GAME_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'ThrowAttempted') {
            const args = decoded.args as {
              thrower: `0x${string}`;
              pokemonId: bigint;
              ballTier: number;
              requestId: bigint;
            };
            console.log('[useThrowBall] ThrowAttempted event:', args);
            setRequestId(args.requestId);
            break;
          }
        } catch {
          // Not a matching event, continue
        }
      }
    }
  }, [receipt, requestId]);

  // Combined loading state
  const isLoading = isWritePending || isReceiptLoading;

  // Combined error
  const error = writeError || receiptError || undefined;

  // Write function - includes Entropy fee as msg.value (v1.6.0)
  const write = useCallback(
    (pokemonSlot: number, ballType: BallType) => {
      if (!POKEBALL_GAME_ADDRESS) {
        console.error('[useThrowBall] Contract address not configured');
        return;
      }

      if (pokemonSlot < 0 || pokemonSlot >= MAX_ACTIVE_POKEMON) {
        console.error(`[useThrowBall] Invalid pokemon slot (must be 0-${MAX_ACTIVE_POKEMON - 1}):`, pokemonSlot);
        return;
      }

      // Add 10% buffer to the fee to account for potential fee changes between read and write
      const fee = throwFee as bigint | undefined;
      const feeToSend = fee ? (fee * 110n) / 100n : 0n;

      console.log('[useThrowBall] Throwing ball:', {
        pokemonSlot,
        ballType,
        address: POKEBALL_GAME_ADDRESS,
        throwFee: throwFee?.toString(),
        feeWithBuffer: feeToSend.toString(),
      });

      if (feeToSend === 0n) {
        console.warn('[useThrowBall] Warning: throwFee is 0, transaction may fail');
      }

      writeContract({
        address: POKEBALL_GAME_ADDRESS,
        abi: POKEBALL_GAME_ABI,
        functionName: 'throwBall',
        args: [pokemonSlot, ballType],
        chainId: POKEBALL_GAME_CHAIN_ID,
        value: feeToSend, // v1.6.0: Include Entropy fee
      });
    },
    [writeContract, throwFee]
  );

  // Reset function
  const reset = useCallback(() => {
    setCurrentHash(undefined);
    setRequestId(undefined);
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
      requestId: undefined,
      throwFee: undefined,
      isFeeLoading: false,
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
    requestId,
    throwFee: throwFee as bigint | undefined,
    isFeeLoading,
    reset,
  };
}

export default useThrowBall;
