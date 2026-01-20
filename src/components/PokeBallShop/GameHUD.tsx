/**
 * GameHUD Component
 *
 * Heads-up display overlay for the game, showing player's ball inventory
 * and providing access to the PokeBall shop.
 *
 * Usage:
 * ```tsx
 * import { GameHUD } from './components/PokeBallShop/GameHUD';
 *
 * function App() {
 *   return (
 *     <div>
 *       <GameCanvas />
 *       <GameHUD />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useState } from 'react';
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React';
import {
  usePlayerBallInventory,
  getBallTypeName,
  type BallType,
} from '../../hooks/pokeballGame';
import { PokeBallShop } from './PokeBallShop';

// ============================================================
// STYLES (Inline pixel art aesthetic)
// ============================================================

const styles = {
  container: {
    position: 'fixed' as const,
    top: '16px',
    right: '16px',
    zIndex: 100,
    fontFamily: "'Courier New', monospace",
    imageRendering: 'pixelated' as const,
  },
  inventoryBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '3px solid #fff',
    padding: '12px',
    marginBottom: '8px',
    minWidth: '140px',
  },
  inventoryTitle: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  inventoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  ballDot: {
    width: '10px',
    height: '10px',
    border: '1px solid #fff',
  },
  ballCount: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  shopButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#1a3a1a',
    border: '3px solid #00ff00',
    color: '#00ff00',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.1s',
  },
  shopButtonHover: {
    backgroundColor: '#2a4a2a',
  },
  noWallet: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '3px solid #ffcc00',
    padding: '12px',
    color: '#ffcc00',
    fontSize: '12px',
    textAlign: 'center' as const,
  },
};

// Ball type colors
const BALL_COLORS: Record<BallType, string> = {
  0: '#ff4444', // Poke Ball - Red
  1: '#4488ff', // Great Ball - Blue
  2: '#ffcc00', // Ultra Ball - Yellow
  3: '#aa44ff', // Master Ball - Purple
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function GameHUD() {
  const { account } = useActiveWeb3React();
  const [shopOpen, setShopOpen] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  const inventory = usePlayerBallInventory(account);

  // Ball inventory data
  const balls: { type: BallType; count: number }[] = [
    { type: 0, count: inventory.pokeBalls },
    { type: 1, count: inventory.greatBalls },
    { type: 2, count: inventory.ultraBalls },
    { type: 3, count: inventory.masterBalls },
  ];

  return (
    <>
      <div style={styles.container}>
        {account ? (
          <>
            {/* Inventory Display */}
            <div style={styles.inventoryBox}>
              <div style={styles.inventoryTitle}>POKE BALLS</div>
              <div style={styles.inventoryGrid}>
                {balls.map(({ type, count }) => (
                  <div key={type} style={styles.inventoryItem}>
                    <div
                      style={{
                        ...styles.ballDot,
                        backgroundColor: BALL_COLORS[type],
                      }}
                      title={getBallTypeName(type)}
                    />
                    <span
                      style={{
                        ...styles.ballCount,
                        color: count > 0 ? BALL_COLORS[type] : '#666',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
          </>
        ) : (
          <div style={styles.noWallet}>Connect Wallet</div>
        )}
      </div>

      {/* Shop Modal */}
      <PokeBallShop
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        playerAddress={account}
      />
    </>
  );
}

export default GameHUD;
