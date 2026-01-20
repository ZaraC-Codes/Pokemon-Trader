import type { GameScene } from '../scenes/GameScene';
import { Pokemon } from '../entities/Pokemon';

/**
 * Represents a Pokemon spawn in the game world.
 * Maps directly to on-chain Pokemon data from the PokeballGame contract.
 */
export interface PokemonSpawn {
  /** Unique Pokemon ID from the contract (uint256) */
  id: bigint;
  /** X position in pixels (world coordinates) */
  x: number;
  /** Y position in pixels (world coordinates) */
  y: number;
  /** Number of throw attempts made against this Pokemon (0-3) */
  attemptCount: number;
  /** Timestamp when Pokemon was spawned (ms since epoch) */
  timestamp: number;
  /** Visual Phaser entity (created when spawn is added) */
  entity?: Pokemon;
}

/**
 * Configuration constants for Pokemon spawn management.
 * Easily adjustable for game balancing.
 */
const SPAWN_CONFIG = {
  /** Maximum number of Pokemon that can be active at once */
  MAX_ACTIVE_SPAWNS: 3,
  /** Maximum throw attempts before Pokemon relocates */
  MAX_ATTEMPTS: 3,
  /** Catch interaction radius in pixels (how close player must be) */
  CATCH_RANGE_PIXELS: 48,
  /** Distance threshold for getSpawnAt queries in pixels */
  SPAWN_QUERY_RADIUS: 32,
} as const;

/**
 * PokemonSpawnManager
 *
 * Manages up to 3 active Pokemon spawns in the game world.
 * Syncs state with the on-chain PokeballGame contract via event-driven methods.
 *
 * Integration points:
 * - React hooks call sync methods when contract events fire
 * - Visual Pokemon entities are created/destroyed automatically
 * - Emits Phaser events for UI layer to react to state changes
 *
 * Usage:
 * ```ts
 * // In GameScene.create():
 * this.pokemonSpawnManager = new PokemonSpawnManager(this);
 *
 * // From React Web3 event listener:
 * pokemonSpawnManager.onSpawnAdded(newSpawn);
 * pokemonSpawnManager.onCaughtPokemon(pokemonId);
 * ```
 */
export class PokemonSpawnManager {
  /** Reference to the Phaser scene */
  private scene: GameScene;

  /** Array of currently active Pokemon spawns (max 3) */
  private activeSpawns: PokemonSpawn[] = [];

  /** Flag to prevent duplicate initialization */
  private isInitialized: boolean = false;

  constructor(scene: GameScene) {
    this.scene = scene;
    console.log('[PokemonSpawnManager] Initialized');
  }

  // ============================================================
  // CONTRACT SYNC METHODS
  // Called from external layers (React hooks, Web3 event listeners)
  // ============================================================

  /**
   * Initialize spawns from current on-chain state.
   * Called once when the scene starts to sync with existing Pokemon.
   *
   * @param initialSpawns - Array of Pokemon spawns from contract query
   */
  syncFromContract(initialSpawns: PokemonSpawn[]): void {
    console.log('[PokemonSpawnManager] Syncing from contract with', initialSpawns.length, 'spawns');

    // Clear any existing spawns (cleanup on re-sync)
    this.clearAllSpawns();

    // Add each spawn (respecting max limit)
    const spawnsToAdd = initialSpawns.slice(0, SPAWN_CONFIG.MAX_ACTIVE_SPAWNS);
    for (const spawn of spawnsToAdd) {
      this.addSpawn(spawn);
    }

    this.isInitialized = true;

    // Emit event for UI layer
    this.scene.events.emit('pokemon-spawns-synced', {
      count: this.activeSpawns.length,
      spawns: this.getAllSpawns(),
    });
  }

  /**
   * Handle a new Pokemon spawn event from the contract.
   * Called when PokemonSpawned event is emitted on-chain.
   *
   * @param spawn - New Pokemon spawn data
   */
  onSpawnAdded(spawn: PokemonSpawn): void {
    console.log('[PokemonSpawnManager] onSpawnAdded:', spawn.id.toString());

    // Check if we already have this spawn (prevent duplicates)
    if (this.getSpawnById(spawn.id)) {
      console.warn('[PokemonSpawnManager] Spawn already exists:', spawn.id.toString());
      return;
    }

    // Check if we're at max capacity
    if (this.activeSpawns.length >= SPAWN_CONFIG.MAX_ACTIVE_SPAWNS) {
      console.warn('[PokemonSpawnManager] At max capacity, cannot add spawn');
      return;
    }

    this.addSpawn(spawn);

    // Emit event for UI layer
    this.scene.events.emit('pokemon-spawn-added', {
      pokemonId: spawn.id,
      x: spawn.x,
      y: spawn.y,
      totalActive: this.activeSpawns.length,
    });
  }

  /**
   * Handle Pokemon relocation event from the contract.
   * Called when PokemonRelocated event is emitted on-chain.
   *
   * @param pokemonId - ID of the Pokemon that relocated
   * @param newX - New X position in pixels
   * @param newY - New Y position in pixels
   */
  onPokemonRelocated(pokemonId: bigint, newX: number, newY: number): void {
    console.log('[PokemonSpawnManager] onPokemonRelocated:', pokemonId.toString(), 'to', newX, newY);

    const spawn = this.getSpawnById(pokemonId);
    if (!spawn) {
      console.warn('[PokemonSpawnManager] Cannot relocate unknown Pokemon:', pokemonId.toString());
      return;
    }

    // Store old position for animation
    const oldX = spawn.x;
    const oldY = spawn.y;

    // Update position
    this.updateSpawnPosition(pokemonId, newX, newY);

    // Reset attempt count on relocation
    spawn.attemptCount = 0;

    // Emit event for UI layer (can trigger relocation animation)
    this.scene.events.emit('pokemon-relocated', {
      pokemonId,
      oldX,
      oldY,
      newX,
      newY,
    });
  }

  /**
   * Handle successful Pokemon catch event from the contract.
   * Called when CaughtPokemon event is emitted on-chain.
   *
   * @param pokemonId - ID of the Pokemon that was caught
   */
  onCaughtPokemon(pokemonId: bigint): void {
    console.log('[PokemonSpawnManager] onCaughtPokemon:', pokemonId.toString());

    const spawn = this.getSpawnById(pokemonId);
    if (!spawn) {
      console.warn('[PokemonSpawnManager] Cannot catch unknown Pokemon:', pokemonId.toString());
      return;
    }

    // Store spawn data before removal (for catch animation)
    const catchData = {
      pokemonId,
      x: spawn.x,
      y: spawn.y,
    };

    // Remove the spawn
    this.removeSpawn(pokemonId);

    // Emit event for UI layer (trigger catch celebration)
    this.scene.events.emit('pokemon-caught', catchData);
  }

  /**
   * Handle failed catch attempt event from the contract.
   * Called when FailedCatch event is emitted on-chain.
   *
   * @param pokemonId - ID of the Pokemon that dodged
   * @param attemptsRemaining - Number of attempts remaining (0-2)
   */
  onFailedCatch(pokemonId: bigint, attemptsRemaining: number): void {
    console.log('[PokemonSpawnManager] onFailedCatch:', pokemonId.toString(), 'remaining:', attemptsRemaining);

    const spawn = this.getSpawnById(pokemonId);
    if (!spawn) {
      console.warn('[PokemonSpawnManager] Cannot fail catch on unknown Pokemon:', pokemonId.toString());
      return;
    }

    // Update attempt count (contract sends remaining, we track count)
    const newAttemptCount = SPAWN_CONFIG.MAX_ATTEMPTS - attemptsRemaining;
    spawn.attemptCount = newAttemptCount;

    // Emit event for UI layer (trigger shake animation, update counter)
    this.scene.events.emit('pokemon-catch-failed', {
      pokemonId,
      attemptCount: newAttemptCount,
      attemptsRemaining,
      x: spawn.x,
      y: spawn.y,
    });

    // Note: If attemptsRemaining === 0, the contract will emit a PokemonRelocated event
    // which will be handled by onPokemonRelocated()
  }

  // ============================================================
  // SPAWN MANAGEMENT HELPERS
  // Core methods for manipulating the spawn array
  // ============================================================

  /**
   * Add a new Pokemon spawn to the active list.
   * Creates the visual entity and plays spawn effects.
   *
   * @param spawn - Pokemon spawn data to add
   */
  addSpawn(spawn: PokemonSpawn): void {
    // Enforce max spawns
    if (this.activeSpawns.length >= SPAWN_CONFIG.MAX_ACTIVE_SPAWNS) {
      console.warn('[PokemonSpawnManager] Cannot add spawn: at max capacity');
      return;
    }

    // Prevent duplicates
    if (this.getSpawnById(spawn.id)) {
      console.warn('[PokemonSpawnManager] Spawn already exists:', spawn.id.toString());
      return;
    }

    // Ensure timestamp is set
    if (!spawn.timestamp) {
      spawn.timestamp = Date.now();
    }

    // Create visual entity
    spawn.entity = this.createPokemonEntity(spawn);

    // Add to active spawns
    this.activeSpawns.push(spawn);

    // Play spawn visual effects
    this.playSpawnEffects(spawn);

    console.log('[PokemonSpawnManager] Added spawn:', spawn.id.toString(), 'at', spawn.x, spawn.y);
  }

  /**
   * Remove a Pokemon spawn from the active list.
   * Destroys the visual entity.
   *
   * @param pokemonId - ID of the Pokemon to remove
   */
  removeSpawn(pokemonId: bigint): void {
    const index = this.activeSpawns.findIndex(s => s.id === pokemonId);
    if (index === -1) {
      console.warn('[PokemonSpawnManager] Cannot remove unknown spawn:', pokemonId.toString());
      return;
    }

    const spawn = this.activeSpawns[index];

    // Destroy visual entity
    if (spawn.entity) {
      this.destroyPokemonEntity(spawn);
    }

    // Remove from array
    this.activeSpawns.splice(index, 1);

    console.log('[PokemonSpawnManager] Removed spawn:', pokemonId.toString());
  }

  /**
   * Update a Pokemon's position (for relocation).
   * Moves the visual entity to the new position.
   *
   * @param pokemonId - ID of the Pokemon to move
   * @param newX - New X position in pixels
   * @param newY - New Y position in pixels
   */
  updateSpawnPosition(pokemonId: bigint, newX: number, newY: number): void {
    const spawn = this.getSpawnById(pokemonId);
    if (!spawn) {
      console.warn('[PokemonSpawnManager] Cannot update position of unknown spawn:', pokemonId.toString());
      return;
    }

    // Update data
    spawn.x = newX;
    spawn.y = newY;

    // Move visual entity with animation
    if (spawn.entity) {
      this.animateEntityRelocation(spawn, newX, newY);
    }

    console.log('[PokemonSpawnManager] Updated position:', pokemonId.toString(), 'to', newX, newY);
  }

  /**
   * Increment the attempt count for a Pokemon.
   * Called internally when tracking throw attempts.
   *
   * @param pokemonId - ID of the Pokemon
   */
  incrementAttemptCount(pokemonId: bigint): void {
    const spawn = this.getSpawnById(pokemonId);
    if (!spawn) {
      console.warn('[PokemonSpawnManager] Cannot increment attempts on unknown spawn:', pokemonId.toString());
      return;
    }

    spawn.attemptCount = Math.min(spawn.attemptCount + 1, SPAWN_CONFIG.MAX_ATTEMPTS);

    console.log('[PokemonSpawnManager] Incremented attempts:', pokemonId.toString(), 'now at', spawn.attemptCount);
  }

  // ============================================================
  // QUERY METHODS
  // For game logic and UI to query spawn state
  // ============================================================

  /**
   * Get a spawn by its unique ID.
   *
   * @param pokemonId - ID to search for
   * @returns The spawn if found, undefined otherwise
   */
  getSpawnById(pokemonId: bigint): PokemonSpawn | undefined {
    return this.activeSpawns.find(s => s.id === pokemonId);
  }

  /**
   * Get a spawn near a given position.
   * Uses distance-based query within SPAWN_QUERY_RADIUS.
   *
   * @param x - X position to query
   * @param y - Y position to query
   * @returns The nearest spawn if within radius, null otherwise
   */
  getSpawnAt(x: number, y: number): PokemonSpawn | null {
    let nearestSpawn: PokemonSpawn | null = null;
    let nearestDistance: number = SPAWN_CONFIG.SPAWN_QUERY_RADIUS;

    for (const spawn of this.activeSpawns) {
      const distance = this.calculateDistance(x, y, spawn.x, spawn.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestSpawn = spawn;
      }
    }

    return nearestSpawn;
  }

  /**
   * Get all currently active spawns.
   * Returns a copy to prevent external mutation.
   *
   * @returns Array of all active spawns
   */
  getAllSpawns(): PokemonSpawn[] {
    // Return shallow copy to prevent external mutation of array
    return [...this.activeSpawns];
  }

  /**
   * Get the number of active spawns.
   *
   * @returns Number of active spawns (0-3)
   */
  getActiveSpawnCount(): number {
    return this.activeSpawns.length;
  }

  /**
   * Check if the player is within catch range of a Pokemon.
   * Used to enable/disable throw interaction.
   *
   * @param playerX - Player's X position
   * @param playerY - Player's Y position
   * @param pokemonX - Pokemon's X position
   * @param pokemonY - Pokemon's Y position
   * @returns True if player can attempt a catch
   */
  isPlayerInCatchRange(playerX: number, playerY: number, pokemonX: number, pokemonY: number): boolean {
    const distance = this.calculateDistance(playerX, playerY, pokemonX, pokemonY);
    return distance <= SPAWN_CONFIG.CATCH_RANGE_PIXELS;
  }

  /**
   * Check if player is in range of any active Pokemon.
   * Returns the nearest Pokemon in range, or null if none.
   *
   * @param playerX - Player's X position
   * @param playerY - Player's Y position
   * @returns Nearest Pokemon in catch range, or null
   */
  getPokemonInCatchRange(playerX: number, playerY: number): PokemonSpawn | null {
    let nearestInRange: PokemonSpawn | null = null;
    let nearestDistance: number = SPAWN_CONFIG.CATCH_RANGE_PIXELS;

    for (const spawn of this.activeSpawns) {
      const distance = this.calculateDistance(playerX, playerY, spawn.x, spawn.y);
      if (distance <= SPAWN_CONFIG.CATCH_RANGE_PIXELS && distance < nearestDistance) {
        nearestDistance = distance;
        nearestInRange = spawn;
      }
    }

    return nearestInRange;
  }

  /**
   * Check if we can add more spawns.
   *
   * @returns True if under max capacity
   */
  canAddSpawn(): boolean {
    return this.activeSpawns.length < SPAWN_CONFIG.MAX_ACTIVE_SPAWNS;
  }

  /**
   * Get remaining attempts for a Pokemon.
   *
   * @param pokemonId - ID of the Pokemon
   * @returns Remaining attempts (0-3), or -1 if not found
   */
  getRemainingAttempts(pokemonId: bigint): number {
    const spawn = this.getSpawnById(pokemonId);
    if (!spawn) return -1;
    return SPAWN_CONFIG.MAX_ATTEMPTS - spawn.attemptCount;
  }

  // ============================================================
  // VISUAL ENTITY MANAGEMENT
  // Creating, destroying, and animating Pokemon sprites
  // ============================================================

  /**
   * Create a visual Pokemon entity for a spawn.
   *
   * @param spawn - Spawn data to create entity for
   * @returns The created Pokemon entity
   */
  private createPokemonEntity(spawn: PokemonSpawn): Pokemon {
    const entity = new Pokemon(
      this.scene,
      spawn.x,
      spawn.y,
      spawn.id
    );

    console.log('[PokemonSpawnManager] Created Pokemon entity for:', spawn.id.toString());
    return entity;
  }

  /**
   * Destroy a Pokemon's visual entity.
   * Plays despawn animation before destruction.
   *
   * @param spawn - Spawn with entity to destroy
   */
  private destroyPokemonEntity(spawn: PokemonSpawn): void {
    if (!spawn.entity) return;

    try {
      // Try to play despawn animation if available
      if (typeof spawn.entity.playDespawnAnimation === 'function') {
        spawn.entity.playDespawnAnimation();
        // Entity will destroy itself after animation
      } else {
        // Immediate destroy if no animation method
        spawn.entity.destroy();
      }

      spawn.entity = undefined;
      console.log('[PokemonSpawnManager] Destroyed Pokemon entity for:', spawn.id.toString());
    } catch (error) {
      console.warn('[PokemonSpawnManager] Error destroying entity:', error);
      spawn.entity = undefined;
    }
  }

  /**
   * Animate a Pokemon entity moving to a new position (relocation).
   * Uses Phaser tweens for smooth movement.
   *
   * @param spawn - Spawn with entity to animate
   * @param newX - Target X position
   * @param newY - Target Y position
   */
  private animateEntityRelocation(spawn: PokemonSpawn, newX: number, newY: number): void {
    if (!spawn.entity) return;

    try {
      // If entity has its own relocation method, use it
      if (typeof spawn.entity.playRelocationAnimation === 'function') {
        spawn.entity.playRelocationAnimation(newX, newY);
        return;
      }

      // Fallback: Simple tween animation
      // First fade out at current position
      this.scene.tweens.add({
        targets: spawn.entity,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (spawn.entity) {
            // Teleport to new position
            spawn.entity.setPosition(newX, newY);

            // Fade back in
            this.scene.tweens.add({
              targets: spawn.entity,
              alpha: 1,
              scale: 1,
              duration: 300,
              ease: 'Back.easeOut',
            });
          }
        },
      });
    } catch (error) {
      // Fallback: Immediate position update
      console.warn('[PokemonSpawnManager] Animation error, using immediate position update');
      if (spawn.entity) {
        spawn.entity.setPosition(newX, newY);
      }
    }
  }

  // ============================================================
  // VISUAL EFFECTS
  // Spawn effects, particles, etc.
  // ============================================================

  /**
   * Play visual effects when a Pokemon spawns.
   * Currently a stub - will integrate with GrassRustle manager.
   *
   * @param spawn - The spawn to play effects for
   */
  private playSpawnEffects(spawn: PokemonSpawn): void {
    // Stub: Will be implemented to trigger grass rustle animation
    // and spawn particle effects via GrassRustleManager
    console.log('[PokemonSpawnManager] Playing spawn effects at:', spawn.x, spawn.y);

    // Emit event for external systems (e.g., GrassRustleManager) to react
    this.scene.events.emit('pokemon-spawn-effects', {
      x: spawn.x,
      y: spawn.y,
      pokemonId: spawn.id,
    });

    // If entity exists and has spawn animation, play it
    if (spawn.entity && typeof spawn.entity.playSpawnAnimation === 'function') {
      spawn.entity.playSpawnAnimation();
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Calculate Euclidean distance between two points.
   *
   * @param x1 - First point X
   * @param y1 - First point Y
   * @param x2 - Second point X
   * @param y2 - Second point Y
   * @returns Distance in pixels
   */
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clear all spawns (used for cleanup or re-sync).
   */
  private clearAllSpawns(): void {
    // Destroy all entities
    for (const spawn of this.activeSpawns) {
      if (spawn.entity) {
        try {
          spawn.entity.destroy();
        } catch (error) {
          console.warn('[PokemonSpawnManager] Error destroying entity during clear:', error);
        }
        spawn.entity = undefined;
      }
    }

    // Clear array
    this.activeSpawns = [];

    console.log('[PokemonSpawnManager] Cleared all spawns');
  }

  /**
   * Update loop - called from GameScene.update().
   * Updates visual entities and checks for state changes.
   *
   * @param delta - Time since last frame in ms
   */
  update(delta: number): void {
    // Update each Pokemon entity if it has an update method
    for (const spawn of this.activeSpawns) {
      if (spawn.entity && typeof spawn.entity.update === 'function') {
        spawn.entity.update(delta);
      }
    }
  }

  /**
   * Cleanup when scene is destroyed.
   * Call from GameScene.shutdown().
   */
  destroy(): void {
    this.clearAllSpawns();
    this.isInitialized = false;
    console.log('[PokemonSpawnManager] Destroyed');
  }

  // ============================================================
  // DEBUG METHODS
  // For development and testing
  // ============================================================

  /**
   * Log current state for debugging.
   */
  debugLogState(): void {
    console.log('[PokemonSpawnManager] Debug State:');
    console.log('  - Initialized:', this.isInitialized);
    console.log('  - Active spawns:', this.activeSpawns.length);
    for (const spawn of this.activeSpawns) {
      console.log(`    - ID: ${spawn.id.toString()}, Pos: (${spawn.x}, ${spawn.y}), Attempts: ${spawn.attemptCount}, HasEntity: ${!!spawn.entity}`);
    }
  }
}

// Export configuration for external use
export { SPAWN_CONFIG };
