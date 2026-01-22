/**
 * useTokenApproval Hook
 *
 * Hook for checking and requesting ERC-20 token approval for PokeballGame contract.
 * Both APE and USDC.e require approval before the contract can transfer them.
 *
 * Usage:
 * ```tsx
 * const {
 *   allowance,
 *   isApproved,
 *   approve,
 *   isApproving,
 *   refetch,
 * } = useTokenApproval('APE', totalCostWei);
 *
 * // Check if approval is needed
 * if (!isApproved) {
 *   await approve();
 * }
 *
 * // Then proceed with purchase
 * purchaseBalls(ballType, quantity, true);
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, maxUint256 } from 'viem';
import { useActiveWeb3React } from '../useActiveWeb3React';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_CHAIN_ID,
  RELATED_CONTRACTS,
  type BallType,
} from './pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type TokenType = 'APE' | 'USDC';

export interface UseTokenApprovalReturn {
  /** Current allowance in wei */
  allowance: bigint;
  /** Whether the current allowance covers the required amount */
  isApproved: boolean;
  /** Function to request unlimited approval */
  approve: () => void;
  /** Whether approval transaction is pending */
  isApproving: boolean;
  /** Whether approval transaction is being confirmed */
  isConfirming: boolean;
  /** Error from approval transaction */
  error: Error | undefined;
  /** Approval transaction hash */
  hash: `0x${string}` | undefined;
  /** Refetch the current allowance */
  refetch: () => void;
  /** Whether allowance is loading */
  isLoading: boolean;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get ball price in the smallest unit (wei for APE, micro for USDC).
 * Matches contract constants.
 */
export function getBallPriceInWei(ballType: BallType, useAPE: boolean, apePriceUSD8Decimals: bigint = BigInt(64000000)): bigint {
  // Prices in USDC.e (6 decimals) - matching contract
  const BALL_PRICES_USDC: Record<BallType, bigint> = {
    0: BigInt(1_000_000),    // $1.00 = 1e6
    1: BigInt(10_000_000),   // $10.00 = 10e6
    2: BigInt(25_000_000),   // $25.00 = 25e6
    3: BigInt(49_900_000),   // $49.90 = 49.9e6
  };

  const priceUSDC = BALL_PRICES_USDC[ballType];

  if (!useAPE) {
    return priceUSDC;
  }

  // Convert USDC to APE using the formula from contract:
  // apeAmount = (usdcAmount * 10^20) / apePriceUSD
  // apePriceUSD is 8 decimals (e.g., $0.64 = 64000000)
  const apeAmount = (priceUSDC * BigInt(10 ** 20)) / apePriceUSD8Decimals;
  return apeAmount;
}

/**
 * Calculate total cost for a purchase.
 * Safe: returns BigInt(0) for invalid/NaN/negative quantities.
 */
export function calculateTotalCost(
  ballType: BallType,
  quantity: number,
  useAPE: boolean,
  apePriceUSD8Decimals: bigint = BigInt(64000000)
): bigint {
  // Guard against NaN, undefined, null, negative, or non-integer values
  const safeQuantity = Number.isFinite(quantity) && quantity > 0
    ? Math.floor(quantity)
    : 0;

  if (safeQuantity === 0) {
    return BigInt(0);
  }

  const pricePerBall = getBallPriceInWei(ballType, useAPE, apePriceUSD8Decimals);
  return pricePerBall * BigInt(safeQuantity);
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook for checking and requesting token approval for PokeballGame.
 *
 * @param tokenType - 'APE' or 'USDC'
 * @param requiredAmount - Amount needed in wei (0 to just check current allowance)
 * @returns Object with allowance info, approve function, and loading states
 */
export function useTokenApproval(
  tokenType: TokenType,
  requiredAmount: bigint = BigInt(0)
): UseTokenApprovalReturn {
  const { account } = useActiveWeb3React();

  const tokenAddress = tokenType === 'APE' ? RELATED_CONTRACTS.APE : RELATED_CONTRACTS.USDC;
  const spender = POKEBALL_GAME_ADDRESS;

  // Read current allowance
  const {
    data: allowanceData,
    isLoading,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: account && spender ? [account, spender] : undefined,
    chainId: POKEBALL_GAME_CHAIN_ID,
    query: {
      enabled: !!account && !!spender,
    },
  });

  const allowance = (allowanceData as bigint) ?? BigInt(0);

  // Check if approved for required amount
  const isApproved = useMemo(() => {
    if (requiredAmount === BigInt(0)) return true;
    return allowance >= requiredAmount;
  }, [allowance, requiredAmount]);

  // Write contract for approval
  const {
    writeContract,
    isPending: isApproving,
    error: writeError,
    data: writeHash,
  } = useWriteContract();

  // Wait for confirmation
  const {
    isLoading: isConfirming,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: writeHash,
    chainId: POKEBALL_GAME_CHAIN_ID,
  });

  // Approve function - requests unlimited approval
  const approve = useCallback(() => {
    if (!spender) {
      console.error('[useTokenApproval] Contract address not configured');
      return;
    }

    console.log('[useTokenApproval] Requesting approval:', {
      token: tokenType,
      tokenAddress,
      spender,
      amount: 'unlimited',
    });

    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, maxUint256],
      chainId: POKEBALL_GAME_CHAIN_ID,
    });
  }, [tokenType, tokenAddress, spender, writeContract]);

  const error = writeError || confirmError || undefined;

  return {
    allowance,
    isApproved,
    approve,
    isApproving,
    isConfirming,
    error,
    hash: writeHash,
    refetch,
    isLoading,
  };
}

/**
 * Hook for APE token approval specifically.
 */
export function useApeApproval(requiredAmount: bigint = BigInt(0)) {
  return useTokenApproval('APE', requiredAmount);
}

/**
 * Hook for USDC.e token approval specifically.
 */
export function useUsdcApproval(requiredAmount: bigint = BigInt(0)) {
  return useTokenApproval('USDC', requiredAmount);
}

/**
 * Hook to read the APE price from the contract.
 * Returns the price in 8 decimals (e.g., $0.64 = 64000000).
 */
export function useApePriceFromContract(): {
  price: bigint;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useReadContract({
    address: POKEBALL_GAME_ADDRESS,
    abi: [
      {
        name: 'apePriceUSD',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
      },
    ],
    functionName: 'apePriceUSD',
    chainId: POKEBALL_GAME_CHAIN_ID,
    query: {
      enabled: !!POKEBALL_GAME_ADDRESS,
    },
  });

  return {
    price: (data as bigint) ?? BigInt(64000000), // Default to $0.64
    isLoading,
    error: error || null,
  };
}

export default useTokenApproval;
