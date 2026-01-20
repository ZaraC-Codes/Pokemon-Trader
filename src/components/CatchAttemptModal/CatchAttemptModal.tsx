/**
 * CatchAttemptModal Component
 *
 * Modal component for selecting and throwing a PokeBall at a specific Pokemon.
 * Displays available balls, catch rates, and handles the contract interaction.
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

import React, { useCallback } from 'react';
import {
  useThrowBall,
  usePlayerBallInventory,
  getBallTypeName,
  getBallPriceUSD,
  getCatchRatePercent,
  type BallType,
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
}: CatchAttemptModalProps) {
  // Track which ball type is being thrown (for button label)
  const [throwingBallType, setThrowingBallType] = React.useState<BallType | null>(null);

  // Hooks
  const { write, isLoading, isPending, error, reset } = useThrowBall();
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

  // Filter to only show balls the player owns
  const availableBallTypes = ALL_BALL_TYPES.filter(
    (ballType) => getBallCount(ballType) > 0
  );

  // Handle throw
  const handleThrow = useCallback(
    (ballType: BallType) => {
      if (!write) return;
      if (getBallCount(ballType) <= 0) return;

      setThrowingBallType(ballType);
      write(slotIndex, ballType);
    },
    [write, slotIndex, getBallCount]
  );

  // Reset throwing state when transaction completes or errors
  React.useEffect(() => {
    if (!isLoading && !isPending) {
      // Small delay to show "Throwing..." briefly
      const timer = setTimeout(() => {
        setThrowingBallType(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isPending]);

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

        {/* Loading State */}
        {isTransactionPending && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingText}>Throwing ball...</div>
            <div style={styles.loadingSubtext}>
              Please confirm in your wallet
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
                      isDisabled={!write || attemptsRemaining <= 0}
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

        {/* No attempts warning */}
        {attemptsRemaining <= 0 && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>
              No attempts remaining! This Pokemon will relocate.
            </span>
          </div>
        )}

        {/* Footer hint */}
        <div style={styles.footer}>
          Slot #{slotIndex} | Higher tier balls have better catch rates
        </div>
      </div>
    </div>
  );
}

export default CatchAttemptModal;
