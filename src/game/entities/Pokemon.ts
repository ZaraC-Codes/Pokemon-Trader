import type { GameScene } from '../scenes/GameScene';

/**
 * Pokemon Entity (Stub)
 *
 * Visual representation of a wild Pokemon in the game world.
 * This is a placeholder that will be fully implemented in a future task.
 *
 * Responsibilities:
 * - Render Pokemon sprite with idle animation
 * - Play spawn/despawn/relocation animations
 * - Handle click interactions for throw targeting
 * - Display attempt counter indicator
 */
export class Pokemon extends Phaser.GameObjects.Sprite {
  /** Unique Pokemon ID from the contract */
  public readonly pokemonId: bigint;

  constructor(scene: GameScene, x: number, y: number, pokemonId: bigint) {
    // Use placeholder texture - will be replaced with actual Pokemon sprites
    super(scene, x, y, 'pokemon-placeholder');

    this.pokemonId = pokemonId;

    // Add to scene
    scene.add.existing(this);

    // Set depth to render above ground but below UI
    this.setDepth(10);

    // Make interactive for click targeting
    this.setInteractive({ useHandCursor: true });

    console.log('[Pokemon] Created entity for:', pokemonId.toString(), 'at', x, y);
  }

  /**
   * Play spawn animation (fade in with bounce).
   * Called when Pokemon first appears.
   */
  playSpawnAnimation(): void {
    // Start invisible and small
    this.setAlpha(0);
    this.setScale(0.5);

    // Animate in
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Play despawn animation (fade out).
   * Called when Pokemon is caught or leaves.
   */
  playDespawnAnimation(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Play relocation animation (teleport effect).
   * Called when Pokemon moves to new position.
   *
   * @param newX - Target X position
   * @param newY - Target Y position
   */
  playRelocationAnimation(newX: number, newY: number): void {
    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Move to new position
        this.setPosition(newX, newY);

        // Fade in at new location
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          scale: 1,
          duration: 300,
          ease: 'Back.easeOut',
        });
      },
    });
  }

  /**
   * Update loop - called each frame.
   * Currently a stub - will add idle bobbing animation in full implementation.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(delta: number): void {
    // Placeholder: Will add idle bobbing animation, etc.
  }

  /**
   * Cleanup when destroyed.
   */
  destroy(fromScene?: boolean): void {
    console.log('[Pokemon] Destroyed entity:', this.pokemonId.toString());
    super.destroy(fromScene);
  }
}
