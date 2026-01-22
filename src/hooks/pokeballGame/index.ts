/**
 * PokeballGame Hooks
 *
 * Barrel export for all PokeballGame contract hooks.
 * Import from this file for cleaner imports in components.
 *
 * Usage:
 * ```tsx
 * import {
 *   usePurchaseBalls,
 *   useThrowBall,
 *   useGetPokemonSpawns,
 *   usePlayerBallInventory,
 *   useContractEvents,
 *   POKEBALL_GAME_ADDRESS,
 *   type BallType,
 * } from '../hooks/pokeballGame';
 *
 * // Use hooks in component
 * const { write: purchase } = usePurchaseBalls();
 * const { data: spawns } = useGetPokemonSpawns();
 * const { pokeBalls, greatBalls } = usePlayerBallInventory(account);
 * ```
 */

// ============================================================
// CONFIG EXPORTS
// ============================================================

export {
  // Contract configuration
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
  MAX_ACTIVE_POKEMON,
  RELATED_CONTRACTS,
  TOKEN_DECIMALS,
  usePokeballGameAddress,
  // Type definitions
  type BallType,
  type PokemonSpawnData,
  type PendingThrowData,
  type PlayerBallInventory,
  type PokeballGameEventName,
  // Utility functions
  getBallTypeName,
  getBallPriceUSD,
  getCatchRatePercent,
} from './pokeballGameConfig';

// ============================================================
// HOOK EXPORTS
// ============================================================

// Purchase balls hook
export { usePurchaseBalls, type UsePurchaseBallsReturn } from './usePurchaseBalls';

// Throw ball hook
export { useThrowBall, type UseThrowBallReturn } from './useThrowBall';

// Pokemon spawns hook (v1.2.0 - supports 20 slots)
export {
  useGetPokemonSpawns,
  usePokemonById,
  usePokemonBySlot,
  useActivePokemonCount,
  useActivePokemonSlots,
  type PokemonSpawn,
  type UseGetPokemonSpawnsReturn,
} from './useGetPokemonSpawns';

// Player ball inventory hook
export {
  usePlayerBallInventory,
  usePlayerBallCount,
  useHasAnyBalls,
  type UsePlayerBallInventoryReturn,
} from './usePlayerBallInventory';

// Contract events hook
export {
  useContractEvents,
  // Specialized event hooks
  useBallPurchasedEvents,
  useCaughtPokemonEvents,
  useFailedCatchEvents,
  usePokemonRelocatedEvents,
  usePokemonSpawnedEvents,
  useThrowAttemptedEvents,
  useAllGameEvents,
  // Event types
  type BallPurchasedArgs,
  type CaughtPokemonArgs,
  type FailedCatchArgs,
  type PokemonRelocatedArgs,
  type PokemonSpawnedArgs,
  type ThrowAttemptedArgs,
  type WalletUpdatedArgs,
  type RevenueSentToManagerArgs,
  type EventArgsMap,
  type TypedContractEvent,
  type UseContractEventsReturn,
  type AllGameEventsReturn,
} from './useContractEvents';

// Owner wallet hook
export { useSetOwnerWallet, type UseSetOwnerWalletReturn } from './useSetOwnerWallet';

// Treasury wallet hook
export {
  useSetTreasuryWallet,
  useSetNFTRevenueWallet,
  type UseSetTreasuryWalletReturn,
} from './useSetTreasuryWallet';

// Token approval hooks
export {
  useTokenApproval,
  useApeApproval,
  useUsdcApproval,
  useApePriceFromContract,
  getBallPriceInWei,
  calculateTotalCost,
  type TokenType,
  type UseTokenApprovalReturn,
} from './useTokenApproval';
