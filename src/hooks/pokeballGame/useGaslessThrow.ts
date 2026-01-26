/**
 * useGaslessThrow Hook
 *
 * Hook for throwing a PokeBall at a Pokemon using gasless meta-transactions (v1.8.0).
 * The player signs a message, and a relayer submits the transaction on their behalf.
 *
 * This replaces the user-paid throwBall() flow with the relayer-paid throwBallFor() pattern.
 *
 * Flow:
 * 1. Player clicks "Throw" button
 * 2. Frontend fetches player's current nonce from contract
 * 3. Player signs EIP-712 typed message (no wallet gas popup)
 * 4. Frontend POSTs signature + params to relayer API
 * 5. Relayer validates signature, calls throwBallFor() on-chain
 * 6. Player sees catch result via contract events
 *
 * Usage:
 * ```tsx
 * const {
 *   initiateThrow,
 *   isLoading,
 *   isPending,
 *   error,
 *   throwStatus,
 * } = useGaslessThrow();
 *
 * // Player presses throw button
 * const handleThrow = async () => {
 *   const success = await initiateThrow(0, 1); // slot=0, ballType=1
 *   if (success) {
 *     // Throw submitted to relayer, wait for events
 *   }
 * };
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useAccount, usePublicClient, useSignTypedData, useReadContract } from 'wagmi';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
  MAX_ACTIVE_POKEMON,
  type BallType,
} from './pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ThrowStatus =
  | 'idle'
  | 'fetching_nonce'
  | 'signing'
  | 'submitting'
  | 'pending'
  | 'success'
  | 'error';

export interface GaslessThrowPayload {
  player: `0x${string}`;
  pokemonSlot: number;
  ballType: BallType;
  nonce: bigint;
  signature: `0x${string}`;
}

export interface UseGaslessThrowReturn {
  /**
   * Initiate a gasless throw. Returns true if the request was submitted successfully.
   * The actual catch result will come through contract events.
   */
  initiateThrow: (pokemonSlot: number, ballType: BallType) => Promise<boolean>;

  /** Current status of the throw process */
  throwStatus: ThrowStatus;

  /** Whether any part of the throw process is in progress */
  isLoading: boolean;

  /** Whether waiting for relayer submission confirmation */
  isPending: boolean;

  /** Error message if something went wrong */
  error: string | null;

  /** Reset the hook state */
  reset: () => void;

  /** The transaction hash from the relayer (if available) */
  txHash: `0x${string}` | undefined;

  /** The request ID / sequence number (if available) */
  requestId: bigint | undefined;
}

// ============================================================
// CONFIG
// ============================================================

/**
 * Relayer API endpoint. Can be configured via environment variable.
 * Default is a local development endpoint.
 */
const RELAYER_API_URL = import.meta.env.VITE_RELAYER_API_URL || '/api/throwBallFor';

/**
 * Timeout for relayer API requests (milliseconds).
 */
const RELAYER_TIMEOUT_MS = 30_000;

/**
 * EIP-712 domain for the PokeballGame contract.
 * Must match the contract's domain separator exactly.
 */
const EIP712_DOMAIN = {
  name: 'PokeballGame',
  version: '1',
  chainId: POKEBALL_GAME_CHAIN_ID,
  verifyingContract: POKEBALL_GAME_ADDRESS!,
} as const;

/**
 * EIP-712 types for the throwBallFor message.
 * Must match the contract's type hash exactly.
 */
const EIP712_TYPES = {
  ThrowBall: [
    { name: 'player', type: 'address' },
    { name: 'pokemonSlot', type: 'uint8' },
    { name: 'ballType', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

export function useGaslessThrow(): UseGaslessThrowReturn {
  const { address: playerAddress, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: POKEBALL_GAME_CHAIN_ID });

  // State
  const [throwStatus, setThrowStatus] = useState<ThrowStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [requestId, setRequestId] = useState<bigint | undefined>(undefined);

  // Guard against duplicate requests
  const isProcessingRef = useRef(false);

  // Wagmi sign typed data hook
  const { signTypedDataAsync } = useSignTypedData();

  // Read player's current nonce from contract
  const {
    data: currentNonce,
    refetch: refetchNonce,
  } = useReadContract({
    address: POKEBALL_GAME_ADDRESS,
    abi: POKEBALL_GAME_ABI,
    functionName: 'getPlayerNonce',
    args: playerAddress ? [playerAddress] : undefined,
    chainId: POKEBALL_GAME_CHAIN_ID,
    query: {
      enabled: !!POKEBALL_GAME_ADDRESS && !!playerAddress,
      staleTime: 5_000, // Refresh nonce frequently
    },
  });

  /**
   * Main throw function - handles the entire gasless flow.
   */
  const initiateThrow = useCallback(
    async (pokemonSlot: number, ballType: BallType): Promise<boolean> => {
      // Guard against duplicate requests
      if (isProcessingRef.current) {
        console.warn('[useGaslessThrow] Already processing a throw, ignoring duplicate request');
        return false;
      }

      // Validation
      if (!POKEBALL_GAME_ADDRESS) {
        setError('Contract address not configured');
        setThrowStatus('error');
        return false;
      }

      if (!isConnected || !playerAddress) {
        setError('Wallet not connected');
        setThrowStatus('error');
        return false;
      }

      if (pokemonSlot < 0 || pokemonSlot >= MAX_ACTIVE_POKEMON) {
        setError(`Invalid pokemon slot (must be 0-${MAX_ACTIVE_POKEMON - 1})`);
        setThrowStatus('error');
        return false;
      }

      if (ballType < 0 || ballType > 3) {
        setError('Invalid ball type');
        setThrowStatus('error');
        return false;
      }

      isProcessingRef.current = true;
      setError(null);
      setTxHash(undefined);
      setRequestId(undefined);

      try {
        // Step 1: Fetch current nonce
        setThrowStatus('fetching_nonce');
        console.log('[useGaslessThrow] Fetching player nonce...');

        const { data: freshNonce } = await refetchNonce();
        const nonce = (freshNonce as bigint) ?? BigInt(0);

        console.log('[useGaslessThrow] Player nonce:', nonce.toString());

        // Step 2: Sign EIP-712 message
        setThrowStatus('signing');
        console.log('[useGaslessThrow] Requesting signature...');

        const message = {
          player: playerAddress,
          pokemonSlot,
          ballType,
          nonce,
        };

        let signature: `0x${string}`;
        try {
          signature = await signTypedDataAsync({
            domain: EIP712_DOMAIN,
            types: EIP712_TYPES,
            primaryType: 'ThrowBall',
            message,
          });
          console.log('[useGaslessThrow] Got signature:', signature.slice(0, 20) + '...');
        } catch (signError) {
          const signMsg = signError instanceof Error ? signError.message : 'User rejected signature';
          console.error('[useGaslessThrow] Signature failed:', signMsg);
          setError(signMsg.includes('rejected') ? 'Signature request cancelled' : signMsg);
          setThrowStatus('error');
          return false;
        }

        // Step 3: Submit to relayer
        setThrowStatus('submitting');
        console.log('[useGaslessThrow] Submitting to relayer...');

        const payload: GaslessThrowPayload = {
          player: playerAddress,
          pokemonSlot,
          ballType,
          nonce,
          signature,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RELAYER_TIMEOUT_MS);

        try {
          const response = await fetch(RELAYER_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...payload,
              nonce: payload.nonce.toString(), // Serialize bigint
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || errorData.message || `Relayer error: ${response.status}`;
            console.error('[useGaslessThrow] Relayer error:', errorMsg);
            setError(errorMsg);
            setThrowStatus('error');
            return false;
          }

          const result = await response.json();
          console.log('[useGaslessThrow] Relayer response:', result);

          // Extract transaction hash and request ID if available
          if (result.txHash) {
            setTxHash(result.txHash as `0x${string}`);
          }
          if (result.requestId) {
            setRequestId(BigInt(result.requestId));
          }

          setThrowStatus('pending');
          console.log('[useGaslessThrow] Throw submitted successfully, waiting for events...');

          return true;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          const fetchMsg = fetchError instanceof Error ? fetchError.message : 'Network error';

          if (fetchMsg.includes('abort') || fetchMsg.includes('timeout')) {
            setError('Relayer request timed out. Please try again.');
          } else {
            setError(`Failed to reach relayer: ${fetchMsg}`);
          }

          console.error('[useGaslessThrow] Fetch error:', fetchError);
          setThrowStatus('error');
          return false;
        }
      } catch (unexpectedError) {
        const msg = unexpectedError instanceof Error ? unexpectedError.message : 'Unexpected error';
        console.error('[useGaslessThrow] Unexpected error:', unexpectedError);
        setError(msg);
        setThrowStatus('error');
        return false;
      } finally {
        isProcessingRef.current = false;
      }
    },
    [playerAddress, isConnected, signTypedDataAsync, refetchNonce]
  );

  /**
   * Reset hook state.
   */
  const reset = useCallback(() => {
    setThrowStatus('idle');
    setError(null);
    setTxHash(undefined);
    setRequestId(undefined);
    isProcessingRef.current = false;
  }, []);

  // Derived state
  const isLoading = ['fetching_nonce', 'signing', 'submitting'].includes(throwStatus);
  const isPending = throwStatus === 'pending';

  return {
    initiateThrow,
    throwStatus,
    isLoading,
    isPending,
    error,
    reset,
    txHash,
    requestId,
  };
}

export default useGaslessThrow;
