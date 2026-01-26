/**
 * CatchAttemptModal Component
 *
 * Modal component for selecting and throwing a PokeBall at a specific Pokemon.
 * Displays available balls, catch rates, and handles the gasless throw flow.
 *
 * v1.8.0 Update: Uses gasless meta-transactions via relayer API instead of
 * direct on-chain throwBall(). Player signs EIP-712 message, relayer submits.
 *
 * Usage:
 * ```tsx
 * import { CatchAttemptModal } from './components/CatchAttemptModal';
 *
 * function GameScene() {
 *   const [selectedPokemon, setSelectedPokemon] = useState<{
 *     pokemonId: bigint;
 *     slotIndex: number;
 *     attemptsRemaining: number;
 *   } | null>(null);
 *   const { account } = useActiveWeb3React();
 *
 *   // When user clicks a Pokemon in Phaser scene:
 *   const handlePokemonClick = (pokemon: PokemonSpawn) => {
 *     setSelectedPokemon({
 *       pokemonId: pokemon.id,
 *       slotIndex: pokemon.slotIndex,
 *       attemptsRemaining: 3 - pokemon.attemptCount,
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <GameCanvas onPokemonClick={handlePokemonClick} />
 *       <CatchAttemptModal
 *         isOpen={selectedPokemon !== null}
 *         onClose={() => setSelectedPokemon(null)}
 *         playerAddress={account}
 *         pokemonId={selectedPokemon?.pokemonId ?? BigInt(0)}
 *         slotIndex={selectedPokemon?.slotIndex ?? 0}
 *         attemptsRemaining={selectedPokemon?.attemptsRemaining ?? 0}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

import React, { useCallback, useEffect } from 'react';
import {
  useGaslessThrow,
  usePlayerBallInventory,
  getBallTypeName,
  getBallPriceUSD,
  getCatchRatePercent,
  type BallType,
  type ThrowStatus,
} from '../../hooks/pokeballGame';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface CatchAttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: `0x${string}`;
  /** On-chain Pokemon ID for display */
  pokemonId: bigint;
  /** Slot index (0-2) used as pokemonSlot in throwBall() */
  slotIndex: number;
  /** Number of attempts remaining before Pokemon relocates */
  attemptsRemaining: number;
  /**
   * Optional callback to trigger visual ball throw animation in Phaser.
   * Called BEFORE the contract write so the animation plays while tx is pending.
   * @param pokemonId - Target Pokemon ID
   * @param ballType - Ball type being thrown (0-3)
   */
  onVisualThrow?: (pokemonId: bigint, ballType: BallType) => void;
}

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
    maxWidth: '450px',
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
    marginBottom: '16px',
    borderBottom: '2px solid #444',
    paddingBottom: '12px',
  },
  title: {
    fontSize: '20px',
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
  pokemonInfo: {
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
    padding: '12px',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  pokemonId: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00ccff',
    marginBottom: '8px',
  },
  attemptsSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
  },
  attemptsLabel: {
    fontSize: '14px',
    color: '#888',
  },
  attemptsValue: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  attemptsHigh: {
    color: '#00ff00',
  },
  attemptsMedium: {
    color: '#ffcc00',
  },
  attemptsLow: {
    color: '#ff4444',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  ballList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '16px',
  },
  ballRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
  },
  ballRowDisabled: {
    opacity: 0.4,
    backgroundColor: '#1a1a1a',
  },
  ballColorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #fff',
    flexShrink: 0,
  },
  ballInfo: {
    flex: 1,
    minWidth: 0,
  },
  ballName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  ballStats: {
    fontSize: '12px',
    color: '#888',
  },
  ballOwned: {
    fontSize: '14px',
    textAlign: 'right' as const,
    minWidth: '70px',
  },
  throwButton: {
    padding: '10px 16px',
    border: '2px solid #00ff00',
    backgroundColor: '#1a3a1a',
    color: '#00ff00',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '90px',
  },
  throwButtonDisabled: {
    border: '2px solid #444',
    backgroundColor: '#2a2a2a',
    color: '#666',
    cursor: 'not-allowed',
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
    marginBottom: '4px',
  },
  loadingSubtext: {
    color: '#888',
    fontSize: '12px',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#3a1a1a',
    border: '2px solid #ff4444',
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: '12px',
    flex: 1,
    wordBreak: 'break-word' as const,
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
    flexShrink: 0,
  },
  warningBox: {
    padding: '12px',
    backgroundColor: '#3a3a1a',
    border: '2px solid #ffcc00',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  warningText: {
    color: '#ffcc00',
    fontSize: '12px',
  },
  noBallsMessage: {
    padding: '20px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
    textAlign: 'center' as const,
    color: '#888',
    fontSize: '14px',
  },
  footer: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '2px solid #444',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#666',
  },
};

// Ball type colors for visual distinction
const BALL_COLORS: Record<BallType, string> = {
  0: '#ff4444', // Poke Ball - Red
  1: '#4488ff', // Great Ball - Blue
  2: '#ffcc00', // Ultra Ball - Yellow
  3: '#aa44ff', // Master Ball - Purple
};

// All ball types
const ALL_BALL_TYPES: BallType[] = [0, 1, 2, 3];

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface BallOptionProps {
  ballType: BallType;
  ownedCount: number;
  onThrow: () => void;
  isDisabled: boolean;
  isPending: boolean;
  isThrowingThis: boolean;
}

function BallOption({
  ballType,
  ownedCount,
  onThrow,
  isDisabled,
  isPending,
  isThrowingThis,
}: BallOptionProps) {
  const name = getBallTypeName(ballType);
  const price = getBallPriceUSD(ballType);
  const catchRate = getCatchRatePercent(ballType);
  const hasBalls = ownedCount > 0;
  const canThrow = hasBalls && !isDisabled && !isPending;

  return (
    <div
      style={{
        ...styles.ballRow,
        ...(hasBalls ? {} : styles.ballRowDisabled),
      }}
    >
      {/* Ball color indicator */}
      <div
        style={{
          ...styles.ballColorDot,
          backgroundColor: BALL_COLORS[ballType],
        }}
      />

      {/* Ball info */}
      <div style={styles.ballInfo}>
        <div style={{ ...styles.ballName, color: BALL_COLORS[ballType] }}>
          {name}
        </div>
        <div style={styles.ballStats}>
          ~${price.toFixed(2)} | {catchRate}% catch
        </div>
      </div>

      {/* Owned count */}
      <div style={styles.ballOwned}>
        <span style={{ color: hasBalls ? '#fff' : '#666' }}>
          Owned: {ownedCount}
        </span>
      </div>

      {/* Throw button */}
      <button
        onClick={onThrow}
        disabled={!canThrow}
        style={{
          ...styles.throwButton,
          ...(canThrow ? {} : styles.throwButtonDisabled),
        }}
      >
        {isThrowingThis ? 'Throwing...' : hasBalls ? 'Throw' : 'None'}
      </button>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function CatchAttemptModal({
  isOpen,
  onClose,
  playerAddress,
  pokemonId,
  slotIndex,
  attemptsRemaining,
  onVisualThrow,
}: CatchAttemptModalProps) {
  // Track which ball type is being thrown (for button label)
  const [throwingBallType, setThrowingBallType] = React.useState<BallType | null>(null);

  // Hooks - v1.8.0: Use gasless throw instead of direct contract write
  const {
    initiateThrow,
    throwStatus,
    isLoading,
    isPending,
    error,
    reset,
    txHash,
  } = useGaslessThrow();
  const inventory = usePlayerBallInventory(playerAddress);

  // Get ball count for each type
  const getBallCount = useCallback(
    (ballType: BallType): number => {
      switch (ballType) {
        case 0:
          return inventory.pokeBalls;
        case 1:
          return inventory.greatBalls;
        case 2:
          return inventory.ultraBalls;
        case 3:
          return inventory.masterBalls;
        default:
          return 0;
      }
    },
    [inventory]
  );

  // Check if player has any balls
  const hasAnyBalls =
    inventory.pokeBalls > 0 ||
    inventory.greatBalls > 0 ||
    inventory.ultraBalls > 0 ||
    inventory.masterBalls > 0;

  // Debug log inventory data to diagnose sync issues
  useEffect(() => {
    if (isOpen) {
      console.log('[CatchAttemptModal] === MODAL OPENED ===');
      console.log('[CatchAttemptModal] playerAddress:', playerAddress ?? 'UNDEFINED');
      console.log('[CatchAttemptModal] isContractConfigured:', inventory.isContractConfigured);
      console.log('[CatchAttemptModal] On-chain inventory:', {
        pokeBalls: inventory.pokeBalls,
        greatBalls: inventory.greatBalls,
        ultraBalls: inventory.ultraBalls,
        masterBalls: inventory.masterBalls,
        totalBalls: inventory.totalBalls,
        isLoading: inventory.isLoading,
        error: inventory.error?.message ?? 'none',
      });
      console.log('[CatchAttemptModal] Gasless throw status:', throwStatus);
      console.log('[CatchAttemptModal] hasAnyBalls:', hasAnyBalls);
    }
  }, [playerAddress, isOpen, inventory, throwStatus, hasAnyBalls]);

  // Get status message for the current throw state
  const getStatusMessage = useCallback((status: ThrowStatus): string => {
    switch (status) {
      case 'fetching_nonce':
        return 'Preparing throw...';
      case 'signing':
        return 'Please sign the message in your wallet';
      case 'submitting':
        return 'Sending to relayer...';
      case 'pending':
        return 'Waiting for confirmation...';
      default:
        return 'Throwing...';
    }
  }, []);

  // Handle throw - v1.8.0: Use gasless meta-transaction
  const handleThrow = useCallback(
    async (ballType: BallType) => {
      if (getBallCount(ballType) <= 0) {
        console.error('[CatchAttemptModal] No balls of type', ballType);
        return;
      }

      console.log('[CatchAttemptModal] === GASLESS THROW INITIATED ===');
      console.log('[CatchAttemptModal] ballType:', ballType);
      console.log('[CatchAttemptModal] slotIndex:', slotIndex);
      console.log('[CatchAttemptModal] pokemonId:', pokemonId.toString());

      setThrowingBallType(ballType);

      // v1.8.0: Sign EIP-712 message and submit to relayer
      console.log('[CatchAttemptModal] Calling initiateThrow() for gasless flow...');
      try {
        const success = await initiateThrow(slotIndex, ballType);
        console.log('[CatchAttemptModal] initiateThrow() returned:', success);

        if (success) {
          console.log('[CatchAttemptModal] Throw submitted to relayer!');

          // Trigger visual throw animation AFTER relayer accepts
          if (onVisualThrow) {
            console.log('[CatchAttemptModal] Triggering visual throw animation...');
            onVisualThrow(pokemonId, ballType);
          }

          // Close the modal AFTER signature is sent so the animation is visible
          console.log('[CatchAttemptModal] Closing modal after throw submitted...');
          onClose();
        } else {
          console.error('[CatchAttemptModal] initiateThrow() returned false - throw blocked');
          // Don't close modal - show error state
          setThrowingBallType(null);
        }
      } catch (err) {
        console.error('[CatchAttemptModal] initiateThrow() threw error:', err);
        setThrowingBallType(null);
      }
    },
    [slotIndex, getBallCount, onVisualThrow, pokemonId, onClose, initiateThrow]
  );

  // Reset throwing state when transaction completes or errors
  React.useEffect(() => {
    if (throwStatus === 'idle' || throwStatus === 'error' || throwStatus === 'success') {
      // Small delay to show status briefly
      const timer = setTimeout(() => {
        setThrowingBallType(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [throwStatus]);

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    reset();
    setThrowingBallType(null);
  }, [reset]);

  // Close modal after successful throw (let parent handle result)
  // The modal just handles the throw initiation, not the VRNG result

  // Get attempts color
  const getAttemptsColor = () => {
    if (attemptsRemaining >= 3) return styles.attemptsHigh;
    if (attemptsRemaining === 2) return styles.attemptsMedium;
    return styles.attemptsLow;
  };

  // Don't render if not open
  if (!isOpen) return null;

  const isTransactionPending = isLoading || isPending;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>CATCH POKEMON</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            disabled={isTransactionPending}
          >
            CLOSE
          </button>
        </div>

        {/* Pokemon Info */}
        <div style={styles.pokemonInfo}>
          <div style={styles.pokemonId}>
            Pokemon #{pokemonId.toString()}
          </div>
          <div style={styles.attemptsSection}>
            <span style={styles.attemptsLabel}>Attempts remaining:</span>
            <span style={{ ...styles.attemptsValue, ...getAttemptsColor() }}>
              {attemptsRemaining}
            </span>
          </div>
        </div>

        {/* No wallet warning */}
        {!playerAddress && (
          <div style={styles.warningBox}>
            <span style={styles.warningText}>
              Connect your wallet to throw a ball.
            </span>
          </div>
        )}

        {/* Loading State - v1.8.0: Shows gasless throw status */}
        {isTransactionPending && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingText}>{getStatusMessage(throwStatus)}</div>
            <div style={styles.loadingSubtext}>
              {throwStatus === 'signing' ? 'No gas required - just sign!' : 'Processing...'}
            </div>
          </div>
        )}

        {/* Ball Selection */}
        {playerAddress && (
          <>
            <div style={styles.sectionTitle}>Select a Ball</div>

            {hasAnyBalls ? (
              <div style={styles.ballList}>
                {/* Show all ball types, but only available ones are enabled */}
                {ALL_BALL_TYPES.map((ballType) => {
                  const count = getBallCount(ballType);
                  // Only render rows for balls the player owns
                  if (count === 0) return null;

                  return (
                    <BallOption
                      key={ballType}
                      ballType={ballType}
                      ownedCount={count}
                      onThrow={() => handleThrow(ballType)}
                      isDisabled={attemptsRemaining <= 0}
                      isPending={isTransactionPending}
                      isThrowingThis={
                        isTransactionPending && throwingBallType === ballType
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div style={styles.noBallsMessage}>
                You don't have any PokeBalls!
                <br />
                <span style={{ color: '#ffcc00' }}>
                  Visit the shop to buy some.
                </span>
              </div>
            )}
          </>
        )}

        {/* v1.8.0: No fee warnings needed - gasless throws are free for players */}

        {/* Error Display - show error message from gasless throw */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>
              {error}
            </span>
            <button style={styles.dismissButton} onClick={handleDismissError}>
              Dismiss
            </button>
          </div>
        )}

        {/* No attempts warning */}
        {attemptsRemaining <= 0 && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>
              No attempts remaining! This Pokemon will relocate.
            </span>
          </div>
        )}

        {/* Footer hint - v1.8.0: No entropy fee display since it's gasless */}
        <div style={styles.footer}>
          Slot #{slotIndex} | Higher tier balls have better catch rates
          <div style={{ marginTop: '4px', color: '#00ff88' }}>
            ✓ Gasless throw - no transaction fees!
          </div>
          {txHash && (
            <div style={{ marginTop: '4px', color: '#888' }}>
              TX: {txHash.slice(0, 10)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CatchAttemptModal;
