/**
 * useContractDiagnostics Hook
 *
 * Provides environment sanity checks and diagnostics for the PokeballGame and SlabNFTManager contracts.
 * Used to detect misconfiguration issues before they cause transaction failures.
 *
 * Usage:
 * ```tsx
 * const {
 *   apePriceUSD,
 *   pullPrice,
 *   slabNFTManagerBalance,
 *   hasWarnings,
 *   warnings,
 *   isLoading,
 * } = useContractDiagnostics();
 *
 * if (hasWarnings) {
 *   console.warn('Contract config issues:', warnings);
 * }
 * ```
 */

import { useReadContract, useReadContracts } from 'wagmi';
import { useMemo } from 'react';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
} from './pokeballGameConfig';

// SlabNFTManager ABI (minimal - only what we need for diagnostics)
// v2.2.0: canAutoPurchase returns (bool, uint256) - (canPurchase, threshold)
const SLAB_NFT_MANAGER_ABI = [
  {
    inputs: [],
    name: 'canAutoPurchase',
    outputs: [
      { name: 'canPurchase', type: 'bool' },
      { name: 'threshold', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'AUTO_PURCHASE_THRESHOLD',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getUSDCBalance',
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getInventoryCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_INVENTORY_SIZE',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPullPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getInventory',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingRequestCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getStats',
    outputs: [
      { name: 'balance', type: 'uint256' },
      { name: 'inventorySize', type: 'uint256' },
      { name: 'purchased', type: 'uint256' },
      { name: 'awarded', type: 'uint256' },
      { name: 'spent', type: 'uint256' },
      { name: 'pending', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'startId', type: 'uint256' },
      { name: 'endId', type: 'uint256' },
    ],
    name: 'getUntrackedNFTs',
    outputs: [{ name: 'untrackedIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'recoverUntrackedNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenIds', type: 'uint256[]' }],
    name: 'batchRecoverUntrackedNFTs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'uint256' }],
    name: 'clearPendingRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'resetPendingRequestCount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// SlabNFTManager proxy address
const SLAB_NFT_MANAGER_ADDRESS = '0xbbdfa19f9719f9d9348F494E07E0baB96A85AA71' as `0x${string}`;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ContractDiagnostics {
  // APE Price from PokeballGame (8 decimals)
  apePriceUSD: bigint;
  apePriceFormatted: number;

  // SlabNFTManager pull price (6 decimals - USDC)
  pullPrice: bigint;
  pullPriceFormatted: number;

  // Auto-purchase threshold (6 decimals - USDC)
  autoPurchaseThreshold: bigint;
  autoPurchaseThresholdFormatted: number;

  // SlabNFTManager USDC balance
  slabNFTManagerBalance: bigint;
  slabNFTManagerBalanceFormatted: number;

  // Can auto-purchase check
  canAutoPurchase: boolean;

  // NFT Inventory
  inventoryCount: number;
  maxInventorySize: number;

  // Warning flags
  hasWarnings: boolean;
  warnings: string[];

  // Loading state
  isLoading: boolean;
  isError: boolean;
}

export interface UseContractDiagnosticsReturn extends ContractDiagnostics {
  refetch: () => void;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

export function useContractDiagnostics(): UseContractDiagnosticsReturn {
  // Read APE price from PokeballGame
  const {
    data: apePriceData,
    isLoading: isApePriceLoading,
    isError: isApePriceError,
    refetch: refetchApePrice,
  } = useReadContract({
    address: POKEBALL_GAME_ADDRESS,
    abi: POKEBALL_GAME_ABI,
    functionName: 'apePriceUSD',
    chainId: POKEBALL_GAME_CHAIN_ID,
    query: {
      enabled: !!POKEBALL_GAME_ADDRESS,
      staleTime: 30_000, // 30 seconds
      refetchInterval: 60_000, // 1 minute
    },
  });

  // Read SlabNFTManager data in a batch
  // v2.2.0: canAutoPurchase returns (bool canPurchase, uint256 threshold)
  // We also fetch getPullPrice, getStats for more complete diagnostics
  const {
    data: slabData,
    isLoading: isSlabLoading,
    isError: isSlabError,
    refetch: refetchSlab,
  } = useReadContracts({
    contracts: [
      {
        address: SLAB_NFT_MANAGER_ADDRESS,
        abi: SLAB_NFT_MANAGER_ABI,
        functionName: 'canAutoPurchase',
        chainId: POKEBALL_GAME_CHAIN_ID,
      },
      {
        address: SLAB_NFT_MANAGER_ADDRESS,
        abi: SLAB_NFT_MANAGER_ABI,
        functionName: 'getInventoryCount',
        chainId: POKEBALL_GAME_CHAIN_ID,
      },
      {
        address: SLAB_NFT_MANAGER_ADDRESS,
        abi: SLAB_NFT_MANAGER_ABI,
        functionName: 'MAX_INVENTORY_SIZE',
        chainId: POKEBALL_GAME_CHAIN_ID,
      },
      {
        address: SLAB_NFT_MANAGER_ADDRESS,
        abi: SLAB_NFT_MANAGER_ABI,
        functionName: 'getPullPrice',
        chainId: POKEBALL_GAME_CHAIN_ID,
      },
      {
        address: SLAB_NFT_MANAGER_ADDRESS,
        abi: SLAB_NFT_MANAGER_ABI,
        functionName: 'getStats',
        chainId: POKEBALL_GAME_CHAIN_ID,
      },
    ],
    query: {
      staleTime: 30_000,
      refetchInterval: 60_000,
    },
  });

  // Process diagnostics data
  const diagnostics = useMemo<ContractDiagnostics>(() => {
    const warnings: string[] = [];

    // Parse APE price
    const apePriceUSD = (apePriceData as bigint) ?? BigInt(0);
    const apePriceFormatted = Number(apePriceUSD) / 1e8;

    // Parse SlabNFTManager data (v2.2.0 response format)
    // canAutoPurchase returns: (bool canPurchase, uint256 threshold)
    const canAutoPurchaseResult = slabData?.[0]?.result as readonly [boolean, bigint] | undefined;
    const inventoryCountResult = slabData?.[1]?.result as bigint | undefined;
    const maxInventorySizeResult = slabData?.[2]?.result as number | undefined;
    const pullPriceResult = slabData?.[3]?.result as bigint | undefined;
    // getStats returns: (balance, inventorySize, purchased, awarded, spent, pending)
    const statsResult = slabData?.[4]?.result as readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined;

    const canAutoPurchase = canAutoPurchaseResult?.[0] ?? false;
    const autoPurchaseThreshold = canAutoPurchaseResult?.[1] ?? BigInt(51_000_000); // default $51
    const pullPrice = pullPriceResult ?? BigInt(51_000_000); // default $51
    const slabNFTManagerBalance = statsResult?.[0] ?? BigInt(0);

    const slabNFTManagerBalanceFormatted = Number(slabNFTManagerBalance) / 1e6;
    const autoPurchaseThresholdFormatted = Number(autoPurchaseThreshold) / 1e6;
    const pullPriceFormatted = Number(pullPrice) / 1e6;

    const inventoryCount = Number(inventoryCountResult ?? 0);
    const maxInventorySize = Number(maxInventorySizeResult ?? 20);

    // Check for warnings
    if (apePriceUSD === BigInt(0)) {
      warnings.push('APE price is 0 - purchases may fail');
    } else if (apePriceFormatted < 0.05) {
      warnings.push(`APE price looks unusually low ($${apePriceFormatted.toFixed(4)})`);
    } else if (apePriceFormatted > 10) {
      warnings.push(`APE price looks unusually high ($${apePriceFormatted.toFixed(4)})`);
    }

    if (pullPriceFormatted < 50) {
      warnings.push(`Pull price looks too low ($${pullPriceFormatted.toFixed(2)}) - expected ~$51`);
    } else if (pullPriceFormatted > 100) {
      warnings.push(`Pull price looks unusually high ($${pullPriceFormatted.toFixed(2)})`);
    }

    if (inventoryCount >= maxInventorySize) {
      warnings.push(`NFT inventory is full (${inventoryCount}/${maxInventorySize}) - new catches won't get NFTs`);
    }

    return {
      apePriceUSD,
      apePriceFormatted,
      pullPrice,
      pullPriceFormatted,
      autoPurchaseThreshold,
      autoPurchaseThresholdFormatted,
      slabNFTManagerBalance,
      slabNFTManagerBalanceFormatted,
      canAutoPurchase,
      inventoryCount,
      maxInventorySize,
      hasWarnings: warnings.length > 0,
      warnings,
      isLoading: isApePriceLoading || isSlabLoading,
      isError: isApePriceError || isSlabError,
    };
  }, [apePriceData, slabData, isApePriceLoading, isSlabLoading, isApePriceError, isSlabError]);

  const refetch = () => {
    refetchApePrice();
    refetchSlab();
  };

  return {
    ...diagnostics,
    refetch,
  };
}

export default useContractDiagnostics;
