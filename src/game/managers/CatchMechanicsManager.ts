/**
 * CatchMechanicsManager
 *
 * Manages the Pokemon catching flow in the Phaser game layer.
 * Coordinates between PokemonSpawnManager, BallInventoryManager, and the React/Web3 layer.
 *
 * Responsibilities:
 * - Track catch state machine (idle → throwing → awaiting_result → success/failure)
 * - Handle player interactions with Pokemon sprites
 * - Play throw/catch animations using Phaser tweens
 * - Provide hooks for React/Web3 integration (ball selection, contract calls)
 *
 * Integration Flow:
 * ```
 * 1. Player clicks Pokemon sprite
 *    → onPokemonClicked(pokemonId)
 *    → Check range, check state
 *    → Call ballSelectionHandler (React shows ball picker modal)
 *
 * 2. Player selects ball in UI
 *    → ballSelectionHandler returns ballType
 *    → initiateThrow(pokemonId, ballType)
 *    → Decrement inventory, play throw animation
 *    → Call contractThrowHandler (React sends transaction)
 *
 * 3. Contract result arrives (via POP VRNG callback)
 *    → React calls handleCatchResult(caught, pokemonId)
 *    → Play success/failure animation
 *    → Update spawn manager
 *    → Reset to idle
 * ```
 */

import type { GameScene } from '../scenes/GameScene';
import type { PokemonSpawnManager } from './PokemonSpawnManager';
import {
  getBallInventoryManager,
  type BallInventoryManager,
  type BallType,
} from './BallInventoryManager';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * State machine for catch flow.
 */
export type CatchState = 'idle' | 'throwing' | 'awaiting_result' | 'success' | 'failure';

/**
 * Callback for UI to select which ball to throw.
 * Returns the selected ball type, or null if cancelled.
 */
export type BallSelectionHandler = (pokemonId: bigint) => Promise<BallType | null>;

/**
 * Callback for React/Web3 layer to send the throw transaction.
 * Called after local validation passes and animation starts.
 */
export type ContractThrowHandler = (pokemonId: bigint, ballType: BallType) => Promise<void>;

/**
 * Callback for notifying UI of state changes.
 */
export type StateChangeHandler = (state: CatchState, pokemonId?: bigint) => void;

/**
 * Callback for error notifications.
 */
export type ErrorHandler = (error: string, pokemonId?: bigint) => void;

/**
 * Configuration for catch mechanics.
 */
const CATCH_CONFIG = {
  /** Duration of throw animation in ms */
  THROW_ANIMATION_DURATION: 500,
  /** Duration of ball wobble animation in ms */
  WOBBLE_DURATION: 300,
  /** Number of wobbles before result */
  WOBBLE_COUNT: 3,
  /** Duration of success celebration in ms */
  SUCCESS_ANIMATION_DURATION: 800,
  /** Duration of failure shake in ms */
  FAILURE_ANIMATION_DURATION: 400,
  /** Duration of relocation animation in ms */
  RELOCATE_ANIMATION_DURATION: 600,
  /** Delay before resetting to idle after result */
  RESULT_RESET_DELAY: 1500,
  /** Ball colors for animations */
  BALL_COLORS: {
    0: 0xff4444, // Poke Ball - Red
    1: 0x4488ff, // Great Ball - Blue
    2: 0xffcc00, // Ultra Ball - Yellow
    3: 0xaa44ff, // Master Ball - Purple
  } as Record<BallType, number>,
} as const;

// ============================================================
// MANAGER CLASS
// ============================================================

/**
 * CatchMechanicsManager
 *
 * Manages the Pokemon catching flow, animations, and state machine.
 * All Web3 interactions are abstracted through handler callbacks.
 */
export class CatchMechanicsManager {
  // Dependencies
  private scene: GameScene;
  private spawnManager: PokemonSpawnManager;
  private inventoryManager: BallInventoryManager;

  // State
  private currentState: CatchState = 'idle';
  private currentPokemonId?: bigint;
  private currentBallType?: BallType;
  private lastResultTimestamp?: number;

  // Player position (updated externally)
  private playerX: number = 0;
  private playerY: number = 0;

  // Handler callbacks (set by React/UI layer)
  private ballSelectionHandler?: BallSelectionHandler;
  private contractThrowHandler?: ContractThrowHandler;
  private stateChangeHandler?: StateChangeHandler;
  private errorHandler?: ErrorHandler;

  // Animation objects (for cleanup)
  private throwBallSprite?: Phaser.GameObjects.Arc;
  private effectsContainer?: Phaser.GameObjects.Container;

  constructor(scene: GameScene, spawnManager: PokemonSpawnManager) {
    this.scene = scene;
    this.spawnManager = spawnManager;
    this.inventoryManager = getBallInventoryManager();

    console.log('[CatchMechanicsManager] Initialized');
  }

  // ============================================================
  // PUBLIC GETTERS
  // ============================================================

  /**
   * Get current catch state.
   */
  get state(): CatchState {
    return this.currentState;
  }

  /**
   * Check if manager is busy (not idle).
   */
  get isBusy(): boolean {
    return this.currentState !== 'idle';
  }

  /**
   * Get the Pokemon currently being targeted.
   */
  get targetPokemonId(): bigint | undefined {
    return this.currentPokemonId;
  }

  /**
   * Get the ball type currently being thrown.
   */
  get activeBallType(): BallType | undefined {
    return this.currentBallType;
  }

  // ============================================================
  // CONFIGURATION METHODS
  // ============================================================

  /**
   * Set the player's current position.
   * Called by GameScene when player moves.
   *
   * @param x - Player X position in pixels
   * @param y - Player Y position in pixels
   */
  setPlayerPosition(x: number, y: number): void {
    this.playerX = x;
    this.playerY = y;
  }

  /**
   * Set the ball selection handler.
   * Called when player needs to choose which ball to throw.
   *
   * @param handler - Async function that returns selected ball type or null
   */
  setBallSelectionHandler(handler: BallSelectionHandler): void {
    this.ballSelectionHandler = handler;
    console.log('[CatchMechanicsManager] Ball selection handler set');
  }

  /**
   * Set the contract throw handler.
   * Called to send the throw transaction to the blockchain.
   *
   * @param handler - Async function that sends the transaction
   */
  setContractThrowHandler(handler: ContractThrowHandler): void {
    this.contractThrowHandler = handler;
    console.log('[CatchMechanicsManager] Contract throw handler set');
  }

  /**
   * Set the state change handler.
   * Called whenever the catch state changes.
   *
   * @param handler - Function called with new state
   */
  setStateChangeHandler(handler: StateChangeHandler): void {
    this.stateChangeHandler = handler;
  }

  /**
   * Set the error handler.
   * Called when an error occurs during catch flow.
   *
   * @param handler - Function called with error message
   */
  setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  /**
   * Transition to a new state.
   * Notifies listeners of the change.
   *
   * @param newState - State to transition to
   */
  private setState(newState: CatchState): void {
    const oldState = this.currentState;
    this.currentState = newState;

    console.log(`[CatchMechanicsManager] State: ${oldState} → ${newState}`);

    // Emit Phaser event
    this.scene.events.emit('catch-state-changed', {
      oldState,
      newState,
      pokemonId: this.currentPokemonId,
      ballType: this.currentBallType,
    });

    // Call handler if set
    if (this.stateChangeHandler) {
      this.stateChangeHandler(newState, this.currentPokemonId);
    }
  }

  /**
   * Reset to idle state and clear current target.
   */
  private resetToIdle(): void {
    this.currentPokemonId = undefined;
    this.currentBallType = undefined;
    this.setState('idle');
  }

  /**
   * Handle an error during catch flow.
   *
   * @param message - Error message
   */
  private handleError(message: string): void {
    console.error(`[CatchMechanicsManager] Error: ${message}`);

    // Emit Phaser event
    this.scene.events.emit('catch-error', {
      message,
      pokemonId: this.currentPokemonId,
    });

    // Call handler if set
    if (this.errorHandler) {
      this.errorHandler(message, this.currentPokemonId);
    }

    // Reset state
    this.resetToIdle();
  }

  // ============================================================
  // CATCH FLOW METHODS
  // ============================================================

  /**
   * Handle player clicking on a Pokemon sprite.
   * Initiates the ball selection flow if conditions are met.
   *
   * @param pokemonId - ID of the clicked Pokemon
   */
  async onPokemonClicked(pokemonId: bigint): Promise<void> {
    console.log('[CatchMechanicsManager] onPokemonClicked:', pokemonId.toString());

    // Check state
    if (this.currentState !== 'idle') {
      console.log('[CatchMechanicsManager] Ignoring click: not idle (state:', this.currentState, ')');
      return;
    }

    // Get spawn data
    const spawn = this.spawnManager.getSpawnById(pokemonId);
    if (!spawn) {
      console.warn('[CatchMechanicsManager] Pokemon not found:', pokemonId.toString());
      return;
    }

    // Check if player is in range
    const inRange = this.spawnManager.isPlayerInCatchRange(
      this.playerX,
      this.playerY,
      spawn.x,
      spawn.y
    );

    if (!inRange) {
      console.log('[CatchMechanicsManager] Player not in range of Pokemon', pokemonId.toString());
      const distance = this.calculateDistance(this.playerX, this.playerY, spawn.x, spawn.y);
      this.scene.events.emit('catch-out-of-range', {
        pokemonId,
        spawn,
        playerX: this.playerX,
        playerY: this.playerY,
        distance,
        requiredRange: this.getCatchRange(),
      });
      return;
    }

    // Player is in range - emit event for React to open the modal
    console.log('[CatchMechanicsManager] Player in range, emitting pokemon-catch-ready');
    this.scene.events.emit('pokemon-catch-ready', {
      pokemonId: spawn.id,
      slotIndex: spawn.slotIndex,
      attemptCount: spawn.attemptCount,
      x: spawn.x,
      y: spawn.y,
    });

    // Check if player has any balls
    if (!this.inventoryManager.hasAnyBalls()) {
      console.log('[CatchMechanicsManager] No balls available');
      this.handleError('No PokeBalls available! Visit the shop to buy more.');
      return;
    }

    // Request ball selection from UI
    if (!this.ballSelectionHandler) {
      console.warn('[CatchMechanicsManager] No ball selection handler set');
      // Auto-select best available ball as fallback
      const bestBall = this.inventoryManager.getBestAvailableBall();
      if (bestBall !== null) {
        await this.initiateThrow(pokemonId, bestBall);
      }
      return;
    }

    // Call handler and wait for user selection
    try {
      const selectedBall = await this.ballSelectionHandler(pokemonId);

      if (selectedBall === null) {
        console.log('[CatchMechanicsManager] Ball selection cancelled');
        return;
      }

      await this.initiateThrow(pokemonId, selectedBall);
    } catch (error) {
      console.error('[CatchMechanicsManager] Ball selection error:', error);
      this.handleError('Failed to select ball');
    }
  }

  /**
   * Calculate distance between two points.
   * @internal
   */
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Phaser.Math.Distance.Between(x1, y1, x2, y2);
  }

  /**
   * Get the current catch range in pixels.
   * Exposes the SPAWN_CONFIG.CATCH_RANGE_PIXELS value for external use.
   */
  getCatchRange(): number {
    return this.spawnManager.getCatchRange();
  }

  /**
   * Initiate a throw at a Pokemon.
   * Validates inventory, plays animation, and triggers contract call.
   *
   * @param pokemonId - ID of the target Pokemon
   * @param ballType - Type of ball to throw (0-3)
   */
  async initiateThrow(pokemonId: bigint, ballType: BallType): Promise<void> {
    console.log('[CatchMechanicsManager] initiateThrow:', pokemonId.toString(), 'ball:', ballType);

    // Check state
    if (this.currentState !== 'idle') {
      console.warn('[CatchMechanicsManager] Cannot throw: not idle');
      return;
    }

    // Get spawn
    const spawn = this.spawnManager.getSpawnById(pokemonId);
    if (!spawn) {
      this.handleError('Pokemon no longer available');
      return;
    }

    // Check inventory
    if (!this.inventoryManager.hasBall(ballType)) {
      const ballName = this.inventoryManager.getBallName(ballType);
      this.handleError(`No ${ballName}s available!`);
      return;
    }

    // Decrement ball locally (optimistic update)
    // Note: If transaction fails, we should restore this
    const decremented = this.inventoryManager.decrementBall(ballType);
    if (!decremented) {
      this.handleError('Failed to use ball');
      return;
    }

    // Update state
    this.currentPokemonId = pokemonId;
    this.currentBallType = ballType;
    this.setState('throwing');

    // Play throw animation
    try {
      await this.playThrowAnimation(ballType, spawn.x, spawn.y);
    } catch (error) {
      console.error('[CatchMechanicsManager] Throw animation error:', error);
      // Continue anyway - animation is not critical
    }

    // Transition to awaiting result
    this.setState('awaiting_result');

    // Call contract handler if set
    if (this.contractThrowHandler) {
      try {
        await this.contractThrowHandler(pokemonId, ballType);
        console.log('[CatchMechanicsManager] Contract throw submitted');
      } catch (error) {
        console.error('[CatchMechanicsManager] Contract throw failed:', error);
        // Note: We stay in awaiting_result - the result may still come back
        // If we need to handle tx failure, we'd restore the ball here
        this.scene.events.emit('catch-transaction-failed', {
          pokemonId,
          ballType,
          error,
        });
      }
    } else {
      console.warn('[CatchMechanicsManager] No contract throw handler set');
    }
  }

  /**
   * Handle the catch result from the blockchain.
   * Called when POP VRNG callback determines success/failure.
   *
   * @param caught - Whether the Pokemon was caught
   * @param pokemonId - ID of the Pokemon
   */
  async handleCatchResult(caught: boolean, pokemonId: bigint): Promise<void> {
    console.log('[CatchMechanicsManager] handleCatchResult:', caught, pokemonId.toString());

    // Validate we're expecting this result
    if (this.currentState !== 'awaiting_result') {
      console.warn('[CatchMechanicsManager] Unexpected result: state is', this.currentState);
      return;
    }

    if (this.currentPokemonId !== pokemonId) {
      console.warn('[CatchMechanicsManager] Result for different Pokemon');
      return;
    }

    // Get spawn for animation position
    const spawn = this.spawnManager.getSpawnById(pokemonId);
    const animX = spawn?.x ?? this.playerX;
    const animY = spawn?.y ?? this.playerY;

    this.lastResultTimestamp = Date.now();

    if (caught) {
      // Success!
      this.setState('success');

      try {
        await this.playSuccessAnimation(animX, animY);
      } catch (error) {
        console.error('[CatchMechanicsManager] Success animation error:', error);
      }

      // Remove spawn (handled by PokemonSpawnManager via contract event)
      // We don't call spawnManager.removeSpawn here - that should come from
      // the contract event handler to keep state in sync

      // Emit success event
      this.scene.events.emit('catch-success', {
        pokemonId,
        ballType: this.currentBallType,
      });
    } else {
      // Failure
      this.setState('failure');

      try {
        await this.playFailAnimation(animX, animY);
      } catch (error) {
        console.error('[CatchMechanicsManager] Fail animation error:', error);
      }

      // Emit failure event
      this.scene.events.emit('catch-failure', {
        pokemonId,
        ballType: this.currentBallType,
        attemptsRemaining: spawn ? 3 - spawn.attemptCount - 1 : 0,
      });
    }

    // Reset to idle after delay
    this.scene.time.delayedCall(CATCH_CONFIG.RESULT_RESET_DELAY, () => {
      if (this.currentPokemonId === pokemonId) {
        this.resetToIdle();
      }
    });
  }

  /**
   * Handle Pokemon relocation event.
   * Plays relocation animation.
   *
   * @param pokemonId - ID of the relocating Pokemon
   * @param fromX - Starting X position
   * @param fromY - Starting Y position
   * @param toX - Ending X position
   * @param toY - Ending Y position
   */
  async onPokemonRelocated(
    pokemonId: bigint,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): Promise<void> {
    console.log('[CatchMechanicsManager] onPokemonRelocated:', pokemonId.toString());

    // If we were targeting this Pokemon, cancel
    if (this.currentPokemonId === pokemonId && this.currentState === 'awaiting_result') {
      console.log('[CatchMechanicsManager] Target Pokemon relocated during catch');
      // Don't reset state - let the actual result handle it
    }

    // Play relocation animation
    try {
      await this.playRelocateAnimation(fromX, fromY, toX, toY);
    } catch (error) {
      console.error('[CatchMechanicsManager] Relocate animation error:', error);
    }

    // Emit event
    this.scene.events.emit('pokemon-relocate-animated', {
      pokemonId,
      fromX,
      fromY,
      toX,
      toY,
    });
  }

  // ============================================================
  // ANIMATION METHODS
  // ============================================================

  /**
   * Play the ball throw animation.
   * Creates a ball sprite that arcs toward the target Pokemon.
   *
   * @param ballType - Type of ball being thrown
   * @param targetX - Target X position
   * @param targetY - Target Y position
   */
  async playThrowAnimation(ballType: BallType, targetX: number, targetY: number): Promise<void> {
    return new Promise((resolve) => {
      // Clean up any existing throw sprite
      this.cleanupThrowSprite();

      // Create ball sprite at player position
      const ballColor = CATCH_CONFIG.BALL_COLORS[ballType];
      this.throwBallSprite = this.scene.add.circle(
        this.playerX,
        this.playerY - 8, // Slightly above player
        6,
        ballColor
      );
      this.throwBallSprite.setDepth(100);
      this.throwBallSprite.setStrokeStyle(2, 0xffffff);

      // Calculate arc control point (above midpoint)
      const midX = (this.playerX + targetX) / 2;
      const midY = Math.min(this.playerY, targetY) - 40; // Arc height

      // Animate along arc using timeline
      const duration = CATCH_CONFIG.THROW_ANIMATION_DURATION;

      // Use a simple tween with custom update for arc
      let elapsed = 0;
      const startX = this.playerX;
      const startY = this.playerY - 8;

      const updateArc = () => {
        if (!this.throwBallSprite) return;

        elapsed += 16; // Approximate frame time
        const t = Math.min(elapsed / duration, 1);

        // Quadratic bezier curve
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * targetX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * targetY;

        this.throwBallSprite.setPosition(x, y);

        // Rotate ball
        this.throwBallSprite.rotation += 0.2;

        if (t >= 1) {
          // Animation complete
          this.cleanupThrowSprite();
          resolve();
        }
      };

      // Use timer for smooth animation
      this.scene.time.addEvent({
        delay: 16,
        callback: updateArc,
        repeat: Math.ceil(duration / 16),
      });
    });
  }

  /**
   * Play success animation (catch celebration).
   * Shows sparkles and celebration effects.
   *
   * @param pokemonX - Pokemon X position
   * @param pokemonY - Pokemon Y position
   */
  async playSuccessAnimation(pokemonX: number, pokemonY: number): Promise<void> {
    return new Promise((resolve) => {
      // Create effects container
      this.effectsContainer = this.scene.add.container(pokemonX, pokemonY);
      this.effectsContainer.setDepth(150);

      // Create sparkle particles
      const sparkleCount = 8;
      const sparkles: Phaser.GameObjects.Arc[] = [];

      for (let i = 0; i < sparkleCount; i++) {
        const angle = (i / sparkleCount) * Math.PI * 2;
        const sparkle = this.scene.add.circle(0, 0, 4, 0xffff00);
        sparkle.setAlpha(0);
        this.effectsContainer.add(sparkle);
        sparkles.push(sparkle);

        // Animate sparkle outward
        this.scene.tweens.add({
          targets: sparkle,
          x: Math.cos(angle) * 40,
          y: Math.sin(angle) * 40,
          alpha: { from: 1, to: 0 },
          scale: { from: 1, to: 0.2 },
          duration: CATCH_CONFIG.SUCCESS_ANIMATION_DURATION,
          ease: 'Quad.easeOut',
        });
      }

      // Create success text
      const successText = this.scene.add.text(0, -30, 'CAUGHT!', {
        fontSize: '16px',
        fontFamily: 'Courier New, monospace',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4,
      });
      successText.setOrigin(0.5);
      this.effectsContainer.add(successText);

      // Animate text
      this.scene.tweens.add({
        targets: successText,
        y: -60,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 1.5 },
        duration: CATCH_CONFIG.SUCCESS_ANIMATION_DURATION,
        ease: 'Quad.easeOut',
      });

      // Cleanup after animation
      this.scene.time.delayedCall(CATCH_CONFIG.SUCCESS_ANIMATION_DURATION, () => {
        this.cleanupEffects();
        resolve();
      });
    });
  }

  /**
   * Play failure animation (ball breaks/Pokemon escapes).
   * Shows shake effect and escape particles.
   *
   * @param pokemonX - Pokemon X position
   * @param pokemonY - Pokemon Y position
   */
  async playFailAnimation(pokemonX: number, pokemonY: number): Promise<void> {
    return new Promise((resolve) => {
      // Create effects container
      this.effectsContainer = this.scene.add.container(pokemonX, pokemonY);
      this.effectsContainer.setDepth(150);

      // Create "escaped" ball fragments
      const fragmentCount = 4;
      for (let i = 0; i < fragmentCount; i++) {
        const angle = (i / fragmentCount) * Math.PI * 2 + Math.PI / 4;
        const fragment = this.scene.add.arc(0, 0, 4, 0, Math.PI, false, 0xff4444);
        fragment.rotation = angle;
        this.effectsContainer.add(fragment);

        // Animate fragment outward
        this.scene.tweens.add({
          targets: fragment,
          x: Math.cos(angle) * 30,
          y: Math.sin(angle) * 30,
          alpha: 0,
          rotation: angle + Math.PI,
          duration: CATCH_CONFIG.FAILURE_ANIMATION_DURATION,
          ease: 'Quad.easeOut',
        });
      }

      // Create fail text
      const failText = this.scene.add.text(0, -30, 'ESCAPED!', {
        fontSize: '14px',
        fontFamily: 'Courier New, monospace',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 3,
      });
      failText.setOrigin(0.5);
      this.effectsContainer.add(failText);

      // Shake the text
      this.scene.tweens.add({
        targets: failText,
        x: { from: -3, to: 3 },
        duration: 50,
        yoyo: true,
        repeat: 4,
      });

      // Fade out text
      this.scene.tweens.add({
        targets: failText,
        alpha: 0,
        y: -50,
        delay: 200,
        duration: 300,
      });

      // Cleanup after animation
      this.scene.time.delayedCall(CATCH_CONFIG.FAILURE_ANIMATION_DURATION + 300, () => {
        this.cleanupEffects();
        resolve();
      });
    });
  }

  /**
   * Play relocation animation (Pokemon teleports).
   * Shows fade out at old position, fade in at new position.
   *
   * @param fromX - Starting X position
   * @param fromY - Starting Y position
   * @param toX - Ending X position
   * @param toY - Ending Y position
   */
  async playRelocateAnimation(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): Promise<void> {
    return new Promise((resolve) => {
      // Create effects at departure point
      const departureEffect = this.scene.add.circle(fromX, fromY, 20, 0x8888ff, 0.5);
      departureEffect.setDepth(100);

      // Shrink and fade departure effect
      this.scene.tweens.add({
        targets: departureEffect,
        scale: 0,
        alpha: 0,
        duration: CATCH_CONFIG.RELOCATE_ANIMATION_DURATION / 2,
        ease: 'Quad.easeIn',
        onComplete: () => {
          departureEffect.destroy();
        },
      });

      // Create effects at arrival point (delayed)
      this.scene.time.delayedCall(CATCH_CONFIG.RELOCATE_ANIMATION_DURATION / 2, () => {
        const arrivalEffect = this.scene.add.circle(toX, toY, 0, 0x8888ff, 0.5);
        arrivalEffect.setDepth(100);

        // Expand and fade arrival effect
        this.scene.tweens.add({
          targets: arrivalEffect,
          scale: { from: 0, to: 1 },
          alpha: { from: 0.8, to: 0 },
          duration: CATCH_CONFIG.RELOCATE_ANIMATION_DURATION / 2,
          ease: 'Quad.easeOut',
          onComplete: () => {
            arrivalEffect.destroy();
            resolve();
          },
        });
      });
    });
  }

  // ============================================================
  // CLEANUP METHODS
  // ============================================================

  /**
   * Clean up throw ball sprite.
   */
  private cleanupThrowSprite(): void {
    if (this.throwBallSprite) {
      this.throwBallSprite.destroy();
      this.throwBallSprite = undefined;
    }
  }

  /**
   * Clean up effects container.
   */
  private cleanupEffects(): void {
    if (this.effectsContainer) {
      this.effectsContainer.destroy(true);
      this.effectsContainer = undefined;
    }
  }

  /**
   * Cancel current catch attempt and reset.
   * Use when player wants to cancel or on timeout.
   */
  cancel(): void {
    console.log('[CatchMechanicsManager] Cancelling catch attempt');

    this.cleanupThrowSprite();
    this.cleanupEffects();

    // If we decremented a ball but didn't complete, we should restore it
    // This is handled by the contract layer - local state will sync on next read

    this.resetToIdle();
  }

  /**
   * Full cleanup when manager is destroyed.
   */
  destroy(): void {
    this.cancel();
    this.ballSelectionHandler = undefined;
    this.contractThrowHandler = undefined;
    this.stateChangeHandler = undefined;
    this.errorHandler = undefined;

    console.log('[CatchMechanicsManager] Destroyed');
  }

  // ============================================================
  // DEBUG METHODS
  // ============================================================

  /**
   * Log current state for debugging.
   */
  debugLogState(): void {
    console.log('[CatchMechanicsManager] Debug State:');
    console.log('  - State:', this.currentState);
    console.log('  - Pokemon ID:', this.currentPokemonId?.toString() ?? 'none');
    console.log('  - Ball Type:', this.currentBallType ?? 'none');
    console.log('  - Player Position:', this.playerX, this.playerY);
    console.log('  - Last Result:', this.lastResultTimestamp ? new Date(this.lastResultTimestamp).toISOString() : 'none');
    console.log('  - Handlers Set:', {
      ballSelection: !!this.ballSelectionHandler,
      contractThrow: !!this.contractThrowHandler,
      stateChange: !!this.stateChangeHandler,
      error: !!this.errorHandler,
    });
  }
}

// Export config for external use
export { CATCH_CONFIG };
