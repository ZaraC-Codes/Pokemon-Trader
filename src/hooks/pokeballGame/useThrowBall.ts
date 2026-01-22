/**
 * useThrowBall Hook
 *
 * Hook for throwing a PokeBall at a Pokemon in the PokeballGame contract.
 * Initiates a catch attempt which triggers a VRNG callback.
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
 * } = useThrowBall();
 *
 * // Throw a Great Ball at Pokemon in slot 0
 * const handleThrow = () => {
 *   if (write) {
 *     write(0, 1); // pokemonSlot=0, ballType=1 (Great Ball)
 *   }
 * };
 *
 * // Monitor the request ID for VRNG callback
 * useEffect(() => {
 *   if (requestId) {
 *     console.log('Waiting for VRNG result:', requestId);
 *   }
 * }, [requestId]);
 * ```
 *
 * Note: The contract uses pokemonSlot (0-19), not pokemonId directly.
 * Use useGetPokemonSpawns to get the slot index for a Pokemon.
 */

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
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
   * VRNG request ID from the ThrowAttempted event.
   * Use this to track the catch result via VRNG callback.
   */
  requestId: bigint | undefined;

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
 * @returns Object with write function, loading states, error, hash, receipt, and requestId
 */
export function useThrowBall(): UseThrowBallReturn {
  const { isConfigured } = usePokeballGameAddress();
  const publicClient = usePublicClient({ chainId: POKEBALL_GAME_CHAIN_ID });

  // Track the current transaction hash and request ID
  const [currentHash, setCurrentHash] = useState<`0x${string}` | undefined>(undefined);
  const [requestId, setRequestId] = useState<bigint | undefined>(undefined);

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

  // Write function
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

      console.log('[useThrowBall] Throwing ball:', {
        pokemonSlot,
        ballType,
        address: POKEBALL_GAME_ADDRESS,
      });

      writeContract({
        address: POKEBALL_GAME_ADDRESS,
        abi: POKEBALL_GAME_ABI,
        functionName: 'throwBall',
        args: [pokemonSlot, ballType],
        chainId: POKEBALL_GAME_CHAIN_ID,
      });
    },
    [writeContract]
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
    reset,
  };
}

export default useThrowBall;
