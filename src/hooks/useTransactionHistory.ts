/**
 * useTransactionHistory Hook
 *
 * Fetches and subscribes to player transaction history from the PokeballGame contract.
 * Tracks ball purchases, throw attempts, and catch results (wins/losses).
 *
 * Events tracked:
 * - BallPurchased: Ball purchases with quantity, tier, token used, cost
 * - ThrowAttempted: Ball throws with Pokemon slot targeted
 * - CaughtPokemon: Successful catches with NFT tokenId
 * - FailedCatch: Failed catch attempts with remaining attempts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { type Log, formatUnits, parseAbiItem } from 'viem';
import { pokeballGameConfig, getBallConfig, isPokeballGameConfigured, getTransactionUrl } from '../services/pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type TransactionType = 'purchase' | 'throw' | 'caught' | 'failed';

export interface BaseTransaction {
  id: string;
  type: TransactionType;
  timestamp: number;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface PurchaseTransaction extends BaseTransaction {
  type: 'purchase';
  ballType: number;
  ballName: string;
  quantity: bigint;
  usedAPE: boolean;
  estimatedCost: string; // Formatted string (e.g., "25.00 USDC" or "5.5 APE")
}

export interface ThrowTransaction extends BaseTransaction {
  type: 'throw';
  pokemonId: bigint;
  ballType: number;
  ballName: string;
  requestId: bigint;
}

export interface CaughtTransaction extends BaseTransaction {
  type: 'caught';
  pokemonId: bigint;
  nftTokenId: bigint;
}

export interface FailedTransaction extends BaseTransaction {
  type: 'failed';
  pokemonId: bigint;
  attemptsRemaining: number;
}

export type Transaction =
  | PurchaseTransaction
  | ThrowTransaction
  | CaughtTransaction
  | FailedTransaction;

export interface UseTransactionHistoryOptions {
  /** Number of transactions per page */
  pageSize?: number;
  /** Starting block for initial query (default: ~1 week ago based on 2s blocks) */
  fromBlock?: bigint;
}

export interface UseTransactionHistoryReturn {
  /** All fetched transactions sorted by timestamp (newest first) */
  transactions: Transaction[];
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are more transactions to load */
  hasMore: boolean;
  /** Load more (older) transactions */
  loadMore: () => void;
  /** Whether load more is in progress */
  isLoadingMore: boolean;
  /** Refresh all transactions */
  refresh: () => void;
  /** Total count of transactions loaded */
  totalCount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE_SIZE = 50;
// ~1 week of blocks on ApeChain (2s per block)
const DEFAULT_LOOKBACK_BLOCKS = BigInt(302400);

// Ball prices in USDC (6 decimals)
const BALL_PRICES_USDC: Record<number, bigint> = {
  0: BigInt(1_000000), // $1.00
  1: BigInt(10_000000), // $10.00
  2: BigInt(25_000000), // $25.00
  3: BigInt(49_900000), // $49.90
};

// Event signatures
const EVENT_SIGNATURES = {
  BallPurchased: parseAbiItem(
    'event BallPurchased(address indexed buyer, uint8 ballType, uint256 quantity, bool usedAPE)'
  ),
  ThrowAttempted: parseAbiItem(
    'event ThrowAttempted(address indexed thrower, uint256 pokemonId, uint8 ballTier, uint256 requestId)'
  ),
  CaughtPokemon: parseAbiItem(
    'event CaughtPokemon(address indexed catcher, uint256 pokemonId, uint256 nftTokenId)'
  ),
  FailedCatch: parseAbiItem(
    'event FailedCatch(address indexed thrower, uint256 pokemonId, uint8 attemptsRemaining)'
  ),
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function createTransactionId(log: Log): string {
  return `${log.transactionHash}-${log.logIndex}`;
}

function formatCost(ballType: number, quantity: bigint, usedAPE: boolean): string {
  const pricePerBall = BALL_PRICES_USDC[ballType] || BigInt(0);
  const totalUsdc = pricePerBall * quantity;

  if (usedAPE) {
    // Approximate APE cost (assuming ~$1 APE for display)
    // Real price would require contract query
    const usdcFormatted = formatUnits(totalUsdc, 6);
    return `~${usdcFormatted} APE`;
  }

  return `${formatUnits(totalUsdc, 6)} USDC`;
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useTransactionHistory(
  playerAddress?: `0x${string}`,
  options: UseTransactionHistoryOptions = {}
): UseTransactionHistoryReturn {
  const { pageSize = DEFAULT_PAGE_SIZE, fromBlock: initialFromBlock } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldestBlock, setOldestBlock] = useState<bigint | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const publicClient = usePublicClient();
  const contractAddress = pokeballGameConfig.pokeballGameAddress;

  // Check if configured
  const isConfigured = isPokeballGameConfigured() && !!playerAddress && !!publicClient;

  // Fetch logs for a specific event type
  const fetchEventLogs = useCallback(
    async (
      eventAbi: ReturnType<typeof parseAbiItem>,
      from: bigint,
      to: bigint | 'latest'
    ): Promise<Log[]> => {
      if (!publicClient || !contractAddress) return [];

      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: eventAbi as Parameters<typeof publicClient.getLogs>[0]['event'],
          args: {
            buyer: playerAddress,
            thrower: playerAddress,
            catcher: playerAddress,
          },
          fromBlock: from,
          toBlock: to,
        });
        return logs as Log[];
      } catch (err) {
        console.warn(`[useTransactionHistory] Error fetching logs:`, err);
        return [];
      }
    },
    [publicClient, contractAddress, playerAddress]
  );

  // Parse logs into transactions
  const parseLogsToTransactions = useCallback(
    async (logs: Log[], eventType: string): Promise<Transaction[]> => {
      if (!publicClient) return [];

      const txs: Transaction[] = [];

      for (const log of logs) {
        const baseData: Omit<BaseTransaction, 'type'> = {
          id: createTransactionId(log),
          timestamp: 0, // Will be filled from block
          blockNumber: log.blockNumber ?? BigInt(0),
          transactionHash: log.transactionHash ?? '0x0',
        };

        // Get block timestamp
        try {
          if (log.blockNumber) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            baseData.timestamp = Number(block.timestamp) * 1000;
          }
        } catch {
          baseData.timestamp = Date.now();
        }

        const args = (log as Log & { args: Record<string, unknown> }).args || {};

        switch (eventType) {
          case 'BallPurchased': {
            const ballType = Number(args.ballType ?? 0);
            const quantity = BigInt(args.quantity?.toString() ?? '0');
            const usedAPE = Boolean(args.usedAPE);
            txs.push({
              ...baseData,
              type: 'purchase',
              ballType,
              ballName: getBallConfig(ballType as 0 | 1 | 2 | 3).name,
              quantity,
              usedAPE,
              estimatedCost: formatCost(ballType, quantity, usedAPE),
            } as PurchaseTransaction);
            break;
          }
          case 'ThrowAttempted': {
            const ballType = Number(args.ballTier ?? 0);
            txs.push({
              ...baseData,
              type: 'throw',
              pokemonId: BigInt(args.pokemonId?.toString() ?? '0'),
              ballType,
              ballName: getBallConfig(ballType as 0 | 1 | 2 | 3).name,
              requestId: BigInt(args.requestId?.toString() ?? '0'),
            } as ThrowTransaction);
            break;
          }
          case 'CaughtPokemon': {
            txs.push({
              ...baseData,
              type: 'caught',
              pokemonId: BigInt(args.pokemonId?.toString() ?? '0'),
              nftTokenId: BigInt(args.nftTokenId?.toString() ?? '0'),
            } as CaughtTransaction);
            break;
          }
          case 'FailedCatch': {
            txs.push({
              ...baseData,
              type: 'failed',
              pokemonId: BigInt(args.pokemonId?.toString() ?? '0'),
              attemptsRemaining: Number(args.attemptsRemaining ?? 0),
            } as FailedTransaction);
            break;
          }
        }
      }

      return txs;
    },
    [publicClient]
  );

  // Fetch historical transactions
  const fetchHistory = useCallback(
    async (from: bigint, to: bigint | 'latest') => {
      if (!isConfigured) return [];

      const allTxs: Transaction[] = [];

      // Fetch all event types in parallel
      const [purchaseLogs, throwLogs, caughtLogs, failedLogs] = await Promise.all([
        fetchEventLogs(EVENT_SIGNATURES.BallPurchased, from, to),
        fetchEventLogs(EVENT_SIGNATURES.ThrowAttempted, from, to),
        fetchEventLogs(EVENT_SIGNATURES.CaughtPokemon, from, to),
        fetchEventLogs(EVENT_SIGNATURES.FailedCatch, from, to),
      ]);

      // Parse all logs
      const [purchases, throws, caught, failed] = await Promise.all([
        parseLogsToTransactions(purchaseLogs, 'BallPurchased'),
        parseLogsToTransactions(throwLogs, 'ThrowAttempted'),
        parseLogsToTransactions(caughtLogs, 'CaughtPokemon'),
        parseLogsToTransactions(failedLogs, 'FailedCatch'),
      ]);

      allTxs.push(...purchases, ...throws, ...caught, ...failed);

      // Sort by timestamp descending (newest first)
      allTxs.sort((a, b) => b.timestamp - a.timestamp);

      return allTxs;
    },
    [isConfigured, fetchEventLogs, parseLogsToTransactions]
  );

  // Initial load
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      setTransactions([]);
      return;
    }

    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const currentBlock = await publicClient!.getBlockNumber();
        const from = initialFromBlock ?? (currentBlock - DEFAULT_LOOKBACK_BLOCKS);
        const safeFrom = from < BigInt(0) ? BigInt(0) : from;

        const txs = await fetchHistory(safeFrom, 'latest');

        // Limit to pageSize and track if there's more
        const limited = txs.slice(0, pageSize);
        setTransactions(limited);
        setHasMore(txs.length > pageSize);
        setOldestBlock(safeFrom);
      } catch (err) {
        console.error('[useTransactionHistory] Initial load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transaction history');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, [isConfigured, publicClient, initialFromBlock, pageSize, fetchHistory]);

  // Load more (older) transactions
  const loadMore = useCallback(async () => {
    if (!isConfigured || !oldestBlock || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const newTo = oldestBlock - BigInt(1);
      const newFrom = newTo - DEFAULT_LOOKBACK_BLOCKS;
      const safeFrom = newFrom < BigInt(0) ? BigInt(0) : newFrom;

      if (safeFrom >= newTo) {
        setHasMore(false);
        setIsLoadingMore(false);
        return;
      }

      const txs = await fetchHistory(safeFrom, newTo);

      if (txs.length === 0) {
        setHasMore(false);
      } else {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newTxs = txs.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newTxs].sort((a, b) => b.timestamp - a.timestamp);
        });
        setOldestBlock(safeFrom);
      }
    } catch (err) {
      console.error('[useTransactionHistory] Load more error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more transactions');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isConfigured, oldestBlock, isLoadingMore, hasMore, fetchHistory]);

  // Refresh all transactions
  const refresh = useCallback(async () => {
    if (!isConfigured || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const from = initialFromBlock ?? (currentBlock - DEFAULT_LOOKBACK_BLOCKS);
      const safeFrom = from < BigInt(0) ? BigInt(0) : from;

      const txs = await fetchHistory(safeFrom, 'latest');

      const limited = txs.slice(0, pageSize);
      setTransactions(limited);
      setHasMore(txs.length > pageSize);
      setOldestBlock(safeFrom);
    } catch (err) {
      console.error('[useTransactionHistory] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, publicClient, initialFromBlock, pageSize, fetchHistory]);

  // Real-time event subscriptions
  useWatchContractEvent({
    address: contractAddress,
    abi: pokeballGameConfig.abi,
    eventName: 'BallPurchased',
    args: { buyer: playerAddress },
    enabled: isConfigured,
    onLogs: async (logs) => {
      const newTxs = await parseLogsToTransactions(logs as Log[], 'BallPurchased');
      if (newTxs.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const unique = newTxs.filter((t) => !existingIds.has(t.id));
          return [...unique, ...prev];
        });
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: pokeballGameConfig.abi,
    eventName: 'ThrowAttempted',
    args: { thrower: playerAddress },
    enabled: isConfigured,
    onLogs: async (logs) => {
      const newTxs = await parseLogsToTransactions(logs as Log[], 'ThrowAttempted');
      if (newTxs.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const unique = newTxs.filter((t) => !existingIds.has(t.id));
          return [...unique, ...prev];
        });
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: pokeballGameConfig.abi,
    eventName: 'CaughtPokemon',
    args: { catcher: playerAddress },
    enabled: isConfigured,
    onLogs: async (logs) => {
      const newTxs = await parseLogsToTransactions(logs as Log[], 'CaughtPokemon');
      if (newTxs.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const unique = newTxs.filter((t) => !existingIds.has(t.id));
          return [...unique, ...prev];
        });
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: pokeballGameConfig.abi,
    eventName: 'FailedCatch',
    args: { thrower: playerAddress },
    enabled: isConfigured,
    onLogs: async (logs) => {
      const newTxs = await parseLogsToTransactions(logs as Log[], 'FailedCatch');
      if (newTxs.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const unique = newTxs.filter((t) => !existingIds.has(t.id));
          return [...unique, ...prev];
        });
      }
    },
  });

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMore,
    isLoadingMore,
    refresh,
    totalCount: transactions.length,
  };
}

// ============================================================
// UTILITY EXPORTS
// ============================================================

export { getTransactionUrl };

export function isPurchaseTransaction(tx: Transaction): tx is PurchaseTransaction {
  return tx.type === 'purchase';
}

export function isThrowTransaction(tx: Transaction): tx is ThrowTransaction {
  return tx.type === 'throw';
}

export function isCaughtTransaction(tx: Transaction): tx is CaughtTransaction {
  return tx.type === 'caught';
}

export function isFailedTransaction(tx: Transaction): tx is FailedTransaction {
  return tx.type === 'failed';
}
