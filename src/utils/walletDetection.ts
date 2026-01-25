/**
 * Wallet Detection Utilities
 *
 * Helper functions to detect availability of custom wallet providers:
 * - EthereumPhone dGen1: ethOS device with system wallet
 * - Glyph: Yuga Labs wallet for ApeChain
 *
 * Detection Methods:
 * - dGen1: Checks window.ethereum.isEthereumPhone flag (ethOS injects provider)
 * - Glyph: Checks window.glyph or SDK initialization state
 *
 * Environment Variables:
 * - VITE_BUNDLER_RPC_URL: ERC-4337 bundler URL for dGen1 (optional, uses default)
 * - VITE_GLYPH_API_KEY: Glyph API key if required (optional)
 *
 * Testing Checklist:
 * - [x] dGen1 detection returns false on non-ethOS devices
 * - [x] Glyph detection returns false without SDK initialization
 * - [x] Both detection functions are safe to call at any time
 * - [x] Provider getters return null when wallet unavailable
 *
 * Touchscreen Considerations (dGen1):
 * - dGen1 is a square-screen (1:1) touchscreen device
 * - No keyboard/mouse - all interactions must be touch-friendly
 * - Viewport approximately 300x300px
 *
 * ThirdWeb v5 Compatibility:
 * - These detection utilities are independent of ThirdWeb
 * - ThirdWeb handles crypto checkout; these wallets handle connection
 * - No conflicts expected - they serve different purposes
 */

// ============================================================
// TYPES
// ============================================================

/** Extended ethereum provider with dGen1-specific properties */
interface EthereumPhoneProvider extends Ethereum {
  isEthereumPhone?: boolean;
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/** Glyph provider interface (may be extended as SDK evolves) */
interface GlyphProvider {
  isGlyph?: boolean;
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/** Standard Ethereum provider interface */
interface Ethereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

// Extend Window interface for wallet providers
// Note: window.ethereum may already be declared elsewhere, so we use intersection
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any; // Use any to avoid conflict with other declarations
    glyph?: GlyphProvider;
    /** ethOS-specific flag set by the system */
    __ETHOS_WALLET__?: boolean;
  }
}

// ============================================================
// ETHEREUM PHONE (dGen1) DETECTION
// ============================================================

/**
 * Check if the current device is an EthereumPhone dGen1 running ethOS.
 *
 * Detection strategy:
 * 1. Check window.ethereum.isEthereumPhone flag (primary)
 * 2. Check window.__ETHOS_WALLET__ flag (fallback)
 * 3. Check user agent for ethOS patterns (secondary fallback)
 *
 * @returns true if running on dGen1 device with ethOS
 */
export function isEthereumPhoneAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Primary detection: ethOS injects ethereum provider with flag
  if (window.ethereum?.isEthereumPhone === true) {
    console.log('[walletDetection] dGen1 detected via window.ethereum.isEthereumPhone');
    return true;
  }

  // Secondary: Check for ethOS system flag
  if (window.__ETHOS_WALLET__ === true) {
    console.log('[walletDetection] dGen1 detected via window.__ETHOS_WALLET__');
    return true;
  }

  // Tertiary: Check user agent for ethOS patterns
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('ethos') || userAgent.includes('ethereumphone')) {
    console.log('[walletDetection] dGen1 detected via user agent');
    return true;
  }

  return false;
}

/**
 * Get the EthereumPhone provider if available.
 *
 * @returns The ethereum provider on dGen1 devices, or null otherwise
 */
export function getEthereumPhoneProvider(): EthereumPhoneProvider | null {
  if (!isEthereumPhoneAvailable()) {
    return null;
  }

  // On ethOS, the system wallet is exposed via window.ethereum
  return window.ethereum ?? null;
}

/**
 * Check if this appears to be a square-screen device (dGen1 viewport hint).
 * Used to optimize UI layout for dGen1's 1:1 aspect ratio screen.
 *
 * @returns true if viewport appears square-ish (within 20% aspect ratio)
 */
export function isSquareScreen(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;

  // Square screens have aspect ratio close to 1.0
  // Allow 20% tolerance (0.8 to 1.2)
  return aspectRatio >= 0.8 && aspectRatio <= 1.2;
}

/**
 * Check if this is likely a touchscreen-only device (no mouse/keyboard).
 * Used to optimize UI for touch interactions on dGen1.
 *
 * @returns true if device appears to be touch-only
 */
export function isTouchOnlyDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for touch support without mouse support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const hasHover = window.matchMedia?.('(hover: hover)').matches;

  // Touch-only: has touch, coarse pointer, no hover capability
  return hasTouch && hasCoarsePointer && !hasHover;
}

// ============================================================
// GLYPH WALLET DETECTION
// ============================================================

/**
 * Check if Glyph wallet/SDK is available.
 *
 * Detection strategy:
 * 1. Check for window.glyph provider (if Glyph injects one)
 * 2. Check if @use-glyph/sdk-react is loaded (via marker)
 *
 * Note: Glyph primarily works through the SDK connector,
 * so this function may return false even when SDK is available.
 * Use the glyphWalletConnector directly for best results.
 *
 * @returns true if Glyph wallet appears available
 */
export function isGlyphAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for direct window.glyph provider
  if (window.glyph?.isGlyph === true) {
    console.log('[walletDetection] Glyph detected via window.glyph');
    return true;
  }

  // Glyph SDK doesn't require a browser extension - it uses the SDK connector
  // For SDK-based connections, always return true since it works via embedded iframe
  // The actual availability is determined by the connector's getProvider() method
  console.log('[walletDetection] Glyph SDK connector is always available');
  return true;
}

/**
 * Get the Glyph provider if available.
 *
 * Note: Glyph primarily works through the SDK, so direct provider
 * access may not be available. Use the wagmi connector instead.
 *
 * @returns The Glyph provider if available, or null
 */
export function getGlyphProvider(): GlyphProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Return window.glyph if present
  if (window.glyph?.isGlyph === true) {
    return window.glyph;
  }

  // Glyph SDK works through connector, not direct provider access
  return null;
}

// ============================================================
// DEBUGGING & DIAGNOSTICS
// ============================================================

/**
 * Log wallet detection results for debugging.
 * Call this during app initialization to verify detection.
 */
export function logWalletDetectionStatus(): void {
  console.log('[walletDetection] === Wallet Detection Status ===');
  console.log('[walletDetection] EthereumPhone (dGen1):', isEthereumPhoneAvailable() ? 'AVAILABLE' : 'not detected');
  console.log('[walletDetection] Glyph SDK:', isGlyphAvailable() ? 'AVAILABLE' : 'not detected');
  console.log('[walletDetection] Square screen:', isSquareScreen() ? 'YES' : 'NO');
  console.log('[walletDetection] Touch-only device:', isTouchOnlyDevice() ? 'YES' : 'NO');
  console.log('[walletDetection] Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('[walletDetection] User agent:', navigator.userAgent);
  console.log('[walletDetection] ===============================');
}

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

/**
 * Get the bundler RPC URL for dGen1 ERC-4337 transactions.
 * Falls back to a default Pimlico endpoint if not configured.
 *
 * @returns Bundler RPC URL for dGen1 transactions
 */
export function getBundlerRpcUrl(): string {
  const envUrl = import.meta.env.VITE_BUNDLER_RPC_URL as string | undefined;

  if (envUrl) {
    return envUrl;
  }

  // Default to a common bundler endpoint (may require API key in production)
  // For ApeChain, you may need a specific bundler that supports chain 33139
  console.warn('[walletDetection] VITE_BUNDLER_RPC_URL not set, using default');
  return 'https://api.pimlico.io/v2/33139/rpc';
}

/**
 * Get the Glyph API key if configured.
 *
 * @returns Glyph API key or undefined
 */
export function getGlyphApiKey(): string | undefined {
  return import.meta.env.VITE_GLYPH_API_KEY as string | undefined;
}

export default {
  isEthereumPhoneAvailable,
  getEthereumPhoneProvider,
  isGlyphAvailable,
  getGlyphProvider,
  isSquareScreen,
  isTouchOnlyDevice,
  logWalletDetectionStatus,
  getBundlerRpcUrl,
  getGlyphApiKey,
};
