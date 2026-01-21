/**
 * GameHUD Component
 *
 * Heads-up display overlay for the game, showing:
 * - Player's ball inventory (counts for each type)
 * - Quick shop button
 *
 * Features:
 * - Real-time updates via polling hooks (10s for inventory)
 * - Mobile-responsive layout (stacks vertically on small screens)
 * - Positioned to the left of wallet connect button
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

import { useState, useEffect } from 'react';
import {
  usePlayerBallInventory,
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
  /* ============================================================
   * TOP BAR LAYOUT - Wallet + HUD coordination
   * ============================================================ */

  /* Wallet connector - always top-right */
  .wallet-connector {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 1000;
  }

  /* Game HUD - positioned to the left of wallet */
  .game-hud-container {
    position: fixed;
    top: 12px;
    right: 220px; /* Leave space for wallet button (~200px) + margin */
    z-index: 100;
    font-family: 'Courier New', monospace;
    image-rendering: pixelated;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }

  /* ============================================================
   * DESKTOP STYLES (default)
   * ============================================================ */
  @media (min-width: 769px) {
    .game-hud-container {
      flex-direction: row;
    }
  }

  /* ============================================================
   * TABLET / SMALLER DESKTOP - HUD moves down below wallet
   * ============================================================ */
  @media (max-width: 900px) {
    .game-hud-container {
      top: 70px; /* Move below wallet row */
      right: 12px; /* Align with wallet */
      flex-direction: row;
    }
  }

  /* ============================================================
   * MOBILE STYLES - Stack vertically
   * ============================================================ */
  @media (max-width: 768px) {
    .wallet-connector {
      top: 8px;
      right: 8px;
    }

    .game-hud-container {
      top: 60px; /* Below wallet */
      right: 8px;
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
  }

  /* ============================================================
   * VERY SMALL MOBILE - Compact layout
   * ============================================================ */
  @media (max-width: 480px) {
    .wallet-connector {
      top: 6px;
      right: 6px;
    }

    .game-hud-container {
      top: 55px;
      right: 6px;
      gap: 4px !important;
    }

    .game-hud-container > div,
    .game-hud-container > button {
      min-width: 120px !important;
      padding: 6px !important;
    }
  }

  /* ============================================================
   * ANIMATIONS
   * ============================================================ */
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
  // Container styles are now handled by CSS class .game-hud-container
  // Only fallback/base styles here that CSS may override
  container: {
    // Position and layout handled by CSS for responsive coordination with wallet
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
      <div className="game-hud-container">
        <div style={styles.noWallet}>Connect Wallet</div>
      </div>
    );
  }

  return (
    <>
      <div className="game-hud-container">
        {/* Ball Inventory */}
        <BallInventorySection inventory={inventory} />

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
