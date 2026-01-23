/**
 * TransactionHistory Component
 *
 * Displays a player's transaction history from the PokeballGame contract.
 * Shows ball purchases, throw attempts, and catch results (wins/losses).
 *
 * Features:
 * - Real-time updates via event subscriptions
 * - Pagination with "Load More" button
 * - Color-coded transaction types
 * - Links to Apescan for transaction details
 * - Responsive layout
 *
 * Usage:
 * ```tsx
 * import { TransactionHistory } from './components/TransactionHistory';
 *
 * <TransactionHistory
 *   isOpen={showHistory}
 *   onClose={() => setShowHistory(false)}
 *   playerAddress={account}
 * />
 * ```
 */

import { useMemo } from 'react';
import {
  useTransactionHistory,
  type Transaction,
  type PurchaseTransaction,
  type ThrowTransaction,
  type CaughtTransaction,
  type FailedTransaction,
  isPurchaseTransaction,
  isThrowTransaction,
  isCaughtTransaction,
  isFailedTransaction,
  getTransactionUrl,
} from '../../hooks/useTransactionHistory';
import { getNftUrl, RELATED_CONTRACTS } from '../../services/pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: `0x${string}`;
}

// ============================================================
// CONSTANTS
// ============================================================

const BALL_COLORS: Record<number, string> = {
  0: '#ff4444', // Poke Ball - Red
  1: '#4488ff', // Great Ball - Blue
  2: '#ffcc00', // Ultra Ball - Yellow
  3: '#aa44ff', // Master Ball - Purple
};

const TX_TYPE_COLORS: Record<string, string> = {
  purchase: '#00ff88', // Green
  throw: '#ffcc00', // Yellow
  caught: '#00ffff', // Cyan
  failed: '#ff4444', // Red
};

const TX_TYPE_LABELS: Record<string, string> = {
  purchase: 'PURCHASE',
  throw: 'THROW',
  caught: 'CAUGHT!',
  failed: 'ESCAPED',
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    border: '4px solid #00ff88',
    padding: '20px',
    maxWidth: '600px',
    width: '95%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: "'Courier New', monospace",
    color: '#fff',
    imageRendering: 'pixelated' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '2px solid #444',
    paddingBottom: '12px',
    flexShrink: 0,
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: '2px solid #ff4444',
    color: '#ff4444',
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
  },
  statsBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    flexWrap: 'wrap' as const,
    flexShrink: 0,
  },
  statItem: {
    fontSize: '11px',
    color: '#888',
  },
  statValue: {
    fontWeight: 'bold',
    marginLeft: '4px',
  },
  transactionList: {
    flex: 1,
    overflowY: 'auto' as const,
    paddingRight: '8px',
  },
  transactionCard: {
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
    marginBottom: '10px',
    padding: '12px',
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  typeBadge: {
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  timestamp: {
    fontSize: '10px',
    color: '#666',
  },
  transactionDetails: {
    fontSize: '12px',
    lineHeight: '1.6',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  detailLabel: {
    color: '#888',
  },
  detailValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ballDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '6px',
    verticalAlign: 'middle',
  },
  txLink: {
    display: 'block',
    marginTop: '8px',
    fontSize: '10px',
    color: '#00ff88',
    textDecoration: 'none',
  },
  nftLink: {
    color: '#00ffff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  loadMoreButton: {
    width: '100%',
    padding: '12px',
    marginTop: '12px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #00ff88',
    color: '#00ff88',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flexShrink: 0,
  },
  loadMoreButtonDisabled: {
    borderColor: '#444',
    color: '#444',
    cursor: 'not-allowed',
  },
  loadingState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#888',
  },
  errorState: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#ff4444',
    backgroundColor: '#3a1a1a',
    border: '2px solid #ff4444',
    marginBottom: '12px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
  refreshButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #00ff88',
    color: '#00ff88',
    fontFamily: "'Courier New', monospace",
    fontSize: '10px',
    cursor: 'pointer',
    marginLeft: '8px',
  },
  notConnected: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#888',
  },
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 minute ago
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour ago
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }

  // Less than 24 hours ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Otherwise show date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PurchaseCard({ tx }: { tx: PurchaseTransaction }) {
  return (
    <div style={styles.transactionCard}>
      <div style={styles.transactionHeader}>
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: TX_TYPE_COLORS.purchase,
            color: '#000',
          }}
        >
          {TX_TYPE_LABELS.purchase}
        </span>
        <span style={styles.timestamp}>{formatTimestamp(tx.timestamp)}</span>
      </div>
      <div style={styles.transactionDetails}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Ball Type:</span>
          <span style={styles.detailValue}>
            <span
              style={{
                ...styles.ballDot,
                backgroundColor: BALL_COLORS[tx.ballType] || '#888',
              }}
            />
            {tx.ballName}
          </span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Quantity:</span>
          <span style={styles.detailValue}>x{tx.quantity.toString()}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Cost:</span>
          <span style={{ ...styles.detailValue, color: tx.usedAPE ? '#ffcc00' : '#00ff00' }}>
            {tx.estimatedCost}
          </span>
        </div>
        <a
          href={getTransactionUrl(tx.transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.txLink}
        >
          View on Apescan &rarr;
        </a>
      </div>
    </div>
  );
}

function ThrowCard({ tx }: { tx: ThrowTransaction }) {
  return (
    <div style={styles.transactionCard}>
      <div style={styles.transactionHeader}>
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: TX_TYPE_COLORS.throw,
            color: '#000',
          }}
        >
          {TX_TYPE_LABELS.throw}
        </span>
        <span style={styles.timestamp}>{formatTimestamp(tx.timestamp)}</span>
      </div>
      <div style={styles.transactionDetails}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Pokemon ID:</span>
          <span style={styles.detailValue}>#{tx.pokemonId.toString()}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Ball Used:</span>
          <span style={styles.detailValue}>
            <span
              style={{
                ...styles.ballDot,
                backgroundColor: BALL_COLORS[tx.ballType] || '#888',
              }}
            />
            {tx.ballName}
          </span>
        </div>
        <a
          href={getTransactionUrl(tx.transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.txLink}
        >
          View on Apescan &rarr;
        </a>
      </div>
    </div>
  );
}

function CaughtCard({ tx }: { tx: CaughtTransaction }) {
  const nftUrl = getNftUrl(
    RELATED_CONTRACTS.SLAB_NFT,
    tx.nftTokenId.toString()
  );

  return (
    <div style={{ ...styles.transactionCard, borderColor: TX_TYPE_COLORS.caught }}>
      <div style={styles.transactionHeader}>
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: TX_TYPE_COLORS.caught,
            color: '#000',
          }}
        >
          {TX_TYPE_LABELS.caught}
        </span>
        <span style={styles.timestamp}>{formatTimestamp(tx.timestamp)}</span>
      </div>
      <div style={styles.transactionDetails}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Pokemon ID:</span>
          <span style={styles.detailValue}>#{tx.pokemonId.toString()}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>NFT Won:</span>
          <span style={styles.detailValue}>
            <a
              href={nftUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.nftLink}
            >
              Token #{tx.nftTokenId.toString()} &rarr;
            </a>
          </span>
        </div>
        <a
          href={getTransactionUrl(tx.transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.txLink}
        >
          View on Apescan &rarr;
        </a>
      </div>
    </div>
  );
}

function FailedCard({ tx }: { tx: FailedTransaction }) {
  return (
    <div style={{ ...styles.transactionCard, borderColor: TX_TYPE_COLORS.failed }}>
      <div style={styles.transactionHeader}>
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: TX_TYPE_COLORS.failed,
            color: '#000',
          }}
        >
          {TX_TYPE_LABELS.failed}
        </span>
        <span style={styles.timestamp}>{formatTimestamp(tx.timestamp)}</span>
      </div>
      <div style={styles.transactionDetails}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Pokemon ID:</span>
          <span style={styles.detailValue}>#{tx.pokemonId.toString()}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Attempts Left:</span>
          <span
            style={{
              ...styles.detailValue,
              color: tx.attemptsRemaining > 0 ? '#ffcc00' : '#ff4444',
            }}
          >
            {tx.attemptsRemaining}
          </span>
        </div>
        <a
          href={getTransactionUrl(tx.transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.txLink}
        >
          View on Apescan &rarr;
        </a>
      </div>
    </div>
  );
}

function TransactionCard({ tx }: { tx: Transaction }) {
  if (isPurchaseTransaction(tx)) return <PurchaseCard tx={tx} />;
  if (isThrowTransaction(tx)) return <ThrowCard tx={tx} />;
  if (isCaughtTransaction(tx)) return <CaughtCard tx={tx} />;
  if (isFailedTransaction(tx)) return <FailedCard tx={tx} />;
  return null;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function TransactionHistory({
  isOpen,
  onClose,
  playerAddress,
}: TransactionHistoryProps) {
  const {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMore,
    isLoadingMore,
    refresh,
    totalCount,
  } = useTransactionHistory(playerAddress);

  // Calculate stats including spending totals for NFT trigger visibility
  const stats = useMemo(() => {
    let purchases = 0;
    let throws = 0;
    let caught = 0;
    let failed = 0;
    let totalSpentUSD = 0; // Approximate USD spent (for NFT pool threshold)
    let totalSpentAPE = 0;
    let totalSpentUSDC = 0;

    for (const tx of transactions) {
      switch (tx.type) {
        case 'purchase': {
          purchases++;
          // Parse spending from estimatedCost (e.g., "52.63 APE" or "10.00 USDC")
          const purchaseTx = tx as PurchaseTransaction;
          const costStr = purchaseTx.estimatedCost;
          const match = costStr.match(/^~?([\d.]+)\s*(APE|USDC)/i);
          if (match) {
            const amount = parseFloat(match[1]);
            const token = match[2].toUpperCase();
            if (token === 'APE') {
              totalSpentAPE += amount;
              // Approximate USD from ball prices (since we know ball type)
              const ballPrices = [1, 10, 25, 49.9];
              const qty = Number(purchaseTx.quantity);
              totalSpentUSD += (ballPrices[purchaseTx.ballType] || 0) * qty;
            } else {
              totalSpentUSDC += amount;
              totalSpentUSD += amount;
            }
          }
          break;
        }
        case 'throw':
          throws++;
          break;
        case 'caught':
          caught++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    const catchRate = throws > 0 ? Math.round((caught / throws) * 100) : 0;

    return {
      purchases,
      throws,
      caught,
      failed,
      catchRate,
      totalSpentUSD,
      totalSpentAPE,
      totalSpentUSDC,
    };
  }, [transactions]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={styles.title}>TRANSACTION HISTORY</h3>
            <button style={styles.refreshButton} onClick={refresh} disabled={isLoading}>
              {isLoading ? '...' : 'Refresh'}
            </button>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        {/* Not Connected State */}
        {!playerAddress && (
          <div style={styles.notConnected}>
            Connect your wallet to view transaction history.
          </div>
        )}

        {/* Stats Bar */}
        {playerAddress && transactions.length > 0 && (
          <>
            <div style={styles.statsBar}>
              <span style={styles.statItem}>
                Purchases:
                <span style={{ ...styles.statValue, color: TX_TYPE_COLORS.purchase }}>
                  {stats.purchases}
                </span>
              </span>
              <span style={styles.statItem}>
                Throws:
                <span style={{ ...styles.statValue, color: TX_TYPE_COLORS.throw }}>
                  {stats.throws}
                </span>
              </span>
              <span style={styles.statItem}>
                Caught:
                <span style={{ ...styles.statValue, color: TX_TYPE_COLORS.caught }}>
                  {stats.caught}
                </span>
              </span>
              <span style={styles.statItem}>
                Escaped:
                <span style={{ ...styles.statValue, color: TX_TYPE_COLORS.failed }}>
                  {stats.failed}
                </span>
              </span>
              <span style={styles.statItem}>
                Catch Rate:
                <span
                  style={{
                    ...styles.statValue,
                    color: stats.catchRate >= 50 ? '#00ff88' : '#ffcc00',
                  }}
                >
                  {stats.catchRate}%
                </span>
              </span>
            </div>
            {/* Spending Summary - helpful for testing NFT pool threshold */}
            <div style={{ ...styles.statsBar, borderColor: '#4488ff', marginTop: '0' }}>
              <span style={styles.statItem}>
                Total Spent (USD):
                <span style={{ ...styles.statValue, color: '#00ff88' }}>
                  ${stats.totalSpentUSD.toFixed(2)}
                </span>
              </span>
              {stats.totalSpentAPE > 0 && (
                <span style={styles.statItem}>
                  APE Used:
                  <span style={{ ...styles.statValue, color: '#ffcc00' }}>
                    {stats.totalSpentAPE.toFixed(2)}
                  </span>
                </span>
              )}
              {stats.totalSpentUSDC > 0 && (
                <span style={styles.statItem}>
                  USDC.e Used:
                  <span style={{ ...styles.statValue, color: '#00ff00' }}>
                    ${stats.totalSpentUSDC.toFixed(2)}
                  </span>
                </span>
              )}
              <span style={{ ...styles.statItem, color: '#666' }}>
                (NFT pool: 97% of purchases)
              </span>
            </div>
          </>
        )}

        {/* Error State */}
        {error && (
          <div style={styles.errorState}>
            Error: {error}
            <br />
            <button
              style={{ ...styles.refreshButton, marginTop: '8px', marginLeft: 0 }}
              onClick={refresh}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {playerAddress && isLoading && (
          <div style={styles.loadingState}>
            Loading transaction history...
          </div>
        )}

        {/* Empty State */}
        {playerAddress && !isLoading && transactions.length === 0 && !error && (
          <div style={styles.emptyState}>
            No transactions found.
            <br />
            <span style={{ fontSize: '11px', color: '#555' }}>
              Buy some PokeBalls to get started!
            </span>
          </div>
        )}

        {/* Transaction List */}
        {playerAddress && !isLoading && transactions.length > 0 && (
          <div style={styles.transactionList}>
            {transactions.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {playerAddress && !isLoading && transactions.length > 0 && (
          <button
            style={{
              ...styles.loadMoreButton,
              ...(isLoadingMore || !hasMore ? styles.loadMoreButtonDisabled : {}),
            }}
            onClick={loadMore}
            disabled={isLoadingMore || !hasMore}
          >
            {isLoadingMore
              ? 'Loading...'
              : hasMore
              ? `Load More (${totalCount} loaded)`
              : `All ${totalCount} transactions loaded`}
          </button>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
