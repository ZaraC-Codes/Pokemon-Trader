/**
 * PokeBallShop Component
 *
 * Modal component for purchasing PokeBalls with APE or USDC.e.
 * Displays ball types, prices, catch rates, and player inventory.
 *
 * Usage:
 * ```tsx
 * import { PokeBallShop } from './components/PokeBallShop/PokeBallShop';
 *
 * function GameHUD() {
 *   const [shopOpen, setShopOpen] = useState(false);
 *   const { account } = useActiveWeb3React();
 *
 *   return (
 *     <>
 *       <button onClick={() => setShopOpen(true)}>Open Shop</button>
 *       <PokeBallShop
 *         isOpen={shopOpen}
 *         onClose={() => setShopOpen(false)}
 *         playerAddress={account}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  usePurchaseBalls,
  usePlayerBallInventory,
  getBallTypeName,
  getBallPriceUSD,
  getCatchRatePercent,
  type BallType,
} from '../../hooks/pokeballGame';
import { useApeBalance, useUsdcBalance } from '../../hooks/useTokenBalances';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface PokeBallShopProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: `0x${string}`;
}

type PaymentToken = 'APE' | 'USDC';

// ============================================================
// STYLES (Inline pixel art aesthetic)
// ============================================================

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    border: '4px solid #fff',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    fontFamily: "'Courier New', monospace",
    color: '#fff',
    imageRendering: 'pixelated' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #444',
    paddingBottom: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffcc00',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: '2px solid #ff4444',
    color: '#ff4444',
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
  },
  balanceSection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
  },
  balanceItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  balanceLabel: {
    fontSize: '12px',
    color: '#888',
  },
  balanceValue: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  inventorySection: {
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
  },
  inventoryTitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  inventoryGrid: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  inventoryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  paymentToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  toggleButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #444',
    backgroundColor: '#2a2a2a',
    color: '#888',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    transition: 'all 0.1s',
  },
  toggleButtonActive: {
    border: '2px solid #00ff00',
    backgroundColor: '#1a3a1a',
    color: '#00ff00',
  },
  ballList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  ballRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
  },
  ballInfo: {
    flex: 1,
    minWidth: '120px',
  },
  ballName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  ballStats: {
    fontSize: '12px',
    color: '#888',
  },
  quantityInput: {
    width: '60px',
    padding: '8px',
    border: '2px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  costDisplay: {
    width: '80px',
    textAlign: 'right' as const,
    fontSize: '14px',
  },
  buyButton: {
    padding: '10px 16px',
    border: '2px solid #00ff00',
    backgroundColor: '#1a3a1a',
    color: '#00ff00',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    minWidth: '80px',
  },
  buyButtonDisabled: {
    border: '2px solid #444',
    backgroundColor: '#2a2a2a',
    color: '#666',
    cursor: 'not-allowed',
  },
  insufficientBalance: {
    color: '#ff4444',
    fontSize: '11px',
    marginTop: '4px',
  },
  loadingOverlay: {
    padding: '16px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #ffcc00',
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  loadingText: {
    color: '#ffcc00',
    fontSize: '14px',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#3a1a1a',
    border: '2px solid #ff4444',
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: '12px',
    flex: 1,
  },
  dismissButton: {
    padding: '6px 12px',
    border: '2px solid #ff4444',
    backgroundColor: 'transparent',
    color: '#ff4444',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    marginLeft: '12px',
  },
  successBox: {
    padding: '12px',
    backgroundColor: '#1a3a1a',
    border: '2px solid #00ff00',
    marginTop: '16px',
    textAlign: 'center' as const,
  },
  successText: {
    color: '#00ff00',
    fontSize: '14px',
  },
};

// Ball type colors for visual distinction
const BALL_COLORS: Record<BallType, string> = {
  0: '#ff4444', // Poke Ball - Red
  1: '#4488ff', // Great Ball - Blue
  2: '#ffcc00', // Ultra Ball - Yellow
  3: '#aa44ff', // Master Ball - Purple
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface BallRowProps {
  ballType: BallType;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onBuy: () => void;
  isDisabled: boolean;
  isPending: boolean;
  hasInsufficientBalance: boolean;
  paymentToken: PaymentToken;
}

function BallRow({
  ballType,
  quantity,
  onQuantityChange,
  onBuy,
  isDisabled,
  isPending,
  hasInsufficientBalance,
  paymentToken,
}: BallRowProps) {
  const name = getBallTypeName(ballType);
  const price = getBallPriceUSD(ballType);
  const catchRate = getCatchRatePercent(ballType);
  const totalCost = price * quantity;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onQuantityChange(isNaN(value) || value < 0 ? 0 : value);
  };

  const canBuy = quantity > 0 && !isDisabled && !isPending && !hasInsufficientBalance;

  return (
    <div style={styles.ballRow}>
      {/* Ball color indicator */}
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: BALL_COLORS[ballType],
          border: '2px solid #fff',
        }}
      />

      {/* Ball info */}
      <div style={styles.ballInfo}>
        <div style={{ ...styles.ballName, color: BALL_COLORS[ballType] }}>{name}</div>
        <div style={styles.ballStats}>
          ${price.toFixed(2)} | {catchRate}% catch
        </div>
      </div>

      {/* Quantity input */}
      <input
        type="number"
        min="0"
        value={quantity}
        onChange={handleQuantityChange}
        disabled={isDisabled || isPending}
        style={{
          ...styles.quantityInput,
          opacity: isDisabled || isPending ? 0.5 : 1,
        }}
      />

      {/* Cost display */}
      <div style={styles.costDisplay}>
        <div style={{ color: quantity > 0 ? '#fff' : '#666' }}>
          ${totalCost.toFixed(2)}
        </div>
        {hasInsufficientBalance && quantity > 0 && (
          <div style={styles.insufficientBalance}>
            Low {paymentToken}
          </div>
        )}
      </div>

      {/* Buy button */}
      <button
        onClick={onBuy}
        disabled={!canBuy}
        style={{
          ...styles.buyButton,
          ...(canBuy ? {} : styles.buyButtonDisabled),
        }}
      >
        {isPending ? '...' : 'Buy'}
      </button>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PokeBallShop({ isOpen, onClose, playerAddress }: PokeBallShopProps) {
  // Local state
  const [paymentToken, setPaymentToken] = useState<PaymentToken>('USDC');
  const [quantities, setQuantities] = useState<Record<BallType, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Hooks
  const { write, isLoading, isPending, error, receipt, reset } = usePurchaseBalls();
  const inventory = usePlayerBallInventory(playerAddress);
  const apeBalance = useApeBalance(playerAddress);
  const usdcBalance = useUsdcBalance(playerAddress);

  // Current balance based on selected payment token
  const currentBalance = paymentToken === 'APE' ? apeBalance.balance : usdcBalance.balance;

  // Check if a purchase has sufficient balance
  const hasInsufficientBalance = useCallback(
    (ballType: BallType): boolean => {
      const cost = getBallPriceUSD(ballType) * quantities[ballType];
      if (cost <= 0) return false;

      // For APE, we need to estimate APE amount from USD price
      // This is approximate - actual conversion happens on-chain
      if (paymentToken === 'APE') {
        // Rough estimate: assume APE price around $1 for safety check
        // TODO: Get actual APE/USD price from contract or oracle
        const estimatedApeNeeded = cost; // 1:1 estimate for now
        return apeBalance.balance < estimatedApeNeeded;
      }

      // For USDC, it's direct USD comparison
      return usdcBalance.balance < cost;
    },
    [quantities, paymentToken, apeBalance.balance, usdcBalance.balance]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback((ballType: BallType, qty: number) => {
    setQuantities((prev) => ({ ...prev, [ballType]: qty }));
  }, []);

  // Handle buy
  const handleBuy = useCallback(
    (ballType: BallType) => {
      const qty = quantities[ballType];
      if (qty <= 0 || !write) return;

      if (hasInsufficientBalance(ballType)) {
        return;
      }

      setShowSuccess(false);
      write(ballType, qty, paymentToken === 'APE');
    },
    [quantities, write, paymentToken, hasInsufficientBalance]
  );

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    reset();
  }, [reset]);

  // Show success message when receipt arrives
  React.useEffect(() => {
    if (receipt) {
      setShowSuccess(true);
      // Reset quantities after successful purchase
      setQuantities({ 0: 0, 1: 0, 2: 0, 3: 0 });
      // Refresh balances
      apeBalance.refetch();
      usdcBalance.refetch();
    }
  }, [receipt]);

  // Don't render if not open
  if (!isOpen) return null;

  const isTransactionPending = isLoading || isPending;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>POKE BALL SHOP</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            disabled={isTransactionPending}
          >
            CLOSE
          </button>
        </div>

        {/* Balance Section */}
        <div style={styles.balanceSection}>
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>APE Balance</span>
            <span style={{ ...styles.balanceValue, color: '#ffcc00' }}>
              {apeBalance.isLoading ? '...' : apeBalance.balance.toFixed(2)}
            </span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>USDC.e Balance</span>
            <span style={{ ...styles.balanceValue, color: '#00ff00' }}>
              {usdcBalance.isLoading ? '...' : `$${usdcBalance.balance.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Inventory Section */}
        <div style={styles.inventorySection}>
          <div style={styles.inventoryTitle}>YOUR INVENTORY</div>
          <div style={styles.inventoryGrid}>
            {([0, 1, 2, 3] as BallType[]).map((ballType) => {
              const count =
                ballType === 0
                  ? inventory.pokeBalls
                  : ballType === 1
                  ? inventory.greatBalls
                  : ballType === 2
                  ? inventory.ultraBalls
                  : inventory.masterBalls;

              return (
                <div key={ballType} style={styles.inventoryItem}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: BALL_COLORS[ballType],
                      border: '1px solid #fff',
                    }}
                  />
                  <span style={{ color: BALL_COLORS[ballType], fontSize: '14px' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Toggle */}
        <div style={styles.paymentToggle}>
          <button
            style={{
              ...styles.toggleButton,
              ...(paymentToken === 'USDC' ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setPaymentToken('USDC')}
            disabled={isTransactionPending}
          >
            Pay with USDC.e
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(paymentToken === 'APE' ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setPaymentToken('APE')}
            disabled={isTransactionPending}
          >
            Pay with APE
          </button>
        </div>

        {/* Loading State */}
        {isTransactionPending && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingText}>Transaction in progress...</div>
            <div style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>
              Please confirm in your wallet
            </div>
          </div>
        )}

        {/* Ball List */}
        <div style={styles.ballList}>
          {([0, 1, 2, 3] as BallType[]).map((ballType) => (
            <BallRow
              key={ballType}
              ballType={ballType}
              quantity={quantities[ballType]}
              onQuantityChange={(qty) => handleQuantityChange(ballType, qty)}
              onBuy={() => handleBuy(ballType)}
              isDisabled={!playerAddress || !write}
              isPending={isTransactionPending}
              hasInsufficientBalance={hasInsufficientBalance(ballType)}
              paymentToken={paymentToken}
            />
          ))}
        </div>

        {/* Success Message */}
        {showSuccess && receipt && (
          <div style={styles.successBox}>
            <div style={styles.successText}>Purchase successful!</div>
            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
              TX: {receipt.transactionHash.slice(0, 10)}...
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>
              {error.message.length > 100
                ? `${error.message.slice(0, 100)}...`
                : error.message}
            </span>
            <button style={styles.dismissButton} onClick={handleDismissError}>
              Dismiss
            </button>
          </div>
        )}

        {/* No wallet connected warning */}
        {!playerAddress && (
          <div style={{ ...styles.errorBox, border: '2px solid #ffcc00' }}>
            <span style={{ color: '#ffcc00', fontSize: '12px' }}>
              Connect your wallet to purchase balls
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PokeBallShop;
