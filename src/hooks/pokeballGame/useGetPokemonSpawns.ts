/**
 * useGetPokemonSpawns Hook
 *
 * Hook for reading the current active Pokemon spawns from the PokeballGame contract.
 * Returns up to 3 Pokemon that players can attempt to catch.
 *
 * Usage:
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   error,
 *   refetch,
 * } = useGetPokemonSpawns();
 *
 * // Display active Pokemon
 * {data?.map((pokemon) => (
 *   <div key={pokemon.id.toString()}>
 *     Pokemon #{pokemon.id.toString()} at ({pokemon.x}, {pokemon.y})
 *     Attempts: {pokemon.attemptCount}/3
 *   </div>
 * ))}
 *
 * // Refresh spawns after a catch attempt
 * const handleCatch = async () => {
 *   await throwBall();
 *   refetch();
 * };
 * ```
 */

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import {
  POKEBALL_GAME_ADDRESS,
  POKEBALL_GAME_ABI,
  POKEBALL_GAME_CHAIN_ID,
  usePokeballGameAddress,
} from './pokeballGameConfig';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Parsed Pokemon spawn data for UI consumption.
 */
export interface PokemonSpawn {
  /** Unique Pokemon ID from contract */
  id: bigint;
  /** X coordinate in game world (pixels) */
  x: number;
  /** Y coordinate in game world (pixels) */
  y: number;
  /** Number of throw attempts made (0-3) */
  attemptCount: number;
  /** Whether this spawn slot is currently active */
  isActive: boolean;
  /** Spawn timestamp (Unix seconds) */
  spawnTime: bigint;
  /** Slot index in the contract (0-2) */
  slotIndex: number;
}

export interface UseGetPokemonSpawnsReturn {
  /**
   * Array of active Pokemon spawns (only includes isActive=true).
   * Empty array if no spawns or contract not configured.
   */
  data: PokemonSpawn[] | undefined;

  /**
   * All spawn slots (including inactive).
   * Useful for debugging or showing all slots.
   */
  allSlots: PokemonSpawn[] | undefined;

  /**
   * Whether the data is currently loading.
   */
  isLoading: boolean;

  /**
   * Error from the contract read, if any.
   */
  error: Error | undefined;

  /**
   * Function to manually refetch spawn data.
   */
  refetch: () => void;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook for reading active Pokemon spawns from the contract.
 *
 * @returns Object with spawn data, loading state, error, and refetch function
 */
export function useGetPokemonSpawns(): UseGetPokemonSpawnsReturn {
  const { isConfigured } = usePokeballGameAddress();

  // Read all active Pokemon from contract
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: POKEBALL_GAME_ADDRESS,
    abi: POKEBALL_GAME_ABI,
    functionName: 'getAllActivePokemons',
    chainId: POKEBALL_GAME_CHAIN_ID,
    query: {
      enabled: isConfigured,
      // Poll every 5 seconds for spawn updates
      refetchInterval: 5000,
    },
  });

  // Parse and transform the raw contract data
  const { allSlots, activeSpawns } = useMemo(() => {
    if (!rawData) {
      return { allSlots: undefined, activeSpawns: undefined };
    }

    // rawData is a tuple array of Pokemon structs
    const pokemons = rawData as readonly {
      id: bigint;
      positionX: bigint;
      positionY: bigint;
      throwAttempts: number;
      isActive: boolean;
      spawnTime: bigint;
    }[];

    const all: PokemonSpawn[] = pokemons.map((pokemon, index) => ({
      id: pokemon.id,
      x: Number(pokemon.positionX),
      y: Number(pokemon.positionY),
      attemptCount: pokemon.throwAttempts,
      isActive: pokemon.isActive,
      spawnTime: pokemon.spawnTime,
      slotIndex: index,
    }));

    const active = all.filter((pokemon) => pokemon.isActive);

    return { allSlots: all, activeSpawns: active };
  }, [rawData]);

  // Return safe defaults if contract not configured
  if (!isConfigured) {
    return {
      data: undefined,
      allSlots: undefined,
      isLoading: false,
      error: undefined,
      refetch: () => {},
    };
  }

  return {
    data: activeSpawns,
    allSlots,
    isLoading,
    error: error as Error | undefined,
    refetch,
  };
}

/**
 * Hook to get a specific Pokemon by its ID.
 *
 * @param pokemonId - The Pokemon ID to find
 * @returns The Pokemon spawn data or undefined if not found
 */
export function usePokemonById(pokemonId: bigint | undefined): PokemonSpawn | undefined {
  const { data } = useGetPokemonSpawns();

  return useMemo(() => {
    if (!data || pokemonId === undefined) {
      return undefined;
    }
    return data.find((pokemon) => pokemon.id === pokemonId);
  }, [data, pokemonId]);
}

/**
 * Hook to get a Pokemon by its slot index.
 *
 * @param slotIndex - The slot index (0-2)
 * @returns The Pokemon spawn data or undefined if slot is empty
 */
export function usePokemonBySlot(slotIndex: number): PokemonSpawn | undefined {
  const { allSlots } = useGetPokemonSpawns();

  return useMemo(() => {
    if (!allSlots || slotIndex < 0 || slotIndex > 2) {
      return undefined;
    }
    const pokemon = allSlots[slotIndex];
    return pokemon?.isActive ? pokemon : undefined;
  }, [allSlots, slotIndex]);
}

export default useGetPokemonSpawns;
