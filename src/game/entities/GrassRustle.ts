/**
 * GrassRustle Entity
 *
 * Visual effect showing grass movement beneath a wild Pokemon.
 * Creates the classic "rustling grass" effect from Pokemon games.
 *
 * Responsibilities:
 * - Render animated grass rustle sprite
 * - Follow a target Pokemon entity
 * - Play looping rustle animation
 * - Clean up when Pokemon is caught/removed
 *
 * Texture/Animation Requirements:
 * - 'grass-rustle': Sprite sheet with 4 frames (16x16 each)
 * - Animation 'grass-rustle-anim': Created in GameScene.create()
 *
 * Example animation setup in GameScene.create():
 * ```typescript
 * this.anims.create({
 *   key: 'grass-rustle-anim',
 *   frames: this.anims.generateFrameNumbers('grass-rustle', { start: 0, end: 3 }),
 *   frameRate: 8,
 *   repeat: -1,
 * });
 * ```
 *
 * Usage:
 * ```typescript
 * // Created by PokemonSpawnManager when Pokemon spawns:
 * const pokemon = new Pokemon(scene, x, y, pokemonId);
 * const rustle = new GrassRustle(scene, pokemon);
 * rustle.playRustle();
 *
 * // When Pokemon caught or removed:
 * rustle.stopRustle();
 * rustle.destroy();
 * ```
 */

import type { GameScene } from '../scenes/GameScene';
import type { Pokemon } from './Pokemon';

// ============================================================
// CONFIGURATION
// ============================================================

const GRASS_RUSTLE_CONFIG = {
  /** Depth layer (below Pokemon) */
  DEPTH: 8,
  /** Y offset from Pokemon position */
  Y_OFFSET: 8,
  /** Animation frame rate */
  FRAME_RATE: 8,
  /** Fade in duration when starting */
  FADE_IN_DURATION: 200,
  /** Fade out duration when stopping */
  FADE_OUT_DURATION: 150,
  /** Scale of the rustle effect */
  SCALE: 1.2,
  /** Alpha when fully visible */
  VISIBLE_ALPHA: 0.8,
} as const;

// ============================================================
// GRASS RUSTLE CLASS
// ============================================================

export class GrassRustle extends Phaser.GameObjects.Sprite {
  /** Pokemon ID this rustle is associated with */
  public readonly pokemonId: bigint;

  /** Reference to the Pokemon entity being followed */
  public followTarget: Pokemon | null;

  /** Reference to the scene (typed) */
  private gameScene: GameScene;

  /** Whether the rustle animation is currently playing */
  private isPlaying: boolean = false;

  /** Whether the entity is being destroyed */
  private isDestroying: boolean = false;

  /** Scene update event listener reference */
  private updateListener?: () => void;

  constructor(scene: GameScene, pokemon: Pokemon) {
    // Use grass-rustle texture, fallback to placeholder if not available
    super(
      scene,
      pokemon.x,
      pokemon.y + GRASS_RUSTLE_CONFIG.Y_OFFSET,
      'grass-rustle'
    );

    this.pokemonId = pokemon.id;
    this.followTarget = pokemon;
    this.gameScene = scene;

    // Add to scene
    scene.add.existing(this);

    // Set depth below Pokemon
    this.setDepth(GRASS_RUSTLE_CONFIG.DEPTH);

    // Set scale
    this.setScale(GRASS_RUSTLE_CONFIG.SCALE);

    // Start invisible
    this.setAlpha(0);
    this.setVisible(false);

    // Set up update listener to follow Pokemon
    this.setupUpdateListener();

    console.log('[GrassRustle] Created for Pokemon:', pokemon.id.toString());
  }

  // ============================================================
  // UPDATE LISTENER
  // ============================================================

  /**
   * Set up scene update listener to follow the Pokemon.
   */
  private setupUpdateListener(): void {
    this.updateListener = () => {
      if (!this.isDestroying && this.followTarget && this.followTarget.active) {
        this.updatePosition();
      }
    };

    // Listen to scene update event
    this.gameScene.events.on('update', this.updateListener);
  }

  /**
   * Remove the update listener.
   */
  private removeUpdateListener(): void {
    if (this.updateListener) {
      this.gameScene.events.off('update', this.updateListener);
      this.updateListener = undefined;
    }
  }

  /**
   * Update position to follow the Pokemon.
   */
  private updatePosition(): void {
    if (this.followTarget) {
      this.setPosition(
        this.followTarget.x,
        this.followTarget.y + GRASS_RUSTLE_CONFIG.Y_OFFSET
      );
    }
  }

  // ============================================================
  // ANIMATION CONTROL
  // ============================================================

  /**
   * Start the grass rustle animation.
   * Fades in and starts looping animation.
   */
  playRustle(): void {
    if (this.isPlaying || this.isDestroying) return;

    this.isPlaying = true;
    this.setVisible(true);

    // Check if animation exists, create simple fallback if not
    if (this.gameScene.anims.exists('grass-rustle-anim')) {
      this.anims.play('grass-rustle-anim');
    } else {
      // Fallback: create a simple scale pulsing effect
      this.createFallbackAnimation();
    }

    // Fade in
    this.gameScene.tweens.add({
      targets: this,
      alpha: GRASS_RUSTLE_CONFIG.VISIBLE_ALPHA,
      duration: GRASS_RUSTLE_CONFIG.FADE_IN_DURATION,
      ease: 'Quad.easeOut',
    });

    console.log('[GrassRustle] Started animation for Pokemon:', this.pokemonId.toString());
  }

  /**
   * Create a fallback pulsing animation if sprite animation isn't available.
   */
  private createFallbackAnimation(): void {
    // Simple scale pulse as fallback
    this.gameScene.tweens.add({
      targets: this,
      scaleX: { from: GRASS_RUSTLE_CONFIG.SCALE * 0.9, to: GRASS_RUSTLE_CONFIG.SCALE * 1.1 },
      scaleY: { from: GRASS_RUSTLE_CONFIG.SCALE * 1.1, to: GRASS_RUSTLE_CONFIG.SCALE * 0.9 },
      duration: 150,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Stop the grass rustle animation.
   * Fades out and stops the animation.
   *
   * @param immediate - If true, stops immediately without fade
   */
  stopRustle(immediate: boolean = false): void {
    if (!this.isPlaying || this.isDestroying) return;

    this.isPlaying = false;

    if (immediate) {
      this.setAlpha(0);
      this.setVisible(false);
      this.anims.stop();
      this.gameScene.tweens.killTweensOf(this);
    } else {
      // Fade out then hide
      this.gameScene.tweens.add({
        targets: this,
        alpha: 0,
        duration: GRASS_RUSTLE_CONFIG.FADE_OUT_DURATION,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (!this.isDestroying) {
            this.setVisible(false);
            this.anims.stop();
            this.gameScene.tweens.killTweensOf(this);
          }
        },
      });
    }

    console.log('[GrassRustle] Stopped animation for Pokemon:', this.pokemonId.toString());
  }

  /**
   * Pause the animation temporarily.
   */
  pause(): void {
    if (this.anims.isPlaying) {
      this.anims.pause();
    }
  }

  /**
   * Resume a paused animation.
   */
  resume(): void {
    if (this.anims.isPaused) {
      this.anims.resume();
    }
  }

  // ============================================================
  // TARGET MANAGEMENT
  // ============================================================

  /**
   * Set a new Pokemon to follow.
   *
   * @param pokemon - New Pokemon target, or null to clear
   */
  setFollowTarget(pokemon: Pokemon | null): void {
    this.followTarget = pokemon;

    if (pokemon) {
      this.updatePosition();
    }
  }

  /**
   * Check if the rustle is currently following a valid target.
   */
  hasValidTarget(): boolean {
    return this.followTarget !== null && this.followTarget.active;
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  /**
   * Cleanup when destroyed.
   * Removes event listeners and stops animations.
   */
  destroy(fromScene?: boolean): void {
    this.isDestroying = true;

    // Remove update listener
    this.removeUpdateListener();

    // Stop any animations
    this.anims.stop();

    // Kill any tweens
    this.gameScene.tweens.killTweensOf(this);

    // Clear target reference
    this.followTarget = null;

    console.log('[GrassRustle] Destroyed for Pokemon:', this.pokemonId.toString());
    super.destroy(fromScene);
  }
}

// Export config for external use
export { GRASS_RUSTLE_CONFIG };
