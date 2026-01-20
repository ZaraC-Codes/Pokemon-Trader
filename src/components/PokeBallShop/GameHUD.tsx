/**
 * GameHUD Component
 *
 * Heads-up display overlay for the game, showing:
 * - Player's ball inventory (counts for each type)
 * - Active Pokemon count with attempt indicators
 * - Quick shop button
 *
 * Features:
 * - Real-time updates via polling hooks (5s for spawns, 10s for inventory)
 * - Mobile-responsive layout (stacks vertically on small screens)
 * - Always visible, non-intrusive design in top-right corner
 *
 * Usage:
 * ```tsx
 * import { GameHUD } from './components/PokeBallShop';
 *
 * function AppContent() {
 *   const { account } = useActiveWeb3React();
 *
 *   return (
 *     <div>
 *       <GameCanvas />
 *       <GameHUD playerAddress={account} />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  usePlayerBallInventory,
  useGetPokemonSpawns,
  getBallTypeName,
  type BallType,
} from '../../hooks/pokeballGame';
import { PokeBallShop } from './PokeBallShop';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface GameHUDProps {
  playerAddress?: `0x${string}`;
}

// ============================================================
// CONSTANTS
// ============================================================

/** Maximum attempts before Pokemon relocates */
const MAX_ATTEMPTS = 3;

// Ball type colors
const BALL_COLORS: Record<BallType, string> = {
  0: '#ff4444', // Poke Ball - Red
  1: '#4488ff', // Great Ball - Blue
  2: '#ffcc00', // Ultra Ball - Yellow
  3: '#aa44ff', // Master Ball - Purple
};

// ============================================================
// RESPONSIVE STYLES (injected as style tag)
// ============================================================

const responsiveStyles = `
  @media (max-width: 768px) {
    .game-hud-container {
      flex-direction: column !important;
      align-items: flex-end !important;
      gap: 6px !important;
    }
    .game-hud-container > div,
    .game-hud-container > button {
      min-width: 140px !important;
    }
    .game-hud-ball-grid {
      grid-template-columns: repeat(4, 1fr) !important;
    }
    .game-hud-spawns-list {
      flex-direction: column !important;
      gap: 4px !important;
    }
  }

  @keyframes hudPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  .game-hud-loading-dot {
    animation: hudPulse 1s infinite;
  }
`;

// ============================================================
// INLINE STYLES
// ============================================================

const styles = {
  container: {
    position: 'fixed' as const,
    top: '16px',
    right: '16px',
    zIndex: 100,
    fontFamily: "'Courier New', monospace",
    imageRendering: 'pixelated' as const,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    gap: '8px',
  },
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid #fff',
    padding: '10px',
  },
  sectionTitle: {
    fontSize: '10px',
    color: '#888',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  // Ball inventory styles
  ballGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  ballItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  ballDot: {
    width: '10px',
    height: '10px',
    border: '1px solid #fff',
    flexShrink: 0,
  },
  ballCount: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  // Pokemon spawns styles
  spawnsContainer: {
    minWidth: '100px',
  },
  spawnsCount: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ccff',
    marginBottom: '6px',
  },
  spawnsList: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  spawnBadge: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
    padding: '3px 5px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
  },
  spawnSlot: {
    fontSize: '9px',
    color: '#888',
  },
  attemptDots: {
    display: 'flex',
    gap: '2px',
  },
  attemptDot: {
    width: '5px',
    height: '5px',
  },
  attemptDotRemaining: {
    backgroundColor: '#00ff00',
  },
  attemptDotUsed: {
    backgroundColor: '#ff4444',
  },
  noSpawns: {
    fontSize: '10px',
    color: '#666',
    fontStyle: 'italic' as const,
  },
  // Shop button styles
  shopButton: {
    padding: '10px 14px',
    backgroundColor: '#1a3a1a',
    border: '2px solid #00ff00',
    color: '#00ff00',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.1s',
    whiteSpace: 'nowrap' as const,
  },
  shopButtonHover: {
    backgroundColor: '#2a4a2a',
    borderColor: '#00ff66',
  },
  // No wallet styles
  noWallet: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid #ffcc00',
    padding: '10px 14px',
    color: '#ffcc00',
    fontSize: '11px',
    textAlign: 'center' as const,
  },
  // Loading indicator
  loadingDot: {
    display: 'inline-block',
    width: '4px',
    height: '4px',
    backgroundColor: '#888',
    marginLeft: '4px',
  },
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Ball inventory section */
function BallInventorySection({
  inventory,
}: {
  inventory: ReturnType<typeof usePlayerBallInventory>;
}) {
  const balls: { type: BallType; count: number }[] = [
    { type: 0, count: inventory.pokeBalls },
    { type: 1, count: inventory.greatBalls },
    { type: 2, count: inventory.ultraBalls },
    { type: 3, count: inventory.masterBalls },
  ];

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Balls</div>
      <div style={styles.ballGrid} className="game-hud-ball-grid">
        {balls.map(({ type, count }) => (
          <div key={type} style={styles.ballItem} title={getBallTypeName(type)}>
            <div
              style={{
                ...styles.ballDot,
                backgroundColor: BALL_COLORS[type],
              }}
            />
            <span
              style={{
                ...styles.ballCount,
                color: count > 0 ? BALL_COLORS[type] : '#444',
              }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Attempt dots indicator for a single spawn */
function AttemptDots({ attemptCount }: { attemptCount: number }) {
  const remaining = MAX_ATTEMPTS - attemptCount;

  return (
    <div style={styles.attemptDots} title={`${remaining} attempts left`}>
      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.attemptDot,
            ...(i < attemptCount
              ? styles.attemptDotUsed
              : styles.attemptDotRemaining),
          }}
        />
      ))}
    </div>
  );
}

/** Active Pokemon spawns section */
function PokemonSpawnsSection() {
  const { data: spawns, isLoading } = useGetPokemonSpawns();

  const activeCount = spawns?.length ?? 0;

  return (
    <div style={{ ...styles.section, ...styles.spawnsContainer }}>
      <div style={styles.sectionTitle}>
        Pokemon
        {isLoading && (
          <span style={styles.loadingDot} className="game-hud-loading-dot" />
        )}
      </div>
      <div style={styles.spawnsCount}>{activeCount} Active</div>
      {activeCount > 0 ? (
        <div style={styles.spawnsList} className="game-hud-spawns-list">
          {spawns!.map((spawn) => (
            <div key={spawn.slotIndex} style={styles.spawnBadge}>
              <span style={styles.spawnSlot}>S{spawn.slotIndex + 1}</span>
              <AttemptDots attemptCount={spawn.attemptCount} />
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.noSpawns}>None nearby</div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function GameHUD({ playerAddress }: GameHUDProps) {
  const [shopOpen, setShopOpen] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  // Inject responsive styles on mount
  useEffect(() => {
    const styleId = 'game-hud-responsive-styles';
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = responsiveStyles;
      document.head.appendChild(styleTag);
    }
  }, []);

  const inventory = usePlayerBallInventory(playerAddress);

  // No wallet connected
  if (!playerAddress) {
    return (
      <div style={styles.container}>
        <div style={styles.noWallet}>Connect Wallet</div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container} className="game-hud-container">
        {/* Ball Inventory */}
        <BallInventorySection inventory={inventory} />

        {/* Active Pokemon */}
        <PokemonSpawnsSection />

        {/* Shop Button */}
        <button
          style={{
            ...styles.shopButton,
            ...(buttonHover ? styles.shopButtonHover : {}),
          }}
          onClick={() => setShopOpen(true)}
          onMouseEnter={() => setButtonHover(true)}
          onMouseLeave={() => setButtonHover(false)}
        >
          SHOP
        </button>
      </div>

      {/* Shop Modal */}
      <PokeBallShop
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        playerAddress={playerAddress}
      />
    </>
  );
}

export default GameHUD;
