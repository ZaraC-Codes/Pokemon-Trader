# POP VRNG Integration Guide

## What is POP VRNG?

Proof of Play's Verified Random Number Generator (VRNG) is a blockchain-native randomness oracle that provides cryptographically verifiable random numbers for smart contracts.

**Key Features:**
- Verifiable randomness (players can verify fairness on-chain)
- Fast delivery (1-2 blocks on ApeChain)
- On-chain callback pattern (async request/response)
- GameFi optimized (designed for games)
- Multi-chain support including ApeChain

**Contract Address (ApeChain Mainnet):** `0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1`

## How It Works in PokeballGame

### Overview

The PokeballGame contract uses POP VRNG for two purposes:
1. **Catch Determination** - Fair, verifiable catch success/failure
2. **Pokemon Positioning** - Random spawn/relocation coordinates

### Request Flow

```
Player/Owner Action → VRNG Request → Off-chain Generation → On-chain Callback
```

### 1. Ball Throw Flow

When a player throws a ball at a Pokemon:

```solidity
function throwBall(uint8 pokemonSlot, uint8 ballType) external returns (uint256 requestId) {
    // Validate and deduct ball from inventory
    playerBalls[msg.sender][ball] -= 1;

    // Generate unique trace ID for verification
    uint256 traceId = _generateTraceId(msg.sender, pokemon.id, ballType);

    // Request random number from VRNG
    requestId = vrng.requestRandomNumberWithTraceId(traceId);

    // Store pending throw details
    pendingThrows[requestId] = PendingThrow({
        thrower: msg.sender,
        pokemonId: pokemon.id,
        ballType: ball,
        timestamp: block.timestamp,
        resolved: false
    });

    emit ThrowAttempted(msg.sender, pokemon.id, ballType, requestId);
}
```

### 2. Pokemon Spawn Flow

When the owner spawns a Pokemon:

```solidity
function spawnPokemon(uint8 slot) external onlyOwner {
    uint256 pokemonId = nextPokemonId++;
    uint256 traceId = _generateTraceId(address(this), pokemonId, 255); // 255 = spawn action

    // Request random position from VRNG
    uint256 requestId = vrng.requestRandomNumberWithTraceId(traceId);

    // Store spawn request (thrower = address(this) indicates spawn)
    pendingThrows[requestId] = PendingThrow({
        thrower: address(this),
        pokemonId: pokemonId,
        ballType: BallType(slot), // Slot stored in ballType field
        timestamp: block.timestamp,
        resolved: false
    });
}
```

### 3. VRNG Callback

POP VRNG calls back with the random number:

```solidity
function randomNumberCallback(uint256 requestId, uint256 randomNumber) external onlyVRNG {
    PendingThrow storage pendingThrow = pendingThrows[requestId];

    if (pendingThrow.thrower == address(0)) revert ThrowNotFound(requestId);
    if (pendingThrow.resolved) revert ThrowAlreadyResolved(requestId);

    pendingThrow.resolved = true;

    // Check if this is a spawn request (thrower == address(this))
    if (pendingThrow.thrower == address(this)) {
        _handleSpawnCallback(pendingThrow, randomNumber);
        return;
    }

    // Otherwise, this is a throw attempt
    _handleThrowCallback(pendingThrow, randomNumber);
}
```

### 4. Catch Determination

For throw attempts, the random number determines success:

```solidity
function _handleThrowCallback(PendingThrow storage pendingThrow, uint256 randomNumber) internal {
    // Find the Pokemon slot
    (bool found, uint8 slot) = _findPokemonSlot(pendingThrow.pokemonId);

    if (!found || !activePokemons[slot].isActive) return;

    Pokemon storage pokemon = activePokemons[slot];

    // Determine catch success using VRNG
    uint8 catchRate = getCatchRate(pendingThrow.ballType);
    uint256 roll = randomNumber % 100;
    bool caught = roll < catchRate;

    if (caught) {
        _handleSuccessfulCatch(pendingThrow.thrower, pokemon, slot);
    } else {
        _handleFailedCatch(pendingThrow.thrower, pokemon, slot, randomNumber);
    }
}
```

### 5. Position Calculation

For spawn/respawn requests, the random number determines position:

```solidity
function _handleSpawnCallback(PendingThrow storage pendingThrow, uint256 randomNumber) internal {
    uint8 slot = uint8(pendingThrow.ballType);

    if (slot >= MAX_ACTIVE_POKEMON) return;
    if (activePokemons[slot].isActive) return;

    // Calculate random position from VRNG (0-999 range)
    uint256 posX = randomNumber % (MAX_COORDINATE + 1);
    uint256 posY = (randomNumber >> 128) % (MAX_COORDINATE + 1);

    activePokemons[slot] = Pokemon({
        id: pendingThrow.pokemonId,
        positionX: posX,
        positionY: posY,
        throwAttempts: 0,
        isActive: true,
        spawnTime: block.timestamp
    });

    emit PokemonSpawned(pendingThrow.pokemonId, posX, posY, slot);
}
```

## Ball Catch Rates

| Ball Type | Catch Rate | Price |
|-----------|------------|-------|
| Poke Ball | 2% | $1.00 |
| Great Ball | 20% | $10.00 |
| Ultra Ball | 50% | $25.00 |
| Master Ball | 99% | $49.90 |

## VRNG Interface

```solidity
interface IPOPVRNG {
    function requestRandomNumberWithTraceId(uint256 traceId) external returns (uint256 requestId);
}

interface IPOPVRNG_Callback {
    function randomNumberCallback(uint256 requestId, uint256 randomNumber) external;
}
```

## Security Considerations

### Access Control
- Only the VRNG contract can call `randomNumberCallback` (`onlyVRNG` modifier)
- Prevents manipulation of catch outcomes

### Request Validation
- Each request has a unique trace ID
- Pending throws are tracked by request ID
- Duplicate callbacks are rejected (`ThrowAlreadyResolved`)

### Timing Protection
- Timestamps are stored with pending throws
- Can be used for timeout/expiration logic if needed

## Frontend Integration

### Listening for Events

```typescript
// Watch for throw attempts
useCaughtPokemonEvents(); // Successful catches
useFailedCatchEvents();   // Failed attempts
usePokemonRelocatedEvents(); // Pokemon moved after 3 failures
usePokemonSpawnedEvents(); // New Pokemon appeared
```

### Handling Async Flow

Since VRNG is async (1-2 blocks), the UI should:

1. **On throwBall()**: Show "Throwing..." state
2. **Wait for callback**: Poll for `ThrowAttempted` event
3. **On CaughtPokemon/FailedCatch**: Show result modal

```typescript
// Example flow
const { write: throwBall, isPending } = useThrowBall();

// Initiate throw
throwBall(pokemonSlot, ballType);

// Listen for result events
const { events: catches } = useCaughtPokemonEvents();
const { events: failures } = useFailedCatchEvents();
```

## Testing

For local testing without the real VRNG:

1. Use `forceSpawnPokemon(slot, posX, posY)` for deterministic spawns
2. Mock VRNG contract that calls back immediately
3. Test with various random number values to verify catch rate logic

## Gas Considerations

- VRNG request: ~50,000 gas
- Callback (catch): ~100,000-150,000 gas
- Callback (spawn): ~80,000-100,000 gas
- NFT award adds ~50,000 gas if SlabNFTManager has inventory

## Troubleshooting

### Throw Not Resolving
- Check if VRNG contract is properly set
- Verify request ID exists in `pendingThrows`
- Ensure VRNG callback is being triggered

### Pokemon Not Spawning
- Verify slot is not occupied
- Check if callback was received
- Ensure VRNG address is correct

### Invalid Catch Rate
- Verify ball type is valid (0-3)
- Check `getCatchRate()` returns expected value
