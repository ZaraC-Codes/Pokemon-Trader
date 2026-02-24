/**
 * EasyCatchScene
 *
 * Simplified single-encounter scene for Easy Mode.
 * Shows one Pokemon centered on screen with tap-to-throw and swipe-to-throw input.
 * Uses the same on-chain catch flow (gasless throws / Pyth Entropy) as Adventure Mode.
 *
 * Key differences from GameScene:
 * - No overworld map, no player movement, no NPCs
 * - Fixed camera, single Pokemon at viewport center
 * - Swipe-up gesture support for throwing
 * - Animations implemented inline (no CatchMechanicsManager/PokemonSpawnManager dependency)
 */

import { Scene } from 'phaser';
import { Pokemon } from '../entities/Pokemon';
import { GrassRustle } from '../entities/GrassRustle';
import { Tree } from '../entities/Tree';
import { House } from '../entities/House';
import { MP3Music } from '../utils/mp3Music';
import { getChiptuneSFX, type ChiptuneSFX } from '../utils/chiptuneSFX';
import { TILE_SIZE } from '../config/gameConfig';
import type { GameScene } from './GameScene';
import type { BallType } from '../managers/BallInventoryManager';

// ============================================================
// CONFIGURATION
// ============================================================

const EASY_CONFIG = {
  /** Minimum upward swipe distance (pixels) to register as a throw */
  MIN_SWIPE_DIST: 50,
  /** Maximum time for a valid swipe gesture (ms) */
  MAX_SWIPE_TIME: 500,
  /** Ball throw arc duration (ms) */
  THROW_DURATION: 500,
  /** Success animation duration (ms) */
  SUCCESS_DURATION: 800,
  /** Failure animation duration (ms) */
  FAILURE_DURATION: 400,
  /** Ball colors by type */
  BALL_COLORS: {
    0: 0xff4444, // Poke Ball - Red
    1: 0x4488ff, // Great Ball - Blue
    2: 0xffcc00, // Ultra Ball - Yellow
    3: 0xaa44ff, // Master Ball - Purple
  } as Record<BallType, number>,
  /** Pokemon vertical offset from center (slightly above center) */
  POKEMON_Y_OFFSET: -60,
  /** Pokemon scale in Easy Mode (larger for visibility) */
  POKEMON_SCALE: 3,
} as const;

// ============================================================
// ENCOUNTER DATA
// ============================================================

export interface EasyEncounter {
  pokemonId: bigint;
  slotIndex: number;
  attemptCount: number;
}

// ============================================================
// SCENE CLASS
// ============================================================

export class EasyCatchScene extends Scene {
  // Current encounter
  private currentEncounter: EasyEncounter | null = null;

  // Visual entities
  private pokemonSprite?: Pokemon;
  private grassRustle?: GrassRustle;

  // Animation state
  private throwBallSprite?: Phaser.GameObjects.Arc;
  private throwArcTimer?: Phaser.Time.TimerEvent;
  private effectsContainer?: Phaser.GameObjects.Container;
  private struggleSprite?: Phaser.GameObjects.Arc;
  private struggleBallLine?: Phaser.GameObjects.Rectangle;
  private struggleTween?: Phaser.Tweens.Tween;
  private struggleTimer?: Phaser.Time.TimerEvent;
  private struggleExclamations: Phaser.GameObjects.Text[] = [];

  // Swipe tracking
  private swipeStartY: number = 0;
  private swipeStartTime: number = 0;
  private isTrackingSwipe: boolean = false;

  // Tilemap background
  private map?: Phaser.Tilemaps.Tilemap;
  private groundLayer?: Phaser.Tilemaps.TilemapLayer;
  private decorations: Phaser.GameObjects.GameObject[] = [];

  // No-Pokemon message
  private noPokemonText?: Phaser.GameObjects.Text;

  // Audio
  private sfx!: ChiptuneSFX;
  private mp3Music?: MP3Music;

  // Pokemon position (viewport-relative, updated on resize)
  private pokemonX: number = 0;
  private pokemonY: number = 0;

  constructor() {
    super({ key: 'EasyCatchScene' });
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  preload(): void {
    this.createTextures();

    // Load background music (same as GameScene)
    this.load.audio('mo-bamba', '/mo-bamba.mp3');
    this.load.once('loaderror', (file: { key: string; src: string }) => {
      if (file.key === 'mo-bamba') {
        console.error('[EasyCatchScene] Failed to load music:', file.src);
      }
    });
  }

  create(): void {
    this.sfx = getChiptuneSFX();

    // Background
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x228B22);
    this.pokemonX = cam.centerX;
    this.pokemonY = cam.centerY + EASY_CONFIG.POKEMON_Y_OFFSET;

    this.createGrassBackground();
    this.setupSwipeInput();
    this.showHintOverlay();

    // Initialize background music (same pattern as GameScene)
    this.mp3Music = new MP3Music(this);
    if (this.cache.audio.exists('mo-bamba')) {
      this.time.delayedCall(100, () => {
        if (this.mp3Music) this.mp3Music.play();
      });
    } else {
      this.load.once('filecomplete-audio-mo-bamba', () => {
        this.time.delayedCall(100, () => {
          if (this.mp3Music) this.mp3Music.play();
        });
      });
    }

    // Handle browser autoplay restrictions — start music on first interaction
    const startMusicOnInteraction = () => {
      if (this.mp3Music && !this.mp3Music.isMusicPlaying()) {
        this.mp3Music.play();
      }
      this.input.off('pointerdown', startMusicOnInteraction);
      this.input.off('pointerup', startMusicOnInteraction);
    };
    this.input.once('pointerdown', startMusicOnInteraction);
    this.input.once('pointerup', startMusicOnInteraction);

    // Handle resize
    this.scale.on('resize', (_gameSize: Phaser.Structs.Size) => {
      this.onResize();
    });

    console.log('[EasyCatchScene] Scene created');
  }

  // ============================================================
  // TEXTURE GENERATION (same as GameScene)
  // ============================================================

  private createTextures(): void {
    // Pokemon placeholder (16x16 semi-transparent circle)
    if (!this.textures.exists('pokemon-placeholder')) {
      const pokemonGfx = this.make.graphics({ x: 0, y: 0 });
      pokemonGfx.fillStyle(0x88cc44, 0.3);
      pokemonGfx.fillCircle(8, 10, 6);
      pokemonGfx.generateTexture('pokemon-placeholder', 16, 16);
      pokemonGfx.destroy();
      this.textures.get('pokemon-placeholder').setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    // Grass rustle spritesheet (4 frames, 64x16)
    if (!this.textures.exists('grass-rustle')) {
      const grassGfx = this.make.graphics({ x: 0, y: 0 });
      for (let frame = 0; frame < 4; frame++) {
        const offsetX = frame * 16;
        const phase = frame / 4;
        const sway = Math.sin(phase * Math.PI * 2) * 1.5;
        const kickHeight = Math.abs(Math.sin(phase * Math.PI * 2)) * 2;

        grassGfx.fillStyle(0x558822, 1);
        grassGfx.fillRect(offsetX + 2, 13, 12, 3);

        const bladeColors = [0x55aa22, 0x77cc44, 0x55aa22];
        const bladePositions = [2, 7, 11];
        for (let b = 0; b < 3; b++) {
          const baseX = offsetX + bladePositions[b];
          const bladeSway = sway * (b % 2 === 0 ? 1 : -1) * 0.7;
          const bladeHeight = 6 + (b === 1 ? 2 : 0);
          grassGfx.fillStyle(bladeColors[b], 1);
          grassGfx.fillTriangle(
            baseX + bladeSway, 14,
            baseX + 1.5 + bladeSway, 14 - bladeHeight - kickHeight * 0.5,
            baseX + 3 + bladeSway, 14
          );
        }

        grassGfx.fillStyle(0x88dd55, 0.9);
        const p1Y = 10 - kickHeight - (frame === 1 ? 2 : frame === 2 ? 3 : frame === 3 ? 1 : 0);
        grassGfx.fillRect(offsetX + 2 + sway, p1Y, 1, 2);
        const p2Y = 9 - kickHeight * 0.8 - (frame === 0 ? 1 : frame === 1 ? 2 : frame === 2 ? 2 : 0);
        grassGfx.fillRect(offsetX + 12 - sway, p2Y, 1, 2);
        const p3Y = 6 - kickHeight * 1.2 - (frame === 2 ? 3 : frame === 3 ? 2 : frame === 0 ? 1 : 2);
        grassGfx.fillStyle(0x99ee66, 0.8);
        grassGfx.fillRect(offsetX + 7 + sway * 0.5, p3Y, 1, 1);

        grassGfx.fillStyle(0xccdd99, 0.6);
        if (frame === 1 || frame === 3) {
          grassGfx.fillCircle(offsetX + 5 - sway, 7 - kickHeight, 0.5);
          grassGfx.fillCircle(offsetX + 11 + sway, 8 - kickHeight * 0.5, 0.5);
        }
      }
      grassGfx.generateTexture('grass-rustle', 64, 16);
      grassGfx.destroy();
      this.textures.get('grass-rustle').setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    // Grass particle
    if (!this.textures.exists('grass-particle')) {
      const particleGfx = this.make.graphics({ x: 0, y: 0 });
      particleGfx.fillStyle(0x77cc44, 1);
      particleGfx.fillTriangle(0, 4, 1, 0, 2, 4);
      particleGfx.generateTexture('grass-particle', 4, 6);
      particleGfx.destroy();
    }

    // --- Tileset texture (same as MapManager) ---
    if (!this.textures.exists('tiles')) {
      const tilesGfx = this.make.graphics({ x: 0, y: 0 });

      // Tile 0: Grass
      tilesGfx.fillStyle(0x88cc44, 1);
      tilesGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      // Tile 1: Path
      tilesGfx.fillStyle(0xccccaa, 1);
      tilesGfx.fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

      // Tile 2: Garden/Dirt
      tilesGfx.fillStyle(0x996633, 1);
      tilesGfx.fillRect(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);

      // Tile 3: Plant
      tilesGfx.fillStyle(0x996633, 1);
      tilesGfx.fillRect(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);
      tilesGfx.fillStyle(0x44aa44, 1);
      tilesGfx.fillRect(TILE_SIZE * 3 + 7, 8, 2, 8);
      tilesGfx.fillStyle(0xff00ff, 1);
      tilesGfx.fillCircle(TILE_SIZE * 3 + 8, 6, 3);

      // Tile 4: Water
      tilesGfx.fillStyle(0x4169e1, 1);
      tilesGfx.fillRect(TILE_SIZE * 4, 0, TILE_SIZE, TILE_SIZE);

      // Tile 5: Sand
      tilesGfx.fillStyle(0xf4a460, 1);
      tilesGfx.fillRect(TILE_SIZE * 5, 0, TILE_SIZE, TILE_SIZE);

      // Tile 6: Rock
      tilesGfx.fillStyle(0x696969, 1);
      tilesGfx.fillRect(TILE_SIZE * 6, 0, TILE_SIZE, TILE_SIZE);
      tilesGfx.fillStyle(0x808080, 1);
      tilesGfx.fillRect(TILE_SIZE * 6 + 4, 4, 8, 8);

      // Tile 7: Mountain
      tilesGfx.fillStyle(0x8b7355, 1);
      tilesGfx.fillRect(TILE_SIZE * 7, 0, TILE_SIZE, TILE_SIZE);
      tilesGfx.fillStyle(0xa9a9a9, 1);
      tilesGfx.fillTriangle(TILE_SIZE * 7, TILE_SIZE, TILE_SIZE * 7 + 8, 4, TILE_SIZE * 7 + TILE_SIZE, TILE_SIZE);

      tilesGfx.generateTexture('tiles', TILE_SIZE * 8, TILE_SIZE);
      tilesGfx.destroy();
    }

    // --- Tree texture (same as GameScene) ---
    if (!this.textures.exists('tree')) {
      const treeGfx = this.make.graphics({ x: 0, y: 0 });
      treeGfx.fillStyle(0x8b4513, 1);
      treeGfx.fillRect(6, 10, 4, 6);
      treeGfx.fillStyle(0x228b22, 1);
      treeGfx.fillCircle(8, 8, 6);
      treeGfx.fillStyle(0x32cd32, 1);
      treeGfx.fillCircle(6, 6, 2);
      treeGfx.fillCircle(10, 6, 2);
      treeGfx.fillCircle(8, 4, 2);
      treeGfx.generateTexture('tree', 16, 16);
      treeGfx.destroy();
    }

    // --- Bush texture (same as GameScene) ---
    if (!this.textures.exists('bush')) {
      const bushGfx = this.make.graphics({ x: 0, y: 0 });
      bushGfx.fillStyle(0x228b22, 1);
      bushGfx.fillCircle(8, 8, 7);
      bushGfx.fillStyle(0x32cd32, 1);
      bushGfx.fillCircle(6, 6, 3);
      bushGfx.fillCircle(10, 6, 3);
      bushGfx.fillCircle(8, 10, 3);
      bushGfx.generateTexture('bush', 16, 16);
      bushGfx.destroy();
    }

    // --- Rock texture (same as GameScene) ---
    if (!this.textures.exists('rock')) {
      const rockGfx = this.make.graphics({ x: 0, y: 0 });
      rockGfx.fillStyle(0x696969, 1);
      rockGfx.fillRect(2, 2, 12, 12);
      rockGfx.fillStyle(0x808080, 1);
      rockGfx.fillRect(4, 4, 8, 8);
      rockGfx.fillStyle(0x555555, 1);
      rockGfx.fillRect(6, 6, 4, 4);
      rockGfx.generateTexture('rock', 16, 16);
      rockGfx.destroy();
    }

    // --- House textures (same as GameScene) ---
    if (!this.textures.exists('house-small')) {
      const smallGfx = this.make.graphics({ x: 0, y: 0 });
      smallGfx.fillStyle(0x8b4513, 1);
      smallGfx.fillRect(0, 8, 16, 8);
      smallGfx.fillStyle(0x8b0000, 1);
      smallGfx.fillTriangle(0, 8, 8, 2, 16, 8);
      smallGfx.fillStyle(0x000000, 1);
      smallGfx.fillRect(6, 12, 4, 4);
      smallGfx.fillStyle(0xffff00, 1);
      smallGfx.fillRect(2, 10, 3, 3);
      smallGfx.fillRect(11, 10, 3, 3);
      smallGfx.generateTexture('house-small', 16, 16);
      smallGfx.destroy();
    }

    if (!this.textures.exists('house-medium')) {
      const medGfx = this.make.graphics({ x: 0, y: 0 });
      medGfx.fillStyle(0xdeb887, 1);
      medGfx.fillRect(0, 6, 32, 10);
      medGfx.fillStyle(0x8b0000, 1);
      medGfx.fillTriangle(0, 6, 16, 0, 32, 6);
      medGfx.fillStyle(0x000000, 1);
      medGfx.fillRect(12, 12, 8, 4);
      medGfx.fillStyle(0x87ceeb, 1);
      medGfx.fillRect(4, 9, 4, 4);
      medGfx.fillRect(24, 9, 4, 4);
      medGfx.generateTexture('house-medium', 32, 16);
      medGfx.destroy();
    }

    if (!this.textures.exists('house-large')) {
      const largeGfx = this.make.graphics({ x: 0, y: 0 });
      largeGfx.fillStyle(0xf5deb3, 1);
      largeGfx.fillRect(0, 8, 48, 16);
      largeGfx.fillStyle(0x8b0000, 1);
      largeGfx.fillTriangle(0, 8, 24, 0, 48, 8);
      largeGfx.fillStyle(0x000000, 1);
      largeGfx.fillRect(20, 18, 8, 6);
      largeGfx.fillStyle(0x87ceeb, 1);
      largeGfx.fillRect(6, 12, 6, 6);
      largeGfx.fillRect(36, 12, 6, 6);
      largeGfx.fillRect(21, 10, 6, 4);
      largeGfx.generateTexture('house-large', 48, 24);
      largeGfx.destroy();
    }
  }

  // ============================================================
  // BACKGROUND
  // ============================================================

  private createGrassBackground(): void {
    const cam = this.cameras.main;

    // Calculate how many tiles we need to fill the viewport
    const tilesWide = Math.ceil(cam.width / TILE_SIZE) + 2;
    const tilesHigh = Math.ceil(cam.height / TILE_SIZE) + 2;

    // Create a tilemap sized to cover the viewport
    this.map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: tilesWide,
      height: tilesHigh,
    });

    const tiles = this.map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0);
    if (tiles) {
      this.groundLayer = this.map.createBlankLayer('ground', tiles, 0, 0, tilesWide, tilesHigh)!;
      if (this.groundLayer) {
        this.groundLayer.setDepth(0);

        // Fill with grass (tile 0)
        this.groundLayer.fill(0, 0, 0, tilesWide, tilesHigh);

        // Add a path running horizontally through the scene (near bottom third)
        const pathRow = Math.floor(tilesHigh * 0.72);
        this.groundLayer.fill(1, 0, pathRow, tilesWide, 1);

        // Add a short vertical path crossing near center-right
        const crossCol = Math.floor(tilesWide * 0.7);
        const crossStart = Math.max(0, pathRow - 4);
        this.groundLayer.fill(1, crossCol, crossStart, 1, 9);
      }
    }

    // Place decorative sprites around the viewport edges (away from center Pokemon area)
    this.placeDecorations(cam.width, cam.height);
  }

  /**
   * Place trees, houses, bushes, and rocks around the viewport edges.
   * Uses curated positions for a clean, open composition.
   * All decorations scaled to POKEMON_SCALE so they match the zoomed-in camera.
   * Maintains 80px+ clear radius around Pokemon center.
   */
  private placeDecorations(viewW: number, viewH: number): void {
    // Clear previous decorations
    for (const d of this.decorations) d.destroy();
    this.decorations = [];

    const cx = viewW / 2;
    const cy = viewH / 2 + EASY_CONFIG.POKEMON_Y_OFFSET;
    const safeDist = 90; // pixels — clear zone around Pokemon
    const S = EASY_CONFIG.POKEMON_SCALE; // uniform scale for all decorations

    const isSafe = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      return Math.sqrt(dx * dx + dy * dy) > safeDist;
    };

    // Small deterministic jitter so positions feel natural (+-8px)
    const jitter = (base: number, i: number) => {
      const hash = ((Math.floor(base) * 31 + i * 17) % 1000) / 1000;
      return (hash - 0.5) * 16;
    };

    // --- Short tree row along top-left (3 trees, spaced along the edge) ---
    const treeRowY = viewH * 0.08;
    const treeRowPositions = [
      { x: viewW * 0.06, y: treeRowY },
      { x: viewW * 0.16, y: treeRowY },
      { x: viewW * 0.25, y: treeRowY },
    ];
    treeRowPositions.forEach((pos, i) => {
      const tx = pos.x + jitter(pos.x, i);
      const ty = pos.y + jitter(pos.y, i + 10);
      if (!isSafe(tx, ty)) return;
      const tree = new Tree(this, tx, ty);
      tree.setScale(S);
      this.decorations.push(tree);
    });

    // --- A couple scattered trees (right side + bottom-left, with gaps) ---
    const scatteredTrees = [
      { x: viewW * 0.85, y: viewH * 0.12 },
      { x: viewW * 0.10, y: viewH * 0.88 },
      { x: viewW * 0.78, y: viewH * 0.85 },
    ];
    scatteredTrees.forEach((pos, i) => {
      const tx = pos.x + jitter(pos.x, i + 20);
      const ty = pos.y + jitter(pos.y, i + 30);
      if (!isSafe(tx, ty)) return;
      const tree = new Tree(this, tx, ty);
      tree.setScale(S);
      this.decorations.push(tree);
    });

    // --- One house (top-right area, partially off-edge for depth) ---
    const houseX = viewW * 0.88 + jitter(viewW, 40);
    const houseY = viewH * 0.22 + jitter(viewH, 41);
    if (isSafe(houseX, houseY)) {
      const house = new House(this, houseX, houseY, 'medium');
      house.setScale(S);
      this.decorations.push(house);
    }

    // --- Bushes (2-3 near path or edges, spaced out) ---
    const bushPositions = [
      { x: viewW * 0.30, y: viewH * 0.70 },
      { x: viewW * 0.72, y: viewH * 0.65 },
      { x: viewW * 0.92, y: viewH * 0.50 },
    ];
    bushPositions.forEach((pos, i) => {
      const bx = pos.x + jitter(pos.x, i + 50);
      const by = pos.y + jitter(pos.y, i + 60);
      if (!isSafe(bx, by)) return;
      const bush = this.add.sprite(bx, by, 'bush');
      bush.setScale(S);
      bush.setDepth(4);
      this.decorations.push(bush);
    });

    // --- Rocks (2, tucked near edges) ---
    const rockPositions = [
      { x: viewW * 0.05, y: viewH * 0.55 },
      { x: viewW * 0.60, y: viewH * 0.92 },
    ];
    rockPositions.forEach((pos, i) => {
      const rx = pos.x + jitter(pos.x, i + 70);
      const ry = pos.y + jitter(pos.y, i + 80);
      if (!isSafe(rx, ry)) return;
      const rock = this.add.sprite(rx, ry, 'rock');
      rock.setScale(S);
      rock.setDepth(2);
      this.decorations.push(rock);
    });
  }

  // ============================================================
  // ENCOUNTER MANAGEMENT
  // ============================================================

  /**
   * Set the current Pokemon encounter.
   * Called by GameCanvas when spawn data arrives or after a catch.
   */
  setEncounter(spawn: EasyEncounter): void {
    console.log('[EasyCatchScene] setEncounter:', spawn.pokemonId.toString(), 'slot:', spawn.slotIndex);

    // Remove existing Pokemon if any
    this.destroyPokemon();
    this.hideNoPokemonMessage();

    this.currentEncounter = spawn;

    // Create Pokemon at viewport center
    const cam = this.cameras.main;
    this.pokemonX = cam.centerX;
    this.pokemonY = cam.centerY + EASY_CONFIG.POKEMON_Y_OFFSET;

    // Create the Pokemon entity (type cast: Pokemon only uses standard Scene methods)
    this.pokemonSprite = new Pokemon(
      this as unknown as GameScene,
      this.pokemonX,
      this.pokemonY,
      spawn.pokemonId
    );
    this.pokemonSprite.setScale(EASY_CONFIG.POKEMON_SCALE);
    this.pokemonSprite.attemptCount = spawn.attemptCount;

    // Override the default click handler to emit our event
    this.pokemonSprite.removeAllListeners('pointerdown');
    this.pokemonSprite.on('pointerdown', () => {
      this.onPokemonTapped();
    });

    // Create grass rustle effect
    this.grassRustle = new GrassRustle(
      this as unknown as GameScene,
      this.pokemonSprite
    );
    this.grassRustle.setScale(EASY_CONFIG.POKEMON_SCALE);
    this.grassRustle.playRustle();

    // Play spawn animation
    this.pokemonSprite.playSpawnAnimation();
  }

  /**
   * Clear the current encounter (no Pokemon available).
   */
  clearEncounter(): void {
    this.destroyPokemon();
    this.currentEncounter = null;
    this.showNoPokemonMessage();
  }

  private destroyPokemon(): void {
    if (this.grassRustle) {
      this.grassRustle.stopRustle(true);
      this.grassRustle.destroy();
      this.grassRustle = undefined;
    }
    if (this.pokemonSprite) {
      this.pokemonSprite.destroy();
      this.pokemonSprite = undefined;
    }
  }

  private showNoPokemonMessage(): void {
    if (this.noPokemonText) return;
    const cam = this.cameras.main;
    this.noPokemonText = this.add.text(cam.centerX, cam.centerY, 'No wild Pokemon available\nCheck back soon!', {
      fontSize: '18px',
      fontFamily: "'Courier New', monospace",
      color: '#00ff88',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.noPokemonText.setOrigin(0.5);
    this.noPokemonText.setDepth(50);
  }

  private hideNoPokemonMessage(): void {
    if (this.noPokemonText) {
      this.noPokemonText.destroy();
      this.noPokemonText = undefined;
    }
  }

  // ============================================================
  // INPUT HANDLING
  // ============================================================

  private onPokemonTapped(): void {
    if (!this.currentEncounter) {
      console.log('[EasyCatchScene] onPokemonTapped: no current encounter');
      return;
    }

    console.log('[EasyCatchScene] onPokemonTapped: emitting pokemon-catch-ready for', this.currentEncounter.pokemonId.toString());
    this.events.emit('pokemon-catch-ready', {
      pokemonId: this.currentEncounter.pokemonId,
      slotIndex: this.currentEncounter.slotIndex,
      attemptCount: this.currentEncounter.attemptCount,
      x: this.pokemonX,
      y: this.pokemonY,
    });
  }

  private setupSwipeInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Backup click detection: if click is near the Pokemon, treat as a tap
      // This catches cases where the sprite's hit area doesn't register
      if (this.currentEncounter && this.pokemonSprite) {
        const dx = pointer.x - this.pokemonX;
        const dy = pointer.y - this.pokemonY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Hit radius: scaled sprite size + generous margin
        if (dist < 40) {
          console.log('[EasyCatchScene] Backup click detection hit (dist:', Math.round(dist), ')');
          this.onPokemonTapped();
          return; // Don't track as swipe
        }
      }

      const cam = this.cameras.main;
      // Only track swipes starting in bottom third of screen
      if (pointer.y > cam.height * 0.67) {
        this.swipeStartY = pointer.y;
        this.swipeStartTime = Date.now();
        this.isTrackingSwipe = true;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isTrackingSwipe) return;
      this.isTrackingSwipe = false;

      const dy = pointer.y - this.swipeStartY;
      const dt = Date.now() - this.swipeStartTime;

      // Upward swipe: negative dy, within time limit
      if (dy < -EASY_CONFIG.MIN_SWIPE_DIST && dt < EASY_CONFIG.MAX_SWIPE_TIME && this.currentEncounter) {
        console.log('[EasyCatchScene] Swipe detected! dy:', dy, 'dt:', dt);
        this.onPokemonTapped(); // Same event as tap
      }
    });
  }

  // ============================================================
  // HINT OVERLAY
  // ============================================================

  private showHintOverlay(): void {
    const shown = localStorage.getItem('pokemonTrader_easyHintSeen');
    if (shown) return;

    const cam = this.cameras.main;
    const overlay = this.add.rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x000000, 0.7);
    overlay.setDepth(200);
    overlay.setInteractive(); // Block clicks through overlay

    const hintText = this.add.text(cam.centerX, cam.centerY,
      'Tap the Pokemon\nor swipe up to throw!', {
        fontSize: '24px',
        fontFamily: "'Courier New', monospace",
        color: '#00ff88',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      });
    hintText.setOrigin(0.5);
    hintText.setDepth(201);

    const dismissHint = () => {
      if (!overlay.active) return;
      this.tweens.add({
        targets: [overlay, hintText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          hintText.destroy();
        },
      });
      localStorage.setItem('pokemonTrader_easyHintSeen', 'true');
    };

    // Dismiss on tap
    overlay.once('pointerdown', dismissHint);

    // Auto-dismiss after 4 seconds
    this.time.delayedCall(4000, dismissHint);
  }

  // ============================================================
  // ANIMATION METHODS (called by GameCanvas via refs)
  // ============================================================

  /**
   * Play ball throw arc animation from bottom-center to Pokemon.
   */
  async playBallThrow(ballType: BallType): Promise<void> {
    this.sfx.playThrowStart();

    return new Promise((resolve) => {
      this.cleanupThrowSprite();

      const cam = this.cameras.main;
      const startX = cam.centerX;
      const startY = cam.height - 80;
      const toX = this.pokemonX;
      const toY = this.pokemonY;

      const ballColor = EASY_CONFIG.BALL_COLORS[ballType];
      this.throwBallSprite = this.add.circle(startX, startY, 6, ballColor);
      this.throwBallSprite.setDepth(100);
      this.throwBallSprite.setStrokeStyle(2, 0xffffff);
      console.log('[EasyCatchScene] throwBallSprite CREATED');

      // Bezier arc
      const midX = (startX + toX) / 2;
      const distance = Math.sqrt((toX - startX) ** 2 + (toY - startY) ** 2);
      const arcHeight = Math.min(60, Math.max(30, distance * 0.3));
      const midY = Math.min(startY, toY) - arcHeight;

      const duration = EASY_CONFIG.THROW_DURATION;
      let elapsed = 0;
      let landed = false; // Guard: only fire landing logic once

      this.throwArcTimer = this.time.addEvent({
        delay: 16,
        callback: () => {
          if (!this.throwBallSprite || landed) return;
          elapsed += 16;
          const t = Math.min(elapsed / duration, 1);

          // Quadratic bezier
          const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * toX;
          const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * toY;
          this.throwBallSprite!.setPosition(x, y);
          this.throwBallSprite!.rotation += 0.2;
          this.throwBallSprite!.setScale(1 - t * 0.2);

          if (t >= 1) {
            landed = true; // Prevent multiple fade-out tweens
            this.sfx.playBallImpact();
            this.tweens.add({
              targets: this.throwBallSprite,
              alpha: 0,
              scale: 0.5,
              duration: 100,
              onComplete: () => {
                this.cleanupThrowSprite();
                console.log('[EasyCatchScene] throwBallSprite DESTROYED (arc complete)');
                resolve();
              },
            });
          }
        },
        repeat: Math.ceil(duration / 16) + 1,
      });
    });
  }

  /**
   * Play ball throw then start struggle wobble animation.
   * Returns a cleanup function to stop the struggle.
   */
  async playBallThrowThenStruggle(ballType: BallType): Promise<() => void> {
    await this.playBallThrow(ballType);
    return this.playStruggleAnimation(ballType);
  }

  /**
   * Play looping struggle/wobble animation at Pokemon position.
   */
  private playStruggleAnimation(ballType: BallType): () => void {
    this.cleanupStruggle();

    const x = this.pokemonX;
    const y = this.pokemonY;
    const ballColor = EASY_CONFIG.BALL_COLORS[ballType];

    // Create ball at Pokemon position
    this.struggleSprite = this.add.circle(x, y, 7, ballColor);
    this.struggleSprite.setDepth(100);
    this.struggleSprite.setStrokeStyle(2, 0xffffff);
    console.log('[EasyCatchScene] struggleSprite CREATED');

    // Ball line (pokeball center stripe) — stored as member for cleanup
    this.struggleBallLine = this.add.rectangle(x, y, 12, 2, 0xffffff);
    this.struggleBallLine.setDepth(101);
    const ballLine = this.struggleBallLine;

    // Wobble tween
    this.struggleTween = this.tweens.add({
      targets: [this.struggleSprite, ballLine],
      angle: { from: -15, to: 15 },
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Periodic "!" marks
    this.struggleTimer = this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        if (!this.struggleSprite) return;
        const excl = this.add.text(x, y - 20, '!', {
          fontSize: '16px',
          fontFamily: "'Courier New', monospace",
          color: '#ff4444',
          stroke: '#000000',
          strokeThickness: 3,
        });
        excl.setOrigin(0.5);
        excl.setDepth(102);
        this.struggleExclamations.push(excl);

        this.tweens.add({
          targets: excl,
          y: y - 40,
          alpha: 0,
          duration: 600,
          ease: 'Quad.easeOut',
          onComplete: () => {
            excl.destroy();
            const idx = this.struggleExclamations.indexOf(excl);
            if (idx >= 0) this.struggleExclamations.splice(idx, 1);
          },
        });
      },
    });

    const cleanup = () => {
      // cleanupStruggle() now handles ballLine via this.struggleBallLine
      this.cleanupStruggle();
    };

    return cleanup;
  }

  /**
   * Handle catch result — play success or failure animation.
   * Defensively cleans up ALL ball sprites first (throw + struggle)
   * to prevent leaks regardless of stopStruggle timing.
   */
  handleCatchResult(caught: boolean, _pokemonId: bigint): void {
    console.log('[EasyCatchScene] handleCatchResult:', caught ? 'CAUGHT' : 'FAILED');

    // Defensive cleanup: destroy any lingering ball sprites from throw/struggle.
    // This ensures cleanup even if stopStruggleRef wasn't called yet (race condition).
    this.cleanupThrowSprite();
    this.cleanupStruggle();

    if (caught) {
      this.playSuccessAnimation();
    } else {
      this.playFailAnimation();
    }
  }

  // ============================================================
  // RESULT ANIMATIONS
  // ============================================================

  private playSuccessAnimation(): void {
    this.sfx.playCatchSuccess();

    this.effectsContainer = this.add.container(this.pokemonX, this.pokemonY);
    this.effectsContainer.setDepth(150);

    // Sparkles
    const sparkleCount = 8;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2;
      const sparkle = this.add.circle(0, 0, 4, 0xffff00);
      sparkle.setAlpha(0);
      this.effectsContainer.add(sparkle);

      this.tweens.add({
        targets: sparkle,
        x: Math.cos(angle) * 40,
        y: Math.sin(angle) * 40,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.2 },
        duration: EASY_CONFIG.SUCCESS_DURATION,
        ease: 'Quad.easeOut',
      });
    }

    // "CAUGHT!" text
    const successText = this.add.text(0, -30, 'CAUGHT!', {
      fontSize: '16px',
      fontFamily: "'Courier New', monospace",
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    successText.setOrigin(0.5);
    this.effectsContainer.add(successText);

    this.tweens.add({
      targets: successText,
      y: -60,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.5 },
      duration: EASY_CONFIG.SUCCESS_DURATION,
      ease: 'Quad.easeOut',
    });

    // Pokemon catch animation
    if (this.pokemonSprite) {
      this.pokemonSprite.playSuccessAnimation();
    }

    this.time.delayedCall(EASY_CONFIG.SUCCESS_DURATION, () => {
      this.cleanupEffects();
    });
  }

  private playFailAnimation(): void {
    this.sfx.playCatchFail();

    this.effectsContainer = this.add.container(this.pokemonX, this.pokemonY);
    this.effectsContainer.setDepth(150);

    // Ball fragments
    const fragmentCount = 4;
    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2 + Math.PI / 4;
      const fragment = this.add.arc(0, 0, 4, 0, Math.PI, false, 0xff4444);
      fragment.rotation = angle;
      this.effectsContainer.add(fragment);

      this.tweens.add({
        targets: fragment,
        x: Math.cos(angle) * 30,
        y: Math.sin(angle) * 30,
        alpha: 0,
        rotation: angle + Math.PI,
        duration: EASY_CONFIG.FAILURE_DURATION,
        ease: 'Quad.easeOut',
      });
    }

    // "ESCAPED!" text
    const failText = this.add.text(0, -30, 'ESCAPED!', {
      fontSize: '14px',
      fontFamily: "'Courier New', monospace",
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    });
    failText.setOrigin(0.5);
    this.effectsContainer.add(failText);

    this.tweens.add({
      targets: failText,
      x: { from: -3, to: 3 },
      duration: 50,
      yoyo: true,
      repeat: 4,
    });

    this.tweens.add({
      targets: failText,
      alpha: 0,
      y: -50,
      duration: EASY_CONFIG.FAILURE_DURATION + 200,
      ease: 'Quad.easeOut',
    });

    // Pokemon fail animation
    if (this.pokemonSprite) {
      this.pokemonSprite.playFailAnimation();
    }

    this.time.delayedCall(EASY_CONFIG.FAILURE_DURATION + 300, () => {
      this.cleanupEffects();
    });
  }

  // ============================================================
  // CLEANUP HELPERS
  // ============================================================

  private cleanupThrowSprite(): void {
    if (this.throwArcTimer) {
      this.throwArcTimer.destroy();
      this.throwArcTimer = undefined;
    }
    if (this.throwBallSprite) {
      this.throwBallSprite.destroy();
      this.throwBallSprite = undefined;
      console.log('[EasyCatchScene] throwBallSprite DESTROYED (cleanup)');
    }
  }

  private cleanupEffects(): void {
    if (this.effectsContainer) {
      this.effectsContainer.destroy(true);
      this.effectsContainer = undefined;
    }
  }

  private cleanupStruggle(): void {
    if (this.struggleTween) {
      this.struggleTween.stop();
      this.struggleTween.destroy();
      this.struggleTween = undefined;
    }
    if (this.struggleTimer) {
      this.struggleTimer.destroy();
      this.struggleTimer = undefined;
    }
    if (this.struggleBallLine) {
      this.struggleBallLine.destroy();
      this.struggleBallLine = undefined;
    }
    if (this.struggleSprite) {
      this.struggleSprite.destroy();
      this.struggleSprite = undefined;
      console.log('[EasyCatchScene] struggleSprite DESTROYED (cleanup)');
    }
    for (const excl of this.struggleExclamations) {
      excl.destroy();
    }
    this.struggleExclamations = [];
  }

  // ============================================================
  // RESIZE HANDLING
  // ============================================================

  private onResize(): void {
    const cam = this.cameras.main;
    this.pokemonX = cam.centerX;
    this.pokemonY = cam.centerY + EASY_CONFIG.POKEMON_Y_OFFSET;

    // Rebuild tilemap + decorations at new viewport size
    if (this.groundLayer) {
      this.groundLayer.destroy();
      this.groundLayer = undefined;
    }
    if (this.map) {
      this.map.destroy();
      this.map = undefined;
    }
    this.createGrassBackground();

    if (this.pokemonSprite) {
      this.pokemonSprite.setPosition(this.pokemonX, this.pokemonY);
    }
    if (this.grassRustle) {
      this.grassRustle.setPosition(this.pokemonX, this.pokemonY + 8);
    }
    if (this.noPokemonText) {
      this.noPokemonText.setPosition(cam.centerX, cam.centerY);
    }
  }

  // ============================================================
  // SCENE INTERFACE (for GameCanvas / App.tsx compatibility)
  // ============================================================

  /** Return MP3Music instance for volume control from App.tsx */
  getMP3Music(): MP3Music | undefined {
    return this.mp3Music;
  }

  /** Not used in Easy Mode */
  getPokemonSpawnManager(): undefined {
    return undefined;
  }

  /** Not used in Easy Mode */
  getCatchMechanicsManager(): undefined {
    return undefined;
  }
}
