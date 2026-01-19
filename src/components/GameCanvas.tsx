import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import { gameConfig } from '../game/config/gameConfig';
import type { TradeListing } from '../services/contractService';

interface GameCanvasProps {
  onTradeClick?: (listing: TradeListing) => void;
  // Music disabled
  // onMusicToggle?: () => void;
}

export default function GameCanvas({ onTradeClick }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTradeClickRef = useRef(onTradeClick);

  // Keep the callback ref updated without causing re-renders
  useEffect(() => {
    onTradeClickRef.current = onTradeClick;
  }, [onTradeClick]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Add GameScene to config
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scene: [GameScene],
    };

    // Create Phaser game instance
    const game = new Phaser.Game(config);
    gameRef.current = game;
    
    // Expose game instance to window for volume control
    (window as any).__PHASER_GAME__ = game;

    // Listen for trade icon clicks from the scene
    const gameScene = game.scene.getScene('GameScene') as GameScene;
    if (gameScene) {
      // Use ref to avoid re-registering the event listener
      gameScene.events.on('show-trade-modal', (listing: TradeListing) => {
        if (onTradeClickRef.current) {
          onTradeClickRef.current(listing);
        }
      });
      
      // Music disabled
    }

    // Cleanup only on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        (window as any).__PHASER_GAME__ = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div
      id="game-container"
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        imageRendering: 'pixelated',
        backgroundColor: '#000',
      }}
    />
  );
}
