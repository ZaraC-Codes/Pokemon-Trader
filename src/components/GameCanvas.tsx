import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import { EasyCatchScene } from '../game/scenes/EasyCatchScene';
import { gameConfig, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../game/config/gameConfig';
import type { TradeListing } from '../services/contractService';
import { useGetPokemonSpawns, type PokemonSpawn as ContractPokemonSpawn } from '../hooks/pokeballGame/useGetPokemonSpawns';
import type { PokemonSpawn as ManagerPokemonSpawn } from '../game/managers/PokemonSpawnManager';
import type { BallType } from '../game/managers/BallInventoryManager';

/** Data emitted when a Pokemon is ready to catch (player in range) */
export interface PokemonClickData {
  pokemonId: bigint;
  slotIndex: number;
  attemptCount: number;
  x: number;
  y: number;
}

/** Data emitted when player tries to catch Pokemon but is out of range */
export interface CatchOutOfRangeData {
  pokemonId: bigint;
  distance: number;
  requiredRange: number;
  playerX: number;
  playerY: number;
}

interface GameCanvasProps {
  /** Game mode: 'adventure' for overworld, 'easy' for single encounter */
  mode?: 'adventure' | 'easy';
  onTradeClick?: (listing: TradeListing) => void;
  /** Called when player clicks Pokemon AND is in range (ready to catch) */
  onPokemonClick?: (data: PokemonClickData) => void;
  /** Called when player clicks Pokemon but is OUT of range */
  onCatchOutOfRange?: (data: CatchOutOfRangeData) => void;
  /**
   * Callback to trigger visual ball throw animation.
   * Set by parent to allow CatchAttemptModal to trigger Phaser animation.
   * Returns a function that can be called to play the animation.
   */
  onVisualThrowRef?: React.MutableRefObject<((pokemonId: bigint, ballType: BallType) => void) | null>;
  /**
   * Ref callback to notify Phaser of catch results from contract events.
   * This resets the CatchMechanicsManager state so clicks aren't blocked.
   * @param caught - Whether the Pokemon was caught
   * @param pokemonId - The Pokemon ID from the event
   */
  onCatchResultRef?: React.MutableRefObject<((caught: boolean, pokemonId: bigint) => void) | null>;
  /**
   * Ref callback for throw + struggle animation sequence.
   * Called after throw: plays ball throw arc, then loops struggle until VRF resolves.
   * Returns a cleanup function to stop the struggle animation.
   */
  onThrowAndStruggleRef?: React.MutableRefObject<
    ((pokemonId: bigint, ballType: BallType) => Promise<() => void>) | null
  >;
  // Music disabled
  // onMusicToggle?: () => void;
}

/**
 * Contract coordinate system constants.
 * The contract uses a 0-999 coordinate space for Pokemon positions.
 */
const CONTRACT_MAX_COORDINATE = 999;

/**
 * Convert contract coordinates (0-999) to game world pixels.
 * Game world is MAP_WIDTH * TILE_SIZE x MAP_HEIGHT * TILE_SIZE pixels.
 *
 * @param contractCoord - Coordinate from contract (0-999)
 * @param worldSize - Game world size in pixels (e.g., 2400)
 * @returns Scaled coordinate in game world pixels
 */
function scaleContractToWorld(contractCoord: number, worldSize: number): number {
  // Scale from 0-999 to 0-worldSize
  // Add a small margin (1 tile) to avoid spawning at exact edges
  const margin = TILE_SIZE;
  const usableSize = worldSize - margin * 2;
  const scaled = (contractCoord / CONTRACT_MAX_COORDINATE) * usableSize + margin;
  return Math.floor(scaled);
}

/**
 * Convert contract spawn format to PokemonSpawnManager format.
 * The contract returns position in 0-999 range, timestamp in Unix seconds.
 * Positions are scaled to match the game world size.
 */
function toManagerSpawn(contract: ContractPokemonSpawn, index: number): ManagerPokemonSpawn {
  // Calculate world dimensions
  const worldWidth = MAP_WIDTH * TILE_SIZE;   // 150 * 16 = 2400
  const worldHeight = MAP_HEIGHT * TILE_SIZE; // 150 * 16 = 2400

  // Scale contract coordinates (0-999) to game world pixels
  const scaledX = scaleContractToWorld(contract.x, worldWidth);
  const scaledY = scaleContractToWorld(contract.y, worldHeight);

  // Diagnostic logging for debugging spawn sync issues
  if (index < 3) {
    console.log(`[GameCanvas] toManagerSpawn[${index}] input:`, {
      id: contract.id?.toString() ?? 'undefined',
      slotIndex: contract.slotIndex,
      contractX: contract.x,
      contractY: contract.y,
      attemptCount: contract.attemptCount,
      isActive: contract.isActive,
      spawnTime: contract.spawnTime?.toString() ?? 'undefined',
    });
    console.log(`[GameCanvas] toManagerSpawn[${index}] scaling: (${contract.x}, ${contract.y}) -> (${scaledX}, ${scaledY})`);
  }

  const result: ManagerPokemonSpawn = {
    id: contract.id,
    slotIndex: contract.slotIndex,
    x: scaledX,
    y: scaledY,
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

export default function GameCanvas({ mode = 'adventure', onTradeClick, onPokemonClick, onCatchOutOfRange, onVisualThrowRef, onCatchResultRef, onThrowAndStruggleRef }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTradeClickRef = useRef(onTradeClick);
  const onPokemonClickRef = useRef(onPokemonClick);
  const onCatchOutOfRangeRef = useRef(onCatchOutOfRange);

  // Track whether the scene is ready (pokemonSpawnManager has been created)
  const sceneReadyRef = useRef<boolean>(false);
  // Buffer to hold spawns if they arrive before scene is ready
  const pendingSpawnsRef = useRef<ContractPokemonSpawn[] | null>(null);

  const isEasyMode = mode === 'easy';
  const SceneClass = isEasyMode ? EasyCatchScene : GameScene;
  const sceneKey = isEasyMode ? 'EasyCatchScene' : 'GameScene';

  // Fetch on-chain Pokemon spawns (polls every 5 seconds)
  const { data: contractSpawns, isLoading: spawnsLoading } = useGetPokemonSpawns();

  // Keep the callback refs updated without causing re-renders
  useEffect(() => {
    onTradeClickRef.current = onTradeClick;
  }, [onTradeClick]);

  useEffect(() => {
    onPokemonClickRef.current = onPokemonClick;
  }, [onPokemonClick]);

  useEffect(() => {
    onCatchOutOfRangeRef.current = onCatchOutOfRange;
  }, [onCatchOutOfRange]);

  /**
   * Sync spawns to the active scene.
   * Adventure Mode: syncs all spawns to PokemonSpawnManager.
   * Easy Mode: picks first active spawn -> setEncounter() on EasyCatchScene.
   * Handles race condition: if scene isn't ready, buffers spawns for later.
   */
  const syncSpawnsToScene = useCallback((spawns: ContractPokemonSpawn[]) => {
    // === DIAGNOSTIC LOGGING ===
    console.log('[GameCanvas] ========== syncSpawnsToScene ==========');
    console.log('[GameCanvas] Mode:', isEasyMode ? 'easy' : 'adventure');
    console.log('[GameCanvas] Input spawns array length:', spawns?.length ?? 'undefined/null');

    const game = gameRef.current;
    if (!game) {
      console.warn('[GameCanvas] No game reference, cannot sync');
      return;
    }

    if (isEasyMode) {
      // Easy Mode: pick first active spawn -> setEncounter
      const easyScene = game.scene.getScene('EasyCatchScene') as EasyCatchScene | undefined;
      if (!easyScene || !easyScene.scene.isActive()) {
        console.log('[GameCanvas] EasyCatchScene not ready, buffering', spawns.length, 'spawns');
        pendingSpawnsRef.current = spawns;
        return;
      }

      const activeSpawns = spawns.filter((s) => s.isActive);
      console.log('[GameCanvas] Active spawns for Easy Mode:', activeSpawns.length);

      if (activeSpawns.length > 0) {
        const first = activeSpawns[0];
        console.log('[GameCanvas] Setting encounter: id=', first.id?.toString(), 'slot=', first.slotIndex);
        easyScene.setEncounter({
          pokemonId: first.id,
          slotIndex: first.slotIndex,
          attemptCount: first.attemptCount,
        });
      } else {
        console.log('[GameCanvas] No active spawns, clearing encounter');
        easyScene.clearEncounter();
      }
    } else {
      // Adventure Mode: sync all spawns to PokemonSpawnManager
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
      console.log('[GameCanvas] Calling manager.syncFromContract()...');
      manager.syncFromContract(managerSpawns, worldBounds);
    }
    console.log('[GameCanvas] ==========================================');
  }, [isEasyMode]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Boot the correct scene based on mode
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scene: [SceneClass],
    };

    // Create Phaser game instance
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Expose game instance to window for volume control
    (window as any).__PHASER_GAME__ = game;

    // =============== ADVENTURE MODE SETUP ===============
    const setupAdventureListeners = (gameScene: GameScene) => {
      gameScene.events.on('show-trade-modal', (listing: TradeListing) => {
        if (onTradeClickRef.current) {
          onTradeClickRef.current(listing);
        }
      });

      // Listen for Pokemon catch-ready events (player is in range)
      gameScene.events.on('pokemon-catch-ready', (data: PokemonClickData) => {
        console.log('[GameCanvas] Pokemon catch-ready event received:', data.pokemonId.toString());
        if (onPokemonClickRef.current) {
          onPokemonClickRef.current(data);
        }
      });

      // Listen for out-of-range events (player tried to catch but too far)
      gameScene.events.on('catch-out-of-range', (data: {
        pokemonId: bigint;
        spawn: { x: number; y: number };
        playerX: number;
        playerY: number;
        distance: number;
        requiredRange: number;
      }) => {
        console.log('[GameCanvas] Catch out-of-range event:', {
          pokemonId: data.pokemonId.toString(),
          distance: Math.round(data.distance),
          requiredRange: data.requiredRange,
        });
        if (onCatchOutOfRangeRef.current) {
          onCatchOutOfRangeRef.current({
            pokemonId: data.pokemonId,
            distance: data.distance,
            requiredRange: data.requiredRange,
            playerX: data.playerX,
            playerY: data.playerY,
          });
        }
      });

      // Mark scene as ready and flush any pending spawns
      sceneReadyRef.current = true;
      console.log('[GameCanvas] Adventure scene ready, manager available:', !!gameScene.getPokemonSpawnManager());

      if (pendingSpawnsRef.current) {
        console.log('[GameCanvas] Flushing', pendingSpawnsRef.current.length, 'buffered spawns');
        syncSpawnsToScene(pendingSpawnsRef.current);
        pendingSpawnsRef.current = null;
      }

      // Wire up refs to CatchMechanicsManager
      if (onVisualThrowRef) {
        const catchMechanicsManager = gameScene.getCatchMechanicsManager();
        if (catchMechanicsManager) {
          onVisualThrowRef.current = (pokemonId: bigint, ballType: BallType) => {
            console.log('[GameCanvas] Visual throw triggered for Pokemon:', pokemonId.toString(), 'ball:', ballType);
            catchMechanicsManager.playBallThrowById(pokemonId, ballType);
          };
          console.log('[GameCanvas] Visual throw callback registered');
        } else {
          console.warn('[GameCanvas] CatchMechanicsManager not available, visual throw disabled');
        }
      }

      if (onCatchResultRef) {
        const catchMechanicsManager = gameScene.getCatchMechanicsManager();
        if (catchMechanicsManager) {
          onCatchResultRef.current = (caught: boolean, pokemonId: bigint) => {
            console.log('[GameCanvas] Catch result received:', caught ? 'CAUGHT' : 'FAILED', 'Pokemon:', pokemonId.toString());
            catchMechanicsManager.handleCatchResult(caught, pokemonId);
          };
          console.log('[GameCanvas] Catch result callback registered');
        } else {
          console.warn('[GameCanvas] CatchMechanicsManager not available, catch result callback disabled');
        }
      }

      if (onThrowAndStruggleRef) {
        const catchMechanicsManager = gameScene.getCatchMechanicsManager();
        if (catchMechanicsManager) {
          onThrowAndStruggleRef.current = (pokemonId: bigint, ballType: BallType) => {
            console.log('[GameCanvas] Throw+struggle triggered for Pokemon:', pokemonId.toString(), 'ball:', ballType);
            return catchMechanicsManager.playBallThrowThenStruggle(pokemonId, ballType);
          };
        }
      }
    };

    // =============== EASY MODE SETUP ===============
    const setupEasyListeners = (easyScene: EasyCatchScene) => {
      // Listen for the same event shape as Adventure Mode
      easyScene.events.on('pokemon-catch-ready', (data: PokemonClickData) => {
        console.log('[GameCanvas] [Easy] Pokemon catch-ready event received:', data.pokemonId.toString());
        if (onPokemonClickRef.current) {
          onPokemonClickRef.current(data);
        }
      });

      sceneReadyRef.current = true;
      console.log('[GameCanvas] Easy scene ready');

      if (pendingSpawnsRef.current) {
        console.log('[GameCanvas] Flushing', pendingSpawnsRef.current.length, 'buffered spawns');
        syncSpawnsToScene(pendingSpawnsRef.current);
        pendingSpawnsRef.current = null;
      }

      // Wire up refs to EasyCatchScene methods directly
      if (onVisualThrowRef) {
        onVisualThrowRef.current = (_pokemonId: bigint, ballType: BallType) => {
          console.log('[GameCanvas] [Easy] Visual throw triggered, ball:', ballType);
          easyScene.playBallThrow(ballType);
        };
      }

      if (onCatchResultRef) {
        onCatchResultRef.current = (caught: boolean, pokemonId: bigint) => {
          console.log('[GameCanvas] [Easy] Catch result received:', caught ? 'CAUGHT' : 'FAILED');
          easyScene.handleCatchResult(caught, pokemonId);
        };
      }

      if (onThrowAndStruggleRef) {
        onThrowAndStruggleRef.current = (_pokemonId: bigint, ballType: BallType) => {
          console.log('[GameCanvas] [Easy] Throw+struggle triggered, ball:', ballType);
          return easyScene.playBallThrowThenStruggle(ballType);
        };
      }
    };

    // =============== SCENE BOOT ===============
    const bootScene = game.scene.getScene(sceneKey) as (GameScene | EasyCatchScene) | undefined;

    const setupListeners = isEasyMode
      ? (scene: Phaser.Scene) => setupEasyListeners(scene as EasyCatchScene)
      : (scene: Phaser.Scene) => setupAdventureListeners(scene as GameScene);

    if (bootScene && bootScene.scene.isActive()) {
      // Scene is already active (rare, but handle it)
      setupListeners(bootScene);
    } else {
      // Wait for scene to start - listen on the scene manager
      game.events.once('ready', () => {
        const scene = game.scene.getScene(sceneKey);
        if (scene) {
          // Wait for create() to complete
          scene.events.once('create', () => {
            setupListeners(scene);
          });
        }
      });
    }

    // Cleanup only on unmount
    return () => {
      sceneReadyRef.current = false;
      // Clear the visual throw ref
      if (onVisualThrowRef) {
        onVisualThrowRef.current = null;
      }
      // Clear the catch result ref
      if (onCatchResultRef) {
        onCatchResultRef.current = null;
      }
      // Clear the throw+struggle ref
      if (onThrowAndStruggleRef) {
        onThrowAndStruggleRef.current = null;
      }
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        (window as any).__PHASER_GAME__ = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount — component remounts via key={gameMode}

  // Sync spawns whenever contract data changes
  useEffect(() => {
    if (!contractSpawns || spawnsLoading) return;

    // Sync to scene (handles buffering if scene not ready)
    syncSpawnsToScene(contractSpawns);
  }, [contractSpawns, spawnsLoading, syncSpawnsToScene]);

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
