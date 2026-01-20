/**
 * Token Balance Hooks
 *
 * Hooks for fetching APE and USDC.e token balances.
 * Uses the existing useTokenBalance hook under the hood.
 *
 * Usage:
 * ```tsx
 * import { useApeBalance, useUsdcBalance } from '../hooks/useTokenBalances';
 *
 * function MyComponent() {
 *   const { account } = useActiveWeb3React();
 *   const { balance: apeBalance, isLoading: apeLoading } = useApeBalance(account);
 *   const { balance: usdcBalance, isLoading: usdcLoading } = useUsdcBalance(account);
 *
 *   return (
 *     <div>
 *       <p>APE: {apeBalance.toFixed(2)}</p>
 *       <p>USDC: ${usdcBalance.toFixed(2)}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useTokenBalance } from './useTokenBalance';

// ============================================================
// TOKEN ADDRESSES (from contracts/addresses.json)
// ============================================================

/**
 * Token contract addresses on ApeChain Mainnet.
 */
export const TOKEN_ADDRESSES = {
  /** USDC.e (Stargate Bridged USDC) */
  USDC: '0xF1815bd50389c46847f0Bda824eC8da914045D14' as const,
  /** ApeCoin (Native) */
  APE: '0x4d224452801aced8b2f0aebe155379bb5d594381' as const,
} as const;

/**
 * Token decimals for balance formatting.
 */
export const TOKEN_DECIMALS = {
  USDC: 6,
  APE: 18,
} as const;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TokenBalanceResult {
  /** Formatted balance (human-readable, e.g., 100.50) */
  balance: number;
  /** Raw balance in smallest unit (wei for APE, 6 decimals for USDC) */
  raw: bigint | undefined;
  /** Whether the balance is currently loading */
  isLoading: boolean;
  /** Function to manually refetch the balance */
  refetch: () => void;
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook for APE token balance.
 *
 * @param address - Wallet address to fetch balance for
 * @returns Formatted APE balance, raw value, loading state, and refetch function
 */
export function useApeBalance(address?: `0x${string}`): TokenBalanceResult {
  const { data, isLoading, refetch } = useTokenBalance(
    address ? TOKEN_ADDRESSES.APE : undefined
  );

  const formatted = useMemo(() => {
    if (!data) return 0;
    return Number(data) / Math.pow(10, TOKEN_DECIMALS.APE);
  }, [data]);

  return {
    balance: formatted,
    raw: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Hook for USDC.e token balance.
 *
 * @param address - Wallet address to fetch balance for
 * @returns Formatted USDC balance, raw value, loading state, and refetch function
 */
export function useUsdcBalance(address?: `0x${string}`): TokenBalanceResult {
  const { data, isLoading, refetch } = useTokenBalance(
    address ? TOKEN_ADDRESSES.USDC : undefined
  );

  const formatted = useMemo(() => {
    if (!data) return 0;
    return Number(data) / Math.pow(10, TOKEN_DECIMALS.USDC);
  }, [data]);

  return {
    balance: formatted,
    raw: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Hook for both APE and USDC.e balances at once.
 * Useful when you need both balances in a component.
 *
 * @param address - Wallet address to fetch balances for
 * @returns Object with both token balances
 */
export function useTokenBalances(address?: `0x${string}`) {
  const ape = useApeBalance(address);
  const usdc = useUsdcBalance(address);

  return {
    ape,
    usdc,
    isLoading: ape.isLoading || usdc.isLoading,
    refetchAll: () => {
      ape.refetch();
      usdc.refetch();
    },
  };
}
