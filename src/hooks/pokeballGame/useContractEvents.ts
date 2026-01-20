/**
 * useContractEvents Hook
 *
 * Hook for subscribing to PokeballGame contract events.
 * Accumulates events into a local state array for the current session.
 *
 * Usage:
 * ```tsx
 * // Subscribe to BallPurchased events
 * const {
 *   events,
 *   isLoading,
 *   clearEvents,
 * } = useContractEvents('BallPurchased');
 *
 * // Display purchase history
 * {events.map((event, i) => (
 *   <div key={i}>
 *     Purchased {event.args.quantity} balls of type {event.args.ballType}
 *   </div>
 * ))}
 *
 * // Subscribe to catch results
 * const catches = useContractEvents('CaughtPokemon');
 * const failures = useContractEvents('FailedCatch');
 *
 * // Combined event listener for all game events
 * const allEvents = useAllGameEvents();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useWatchContractEvent } from 'wagmi';
import type { Log } from 'viem';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
  usePokeballGameAddress,
  type PokeballGameEventName,
} from './pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Typed event args for each event type.
 */
export interface BallPurchasedArgs {
  buyer: `0x${string}`;
  ballType: number;
  quantity: bigint;
  usedAPE: boolean;
}

export interface CaughtPokemonArgs {
  catcher: `0x${string}`;
  pokemonId: bigint;
  nftTokenId: bigint;
}

export interface FailedCatchArgs {
  thrower: `0x${string}`;
  pokemonId: bigint;
  attemptsRemaining: number;
}

export interface PokemonRelocatedArgs {
  pokemonId: bigint;
  newX: bigint;
  newY: bigint;
}

export interface PokemonSpawnedArgs {
  pokemonId: bigint;
  positionX: bigint;
  positionY: bigint;
  slotIndex: number;
}

export interface ThrowAttemptedArgs {
  thrower: `0x${string}`;
  pokemonId: bigint;
  ballTier: number;
  requestId: bigint;
}

export interface WalletUpdatedArgs {
  walletType: string;
  oldAddress: `0x${string}`;
  newAddress: `0x${string}`;
}

export interface RevenueSentToManagerArgs {
  amount: bigint;
}

/**
 * Map of event names to their typed args.
 */
export type EventArgsMap = {
  BallPurchased: BallPurchasedArgs;
  CaughtPokemon: CaughtPokemonArgs;
  FailedCatch: FailedCatchArgs;
  PokemonRelocated: PokemonRelocatedArgs;
  PokemonSpawned: PokemonSpawnedArgs;
  ThrowAttempted: ThrowAttemptedArgs;
  WalletUpdated: WalletUpdatedArgs;
  RevenueSentToManager: RevenueSentToManagerArgs;
};

/**
 * Typed event with parsed args.
 */
export interface TypedContractEvent<T extends PokeballGameEventName> extends Log {
  eventName: T;
  args: EventArgsMap[T];
}

export interface UseContractEventsReturn<T extends PokeballGameEventName> {
  /**
   * Array of accumulated events for this session.
   */
  events: readonly TypedContractEvent<T>[];

  /**
   * Whether the subscription is active.
   */
  isLoading: boolean;

  /**
   * Clear all accumulated events.
   */
  clearEvents: () => void;

  /**
   * Number of events received.
   */
  eventCount: number;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook for subscribing to a specific PokeballGame contract event.
 *
 * @param eventName - The event name to subscribe to
 * @param onEvent - Optional callback for each new event
 * @returns Object with events array, loading state, and clear function
 */
export function useContractEvents<T extends PokeballGameEventName>(
  eventName: T,
  onEvent?: (event: TypedContractEvent<T>) => void
): UseContractEventsReturn<T> {
  const { isConfigured } = usePokeballGameAddress();
  const [events, setEvents] = useState<TypedContractEvent<T>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Watch for contract events
  useWatchContractEvent({
    address: POKEBALL_GAME_ADDRESS,
    abi: POKEBALL_GAME_ABI,
    eventName,
    chainId: POKEBALL_GAME_CHAIN_ID,
    onLogs: (logs) => {
      setIsLoading(false);

      for (const log of logs) {
        const typedEvent = log as TypedContractEvent<T>;
        typedEvent.eventName = eventName;

        console.log(`[useContractEvents] ${eventName} event:`, typedEvent);

        // Add to accumulated events
        setEvents((prev) => [...prev, typedEvent]);

        // Call optional callback
        if (onEvent) {
          onEvent(typedEvent);
        }
      }
    },
    enabled: isConfigured,
  });

  // Set loading to false after initial subscription
  useEffect(() => {
    if (isConfigured) {
      // Give a short delay for subscription to establish
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isConfigured]);

  // Clear events function
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Return safe defaults if contract not configured
  if (!isConfigured) {
    return {
      events: [],
      isLoading: false,
      clearEvents: () => {},
      eventCount: 0,
    };
  }

  return {
    events,
    isLoading,
    clearEvents,
    eventCount: events.length,
  };
}

// ============================================================
// SPECIALIZED EVENT HOOKS
// ============================================================

/**
 * Hook specifically for ball purchase events.
 */
export function useBallPurchasedEvents(
  onPurchase?: (event: TypedContractEvent<'BallPurchased'>) => void
) {
  return useContractEvents('BallPurchased', onPurchase);
}

/**
 * Hook specifically for successful catch events.
 */
export function useCaughtPokemonEvents(
  onCatch?: (event: TypedContractEvent<'CaughtPokemon'>) => void
) {
  return useContractEvents('CaughtPokemon', onCatch);
}

/**
 * Hook specifically for failed catch events.
 */
export function useFailedCatchEvents(
  onFail?: (event: TypedContractEvent<'FailedCatch'>) => void
) {
  return useContractEvents('FailedCatch', onFail);
}

/**
 * Hook specifically for Pokemon relocation events.
 */
export function usePokemonRelocatedEvents(
  onRelocate?: (event: TypedContractEvent<'PokemonRelocated'>) => void
) {
  return useContractEvents('PokemonRelocated', onRelocate);
}

/**
 * Hook specifically for Pokemon spawn events.
 */
export function usePokemonSpawnedEvents(
  onSpawn?: (event: TypedContractEvent<'PokemonSpawned'>) => void
) {
  return useContractEvents('PokemonSpawned', onSpawn);
}

/**
 * Hook specifically for throw attempt events.
 */
export function useThrowAttemptedEvents(
  onThrow?: (event: TypedContractEvent<'ThrowAttempted'>) => void
) {
  return useContractEvents('ThrowAttempted', onThrow);
}

// ============================================================
// COMBINED EVENT HOOK
// ============================================================

export interface AllGameEventsReturn {
  ballPurchases: readonly TypedContractEvent<'BallPurchased'>[];
  catches: readonly TypedContractEvent<'CaughtPokemon'>[];
  failures: readonly TypedContractEvent<'FailedCatch'>[];
  relocations: readonly TypedContractEvent<'PokemonRelocated'>[];
  spawns: readonly TypedContractEvent<'PokemonSpawned'>[];
  throws: readonly TypedContractEvent<'ThrowAttempted'>[];
  clearAll: () => void;
}

/**
 * Hook that subscribes to all game-relevant events.
 * Useful for a comprehensive game event log.
 */
export function useAllGameEvents(): AllGameEventsReturn {
  const ballPurchases = useContractEvents('BallPurchased');
  const catches = useContractEvents('CaughtPokemon');
  const failures = useContractEvents('FailedCatch');
  const relocations = useContractEvents('PokemonRelocated');
  const spawns = useContractEvents('PokemonSpawned');
  const throws = useContractEvents('ThrowAttempted');

  const clearAll = useCallback(() => {
    ballPurchases.clearEvents();
    catches.clearEvents();
    failures.clearEvents();
    relocations.clearEvents();
    spawns.clearEvents();
    throws.clearEvents();
  }, [ballPurchases, catches, failures, relocations, spawns, throws]);

  return {
    ballPurchases: ballPurchases.events,
    catches: catches.events,
    failures: failures.events,
    relocations: relocations.events,
    spawns: spawns.events,
    throws: throws.events,
    clearAll,
  };
}

export default useContractEvents;
