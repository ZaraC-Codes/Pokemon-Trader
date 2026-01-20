import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import { gameConfig } from '../game/config/gameConfig';
import type { TradeListing } from '../services/contractService';

/** Data emitted when a Pokemon is clicked in the Phaser scene */
export interface PokemonClickData {
  pokemonId: bigint;
  slotIndex: number;
  attemptCount: number;
  x: number;
  y: number;
}

interface GameCanvasProps {
  onTradeClick?: (listing: TradeListing) => void;
  onPokemonClick?: (data: PokemonClickData) => void;
  // Music disabled
  // onMusicToggle?: () => void;
}

export default function GameCanvas({ onTradeClick, onPokemonClick }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTradeClickRef = useRef(onTradeClick);
  const onPokemonClickRef = useRef(onPokemonClick);

  // Keep the callback refs updated without causing re-renders
  useEffect(() => {
    onTradeClickRef.current = onTradeClick;
  }, [onTradeClick]);

  useEffect(() => {
    onPokemonClickRef.current = onPokemonClick;
  }, [onPokemonClick]);

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

      // Listen for Pokemon clicks from the scene
      gameScene.events.on('pokemon-clicked', (data: PokemonClickData) => {
        if (onPokemonClickRef.current) {
          onPokemonClickRef.current(data);
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
