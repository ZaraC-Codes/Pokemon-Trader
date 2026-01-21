import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import { gameConfig, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../game/config/gameConfig';
import type { TradeListing } from '../services/contractService';
import { useGetPokemonSpawns, type PokemonSpawn as ContractPokemonSpawn } from '../hooks/pokeballGame/useGetPokemonSpawns';
import type { PokemonSpawn as ManagerPokemonSpawn } from '../game/managers/PokemonSpawnManager';

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

/**
 * Convert contract spawn format to PokemonSpawnManager format.
 * The contract returns position in pixels, timestamp in Unix seconds.
 */
function toManagerSpawn(contract: ContractPokemonSpawn, index: number): ManagerPokemonSpawn {
  // Diagnostic logging for debugging spawn sync issues
  if (index < 3) {
    console.log(`[GameCanvas] toManagerSpawn[${index}] input:`, {
      id: contract.id?.toString() ?? 'undefined',
      slotIndex: contract.slotIndex,
      x: contract.x,
      y: contract.y,
      attemptCount: contract.attemptCount,
      isActive: contract.isActive,
      spawnTime: contract.spawnTime?.toString() ?? 'undefined',
    });
  }

  const result: ManagerPokemonSpawn = {
    id: contract.id,
    slotIndex: contract.slotIndex,
    x: contract.x,
    y: contract.y,
    attemptCount: contract.attemptCount,
    timestamp: Number(contract.spawnTime) * 1000, // Convert seconds to ms
    // entity and grassRustle are set by PokemonSpawnManager
  };

  if (index < 3) {
    console.log(`[GameCanvas] toManagerSpawn[${index}] output:`, {
      id: result.id?.toString() ?? 'undefined',
      slotIndex: result.slotIndex,
      x: result.x,
      y: result.y,
      attemptCount: result.attemptCount,
      timestamp: result.timestamp,
    });
  }

  return result;
}

export default function GameCanvas({ onTradeClick, onPokemonClick }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTradeClickRef = useRef(onTradeClick);
  const onPokemonClickRef = useRef(onPokemonClick);

  // Track whether the scene is ready (pokemonSpawnManager has been created)
  const sceneReadyRef = useRef<boolean>(false);
  // Buffer to hold spawns if they arrive before scene is ready
  const pendingSpawnsRef = useRef<ContractPokemonSpawn[] | null>(null);

  // Fetch on-chain Pokemon spawns (polls every 5 seconds)
  const { data: contractSpawns, isLoading: spawnsLoading } = useGetPokemonSpawns();

  // Keep the callback refs updated without causing re-renders
  useEffect(() => {
    onTradeClickRef.current = onTradeClick;
  }, [onTradeClick]);

  useEffect(() => {
    onPokemonClickRef.current = onPokemonClick;
  }, [onPokemonClick]);

  /**
   * Sync spawns to PokemonSpawnManager.
   * Handles race condition: if scene isn't ready, buffers spawns for later.
   */
  const syncSpawnsToManager = useCallback((spawns: ContractPokemonSpawn[]) => {
    // === DIAGNOSTIC LOGGING ===
    console.log('[GameCanvas] ========== syncSpawnsToManager ==========');
    console.log('[GameCanvas] Input spawns array length:', spawns?.length ?? 'undefined/null');
    console.log('[GameCanvas] Input spawns type:', typeof spawns, Array.isArray(spawns));

    const game = gameRef.current;
    if (!game) {
      console.warn('[GameCanvas] No game reference, cannot sync');
      return;
    }

    const scene = game.scene.getScene('GameScene') as GameScene | undefined;
    console.log('[GameCanvas] Scene exists:', !!scene);
    console.log('[GameCanvas] Scene active:', scene?.scene?.isActive?.() ?? 'N/A');

    const manager = scene?.getPokemonSpawnManager();
    console.log('[GameCanvas] Manager exists:', !!manager);

    if (!manager) {
      // Scene not ready yet - buffer the spawns
      console.log('[GameCanvas] Scene not ready, buffering', spawns.length, 'spawns');
      pendingSpawnsRef.current = spawns;
      return;
    }

    // Log raw contract spawn data
    console.log('[GameCanvas] Raw contract spawns (first 3):');
    for (let i = 0; i < Math.min(3, spawns.length); i++) {
      const s = spawns[i];
      console.log(`  [${i}]:`, {
        id: s.id?.toString(),
        slotIndex: s.slotIndex,
        x: s.x,
        y: s.y,
        isActive: s.isActive,
        attemptCount: s.attemptCount,
        spawnTime: s.spawnTime?.toString(),
      });
    }

    // Convert to manager format and sync
    const managerSpawns = spawns.map((spawn, index) => toManagerSpawn(spawn, index));
    const worldBounds = {
      width: MAP_WIDTH * TILE_SIZE,
      height: MAP_HEIGHT * TILE_SIZE,
    };

    console.log('[GameCanvas] Converted managerSpawns length:', managerSpawns.length);
    console.log('[GameCanvas] World bounds:', worldBounds);
    console.log('[GameCanvas] Calling manager.syncFromContract()...');
    manager.syncFromContract(managerSpawns, worldBounds);
    console.log('[GameCanvas] ==========================================');
  }, []);

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

    // Wait for scene to start before attaching listeners
    // Phaser's scene.getScene() returns the scene immediately, but it may not be initialized
    // We need to wait for the 'create' event which fires after create() completes
    const setupSceneListeners = (gameScene: GameScene) => {
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

      // Mark scene as ready and flush any pending spawns
      sceneReadyRef.current = true;
      console.log('[GameCanvas] Scene is ready, manager available:', !!gameScene.getPokemonSpawnManager());

      if (pendingSpawnsRef.current) {
        console.log('[GameCanvas] Flushing', pendingSpawnsRef.current.length, 'buffered spawns');
        syncSpawnsToManager(pendingSpawnsRef.current);
        pendingSpawnsRef.current = null;
      }
    };

    // Try to get the scene - it may or may not be ready
    const gameScene = game.scene.getScene('GameScene') as GameScene | undefined;

    if (gameScene && gameScene.scene.isActive()) {
      // Scene is already active (rare, but handle it)
      setupSceneListeners(gameScene);
    } else {
      // Wait for scene to start - listen on the scene manager
      game.events.once('ready', () => {
        const scene = game.scene.getScene('GameScene') as GameScene;
        if (scene) {
          // Wait for create() to complete
          scene.events.once('create', () => {
            setupSceneListeners(scene);
          });
        }
      });
    }

    // Cleanup only on unmount
    return () => {
      sceneReadyRef.current = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        (window as any).__PHASER_GAME__ = null;
      }
    };
  }, [syncSpawnsToManager]); // Include syncSpawnsToManager in deps

  // Sync spawns whenever contract data changes
  useEffect(() => {
    if (!contractSpawns || spawnsLoading) return;

    // Sync to manager (handles buffering if scene not ready)
    syncSpawnsToManager(contractSpawns);
  }, [contractSpawns, spawnsLoading, syncSpawnsToManager]);

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
