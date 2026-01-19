import { Types } from 'phaser';

// GameBoy Pokemon Red/Blue resolution (scaled up)
export const GAME_WIDTH = 160 * 4; // 640px
export const GAME_HEIGHT = 144 * 4; // 576px

export const TILE_SIZE = 16; // 16x16 pixel tiles
export const MAP_WIDTH = 150; // tiles (increased by 50% from 100)
export const MAP_HEIGHT = 150; // tiles (increased by 50% from 100)

// Get viewport dimensions
const getViewportSize = () => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  height: typeof window !== 'undefined' ? window.innerHeight : 1080,
});

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: getViewportSize().width,
  height: getViewportSize().height,
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
    resizeInterval: 100,
  },
  scene: [],
  render: {
    antialias: false,
    pixelArt: true,
  },
};
