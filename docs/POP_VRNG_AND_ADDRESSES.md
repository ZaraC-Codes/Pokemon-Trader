# UPDATED ADDRESSES & POP VRNG Integration

## ✅ CONFIRMED ADDRESSES FOR APECHAIN MAINNET

Save to `/contracts/addresses.json`:

```json
{
  "apechain": {
    "chainId": 33139,
    "networkName": "ApeChain Mainnet"
  },
  "contracts": {
    "slabMachine": "0xC2DC75bdd0bAa476fcE8A9C628fe45a72e19C466",
    "slabNFT": "0x8a981C2cfdd7Fbc65395dD2c02ead94e9a2f65a7",
    "popVRNG": "0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1",
    "usdc": "0x...", // FIND ON APESCAN - USDC.e (6 decimals)
    "ape": "0x..."   // FIND ON APESCAN - ApeCoin (18 decimals)
  },
  "functions": {
    "slabMachine": {
      "pull": "pull(uint256 _amount, address _recipient) returns (uint256 requestId)",
      "machineConfig": "machineConfig() returns (MachineConfig struct with usdcPullPrice)"
    },
    "popVRNG": {
      "requestRandomNumberWithTraceId": "requestRandomNumberWithTraceId(uint256 traceId) returns (uint256 requestId)",
      "randomNumberCallback": "randomNumberCallback(uint256 requestId, uint256 randomNumber) external"
    }
  },
  "abiFiles": {
    "slabMachine": "./abi/SlabMachine.json",
    "slabNFT": "./abi/SlabNFT.json",
    "popVRNG": "./abi/POPVRNG.json"
  },
  "popVRNG": {
    "apiUrl": "https://vrf.proofofplay.com/v1",
    "chainId": 33139,
    "docs": "https://docs.proofofplay.com/services/vrng/about"
  }
}
```

---

## 🎰 POP VRNG Integration Overview

### What is POP VRNG?

**Proof of Play's Verified Random Number Generator** - a blockchain-native randomness oracle that provides cryptographically verifiable random numbers for smart contracts.

**Key features**:
- ✅ Verifiable randomness (players can verify it's fair)
- ✅ Fast delivery (1-2 blocks)
- ✅ On-chain callback pattern (async/await style)
- ✅ GameFi optimized (designed for games)
- ✅ Multi-chain support including ApeChain

### How It Works (Your Game Flow)

**Step 1: Player throws ball**
```solidity
function throwBall(uint256 pokemonId, uint8 ballTier) external {
    // Request random number from POP VRNG
    uint256 requestId = popVRNG.requestRandomNumberWithTraceId(
        uint256(keccak256(abi.encodePacked(msg.sender, pokemonId)))
    );
    
    // Store the request
    pendingThrows[requestId] = {
        player: msg.sender,
        pokemonId: pokemonId,
        ballTier: ballTier
    };
}
```

**Step 2: POP VRNG generates random number off-chain**
- Proof of Play generates cryptographic random number
- Signs it with their oracle signature
- Broadcasts to contract callback

**Step 3: Callback determines catch result**
```solidity
function randomNumberCallback(uint256 requestId, uint256 randomNumber) external {
    require(msg.sender == address(popVRNG)); // Only POP can call
    
    ThrowAttempt memory attempt = pendingThrows[requestId];
    
    // Use random number to determine success
    uint256 catchChance = getCatchChance(attempt.ballTier);
    bool caught = (randomNumber % 100) < catchChance;
    
    if (caught) {
        // Pull NFT from SlabMachine
        _pullNFTForWinner(attempt.player);
    } else {
        // Record failed attempt
        _recordFailedAttempt(attempt.pokemonId);
    }
}
```

---

## 🔧 Solidity Integration Pattern

### 1. Interface Definition

Create `/contracts/interfaces/IPOPVRNG.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IPOPVRNG {
    /**
     * Requests a random number from POP VRNG
     * @param traceId Optional ID for tracking
     * @return requestId The unique request identifier
     */
    function requestRandomNumberWithTraceId(uint256 traceId) 
        external 
        returns (uint256);
}

interface IPOPVRNG_Callback {
    /**
     * Callback when random number is delivered
     * @param requestId The request identifier
     * @param randomNumber The generated random number
     */
    function randomNumberCallback(uint256 requestId, uint256 randomNumber) 
        external;
}
```

### 2. Contract Integration

In your `PokeballGame.sol`:

```solidity
import "./interfaces/IPOPVRNG.sol";

contract PokeballGame is IPOPVRNG_Callback, Ownable, UUPSUpgradeable {
    IPOPVRNG public popVRNG;
    
    // Store pending requests
    mapping(uint256 => ThrowAttempt) public pendingThrows;
    
    struct ThrowAttempt {
        address player;
        uint256 pokemonId;
        uint8 ballTier;
        uint256 timestamp;
    }
    
    // Constructor/Initialize
    function initialize(address _popVRNG) public initializer {
        popVRNG = IPOPVRNG(_popVRNG);
    }
    
    // Request random number
    function throwBall(uint256 pokemonId, uint8 ballTier) external {
        // Deduct ball from player inventory
        _consumeBall(msg.sender, ballTier);
        
        // Request randomness
        uint256 requestId = popVRNG.requestRandomNumberWithTraceId(
            uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp)))
        );
        
        // Store attempt
        pendingThrows[requestId] = ThrowAttempt({
            player: msg.sender,
            pokemonId: pokemonId,
            ballTier: ballTier,
            timestamp: block.timestamp
        });
        
        emit ThrowInitiated(msg.sender, requestId, pokemonId);
    }
    
    // POP VRNG calls this with result
    function randomNumberCallback(uint256 requestId, uint256 randomNumber) 
        external 
        override 
    {
        require(msg.sender == address(popVRNG), "Only POP VRNG");
        
        ThrowAttempt memory attempt = pendingThrows[requestId];
        require(attempt.player != address(0), "Invalid request");
        
        // Determine catch based on ball tier
        uint8 catchChance = _getCatchChance(attempt.ballTier);
        bool caught = (randomNumber % 100) < catchChance;
        
        if (caught) {
            // Success! Pull NFT for winner
            _pullNFTForWinner(attempt.player);
            emit CatchSuccess(attempt.player, attempt.pokemonId);
        } else {
            // Failed attempt
            _recordFailedAttempt(attempt.pokemonId);
            emit CatchFailed(attempt.player, attempt.pokemonId);
        }
        
        delete pendingThrows[requestId];
    }
    
    // Helper: Get catch rate by ball tier
    function _getCatchChance(uint8 ballTier) internal pure returns (uint8) {
        // Poke Ball: 2%
        // Great Ball: 20%
        // Ultra Ball: 50%
        // Master Ball: 99%
        if (ballTier == 0) return 2;
        if (ballTier == 1) return 20;
        if (ballTier == 2) return 50;
        if (ballTier == 3) return 99;
        revert("Invalid ball tier");
    }
}
```

### 3. Multiple Random Numbers Per Request (Optional)

If you need multiple random numbers from one request:

```solidity
// Option A: Hash-based derivation (gas efficient)
uint256 randomNumber1 = randomNumber;
uint256 randomNumber2 = uint256(keccak256(abi.encodePacked(randomNumber)));
uint256 randomNumber3 = uint256(keccak256(abi.encodePacked(randomNumber2)));

// Option B: Bit shifting (cheaper, limited to 2x)
uint256 randomNumber1 = randomNumber >> 128;      // Upper 128 bits
uint256 randomNumber2 = randomNumber & ((1 << 128) - 1);  // Lower 128 bits

// Option C: Modulo splitting
uint256 base = randomNumber % 1000000;
uint256 derived1 = base / 10000;
uint256 derived2 = base % 10000;
```

---

## 📝 Claude Agent Solidity Prompt Update

When you give the Solidity Agent the PokeballGame task, include this addition:

```
POP VRNG Integration Details:

**Contract Address**: 0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1 (ApeChain Mainnet)

**Key Functions**:
- requestRandomNumberWithTraceId(uint256 traceId) returns (uint256 requestId)
- randomNumberCallback(uint256 requestId, uint256 randomNumber) - called by POP VRNG

**Integration Pattern**:
1. When player throws ball, call popVRNG.requestRandomNumberWithTraceId()
2. Store the requestId and throw attempt details
3. POP VRNG will call randomNumberCallback() with the result
4. Use random number to determine catch success/failure based on ball tier

**Ball Tier Catch Rates**:
- Tier 0 (Poke Ball): 2%
- Tier 1 (Great Ball): 20%
- Tier 2 (Ultra Ball): 50%
- Tier 3 (Master Ball): 99%

**Catch Logic**: Use (randomNumber % 100) < catchChance

**Important**: This is async - don't expect result immediately. UI should show "waiting for result" state until callback arrives.
```

---

## 🎯 Today's Action Items (Updated)

### Find on ApeScan (https://apescan.io):

1. ✅ **POP VRNG**: Already found: `0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1`
2. ❌ **USDC.e**: Search "USDC" - find the one with 6 decimals (not USDC.e would be wrapped)
3. ❌ **APE**: Search "APE" - ApeCoin token

### Create Files:

1. ✅ `/contracts/addresses.json` - with above 3 addresses filled in
2. ✅ `/src/types/slab.ts` - SlabMachine types
3. ✅ `/src/services/slabMachineConfig.ts` - Config helpers
4. ✅ `/docs/slab_integration.md` - Slab integration guide
5. ✨ **NEW**: `/docs/pop_vrng_integration.md` - Create this with the info above

### Create Interfaces:

1. ✅ `/contracts/interfaces/ISlab.sol` - Already done
2. ✨ **NEW**: `/contracts/interfaces/IPOPVRNG.sol` - Create with both interfaces above

---

## 🤖 Claude Agent Solidity Prompt (Updated)

When creating Agent 1, add to the system prompt:

```
**POP VRNG Integration (ApeChain Mainnet)**:
- Contract: 0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1
- Implements callback pattern: requestRandomNumberWithTraceId() → randomNumberCallback()
- Used for all catch attempts (async result delivery)
- Proves fairness to players (cryptographically verifiable)

**Catch Rate Formula**:
function getCatchChance(uint8 ballTier) returns (uint8) {
  // Returns percentage: 2, 20, 50, or 99
  // Use: (randomNumber % 100) < catchChance
}
```

---

## ✅ What's Confirmed Now

| Component | Address | Status |
|-----------|---------|--------|
| SlabMachine | 0xC2DC75bdd0bAa476fcE8A9C628fe45a72e19C466 | ✅ Confirmed |
| Slab NFT Collection | 0x8a981C2cfdd7Fbc65395dD2c02ead94e9a2f65a7 | ✅ Confirmed |
| POP VRNG | 0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1 | ✅ Confirmed |
| USDC.e | 0x... | ❌ Need to find |
| APE Token | 0x... | ❌ Need to find |

---

## 🚀 Next Steps

1. **Today**: Find USDC.e and APE on ApeScan, fill in addresses.json
2. **Today**: Create IPOPVRNG.sol interface
3. **Today**: Create pop_vrng_integration.md documentation
4. **Tomorrow**: Create 3 Claude Agents with updated system prompts
5. **Wed-Fri**: Execute tasks with full context on all 3 integrations

You're ready! 🎮
