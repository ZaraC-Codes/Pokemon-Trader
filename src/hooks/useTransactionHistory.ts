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
 *
 * Strategy:
 * - Uses Caldera public RPC for historical log queries (no block range limit)
 * - Uses wagmi's publicClient for real-time event watching
 * - Single request for all events in a large block range
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { createPublicClient, http, type Log, formatUnits, parseAbiItem } from 'viem';
import { pokeballGameConfig, getBallConfig, isPokeballGameConfigured, getTransactionUrl } from '../services/pokeballGameConfig';
import { apeChainMainnet } from '../services/apechainConfig';

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
  estimatedCost: string;
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
  pageSize?: number;
  fromBlock?: bigint;
}

export interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  refresh: () => void;
  totalCount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE_SIZE = 50;

// Caldera public RPC - no block range limits!
const PUBLIC_RPC_URL = 'https://apechain.calderachain.xyz/http';

// How many blocks to search (~12 hours at 2s/block = 21,600 blocks)
const DEFAULT_LOOKBACK_BLOCKS = BigInt(25000);

// Ball prices in USDC (6 decimals)
const BALL_PRICES_USDC: Record<number, bigint> = {
  0: BigInt(1_000000),
  1: BigInt(10_000000),
  2: BigInt(25_000000),
  3: BigInt(49_900000),
};

// Event ABIs for parsing
const EVENT_ABIS = {
  BallPurchased: parseAbiItem(
    'event BallPurchased(address indexed buyer, uint8 ballType, uint256 quantity, bool usedAPE, uint256 totalAmount)'
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
    const usdcFormatted = formatUnits(totalUsdc, 6);
    return `~${usdcFormatted} APE`;
  }

  return `${formatUnits(totalUsdc, 6)} USDC`;
}

// Create a separate viem client for historical queries using public RPC
// This avoids Alchemy's 10-block limit
const publicRpcClient = createPublicClient({
  chain: apeChainMainnet,
  transport: http(PUBLIC_RPC_URL),
});

// ============================================================
// MAIN HOOK
// ============================================================

export function useTransactionHistory(
  playerAddress?: `0x${string}`,
  options: UseTransactionHistoryOptions = {}
): UseTransactionHistoryReturn {
  const { pageSize = DEFAULT_PAGE_SIZE, fromBlock: initialFromBlock } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldestBlock, setOldestBlock] = useState<bigint | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Ref to prevent overlapping fetches
  const isFetchingRef = useRef(false);

  // Use wagmi's client for real-time events
  const wagmiClient = usePublicClient();
  const contractAddress = pokeballGameConfig.pokeballGameAddress;

  const isConfigured = isPokeballGameConfigured() && !!playerAddress && !!wagmiClient;

  /**
   * Fetch all events for a player in one request using public RPC.
   * No block range limit with Caldera!
   */
  const fetchAllEvents = useCallback(
    async (
      from: bigint,
      to: bigint | 'latest'
    ): Promise<{ logs: (Log & { _eventType: string })[]; error?: string }> => {
      if (!contractAddress || !playerAddress) {
        return { logs: [] };
      }

      const allLogs: (Log & { _eventType: string })[] = [];

      console.log(`[useTransactionHistory] Fetching events from block ${from} to ${to}`);
      console.log(`[useTransactionHistory] Contract: ${contractAddress}`);
      console.log(`[useTransactionHistory] Player: ${playerAddress}`);

      // Fetch each event type
      const eventTypes = ['BallPurchased', 'ThrowAttempted', 'CaughtPokemon', 'FailedCatch'] as const;

      for (const eventType of eventTypes) {
        try {
          // Determine indexed arg
          let indexedArg: Record<string, `0x${string}`> = {};
          if (eventType === 'BallPurchased') {
            indexedArg = { buyer: playerAddress };
          } else if (eventType === 'ThrowAttempted' || eventType === 'FailedCatch') {
            indexedArg = { thrower: playerAddress };
          } else if (eventType === 'CaughtPokemon') {
            indexedArg = { catcher: playerAddress };
          }

          console.log(`[useTransactionHistory] Fetching ${eventType} with args:`, indexedArg);

          const logs = await publicRpcClient.getLogs({
            address: contractAddress,
            event: EVENT_ABIS[eventType] as any,
            args: indexedArg,
            fromBlock: from,
            toBlock: to,
          });

          console.log(`[useTransactionHistory] ${eventType}: found ${logs.length} logs`);

          // Tag logs with event type
          logs.forEach(log => {
            allLogs.push({ ...log, _eventType: eventType } as Log & { _eventType: string });
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[useTransactionHistory] Error fetching ${eventType}:`, errorMsg);

          // If it's a block range error, return early with error
          if (errorMsg.includes('block range') || errorMsg.includes('-32600')) {
            return { logs: allLogs, error: `Block range limit hit on ${eventType}` };
          }
        }
      }

      console.log(`[useTransactionHistory] Total logs found: ${allLogs.length}`);
      return { logs: allLogs };
    },
    [contractAddress, playerAddress]
  );

  /**
   * Parse logs into transactions
   */
  const parseLogsToTransactions = useCallback(
    async (logs: (Log & { _eventType: string })[]): Promise<Transaction[]> => {
      const txs: Transaction[] = [];
      const blockTimestamps = new Map<bigint, number>();

      for (const log of logs) {
        const baseData: Omit<BaseTransaction, 'type'> = {
          id: createTransactionId(log),
          timestamp: 0,
          blockNumber: log.blockNumber ?? BigInt(0),
          transactionHash: log.transactionHash ?? '0x0',
        };

        // Get block timestamp (cache it to avoid duplicate calls)
        if (log.blockNumber) {
          if (blockTimestamps.has(log.blockNumber)) {
            baseData.timestamp = blockTimestamps.get(log.blockNumber)!;
          } else {
            try {
              const block = await publicRpcClient.getBlock({ blockNumber: log.blockNumber });
              const ts = Number(block.timestamp) * 1000;
              blockTimestamps.set(log.blockNumber, ts);
              baseData.timestamp = ts;
            } catch {
              baseData.timestamp = Date.now();
            }
          }
        }

        const args = (log as Log & { args: Record<string, unknown> }).args || {};
        const eventType = log._eventType;

        switch (eventType) {
          case 'BallPurchased': {
            const ballType = Number(args.ballType ?? 0);
            const quantity = BigInt(args.quantity?.toString() ?? '0');
            const usedAPE = Boolean(args.usedAPE);
            const totalAmount = args.totalAmount ? BigInt(args.totalAmount.toString()) : null;
            txs.push({
              ...baseData,
              type: 'purchase',
              ballType,
              ballName: getBallConfig(ballType as 0 | 1 | 2 | 3)?.name ?? 'Unknown Ball',
              quantity,
              usedAPE,
              estimatedCost: totalAmount
                ? (usedAPE
                    ? `${formatUnits(totalAmount, 18)} APE`
                    : `${formatUnits(totalAmount, 6)} USDC`)
                : formatCost(ballType, quantity, usedAPE),
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
              ballName: getBallConfig(ballType as 0 | 1 | 2 | 3)?.name ?? 'Unknown Ball',
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

      // Sort by timestamp descending
      txs.sort((a, b) => b.timestamp - a.timestamp);
      return txs;
    },
    []
  );

  // Store in ref for useEffect
  const fetchAllEventsRef = useRef(fetchAllEvents);
  fetchAllEventsRef.current = fetchAllEvents;

  const parseLogsRef = useRef(parseLogsToTransactions);
  parseLogsRef.current = parseLogsToTransactions;

  // Track loaded state
  const [loadedForAddress, setLoadedForAddress] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Initial load
  useEffect(() => {
    if (!wagmiClient || !playerAddress || !contractAddress) {
      return;
    }

    if (hasAttemptedLoad && loadedForAddress === playerAddress) {
      return;
    }

    if (isLoading || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setHasAttemptedLoad(true);
    setError(null);

    (async () => {
      try {
        const currentBlock = await publicRpcClient.getBlockNumber();
        console.log(`[useTransactionHistory] Current block: ${currentBlock}`);

        const lookback = initialFromBlock
          ? currentBlock - initialFromBlock
          : DEFAULT_LOOKBACK_BLOCKS;

        const fromBlock = currentBlock > lookback ? currentBlock - lookback : BigInt(0);
        console.log(`[useTransactionHistory] Searching from block ${fromBlock} to ${currentBlock}`);

        const { logs, error: fetchError } = await fetchAllEventsRef.current(fromBlock, currentBlock);

        if (fetchError) {
          setError(fetchError);
        }

        const txs = await parseLogsRef.current(logs);
        console.log(`[useTransactionHistory] Parsed ${txs.length} transactions`);

        setTransactions(txs.slice(0, pageSize));
        setHasMore(txs.length > pageSize);
        setOldestBlock(fromBlock);
        setLoadedForAddress(playerAddress);
      } catch (err) {
        console.error('[useTransactionHistory] Load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transaction history');
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerAddress, wagmiClient, contractAddress, initialFromBlock, pageSize, hasAttemptedLoad, loadedForAddress]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!isConfigured || !oldestBlock || isLoadingMore || !hasMore || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const newTo = oldestBlock - BigInt(1);
      const newFrom = newTo > DEFAULT_LOOKBACK_BLOCKS ? newTo - DEFAULT_LOOKBACK_BLOCKS : BigInt(0);

      if (newFrom >= newTo) {
        setHasMore(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
        return;
      }

      const { logs } = await fetchAllEvents(newFrom, newTo);
      const txs = await parseLogsToTransactions(logs);

      if (txs.length === 0) {
        setHasMore(false);
      } else {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newTxs = txs.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newTxs].sort((a, b) => b.timestamp - a.timestamp);
        });
        setOldestBlock(newFrom);
      }
    } catch (err) {
      console.error('[useTransactionHistory] Load more error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [isConfigured, oldestBlock, isLoadingMore, hasMore, fetchAllEvents, parseLogsToTransactions]);

  // Refresh
  const refresh = useCallback(async () => {
    if (!isConfigured || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicRpcClient.getBlockNumber();
      const lookback = initialFromBlock
        ? currentBlock - initialFromBlock
        : DEFAULT_LOOKBACK_BLOCKS;

      const fromBlock = currentBlock > lookback ? currentBlock - lookback : BigInt(0);

      const { logs, error: fetchError } = await fetchAllEvents(fromBlock, currentBlock);

      if (fetchError) {
        setError(fetchError);
      }

      const txs = await parseLogsToTransactions(logs);

      setTransactions(txs.slice(0, pageSize));
      setHasMore(txs.length > pageSize);
      setOldestBlock(fromBlock);
    } catch (err) {
      console.error('[useTransactionHistory] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isConfigured, initialFromBlock, pageSize, fetchAllEvents, parseLogsToTransactions]);

  // Parse logs for real-time watchers (uses simpler format)
  const parseWatcherLogs = useCallback(
    async (logs: Log[], eventType: string): Promise<Transaction[]> => {
      const taggedLogs = logs.map(log => ({ ...log, _eventType: eventType })) as (Log & { _eventType: string })[];
      return parseLogsToTransactions(taggedLogs);
    },
    [parseLogsToTransactions]
  );

  // Real-time event subscriptions (for new events only)
  useWatchContractEvent({
    address: contractAddress,
    abi: pokeballGameConfig.abi,
    eventName: 'BallPurchased',
    args: { buyer: playerAddress },
    enabled: isConfigured,
    onLogs: async (logs) => {
      const newTxs = await parseWatcherLogs(logs as Log[], 'BallPurchased');
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
      const newTxs = await parseWatcherLogs(logs as Log[], 'ThrowAttempted');
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
      const newTxs = await parseWatcherLogs(logs as Log[], 'CaughtPokemon');
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
      const newTxs = await parseWatcherLogs(logs as Log[], 'FailedCatch');
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
