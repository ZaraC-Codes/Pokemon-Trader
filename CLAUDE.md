# CLAUDE.md - Pokemon Trader

## Project Overview

Pokemon Trader is a 2D pixel art game built on ApeChain that integrates Web3 functionality. Users can explore a Pokemon-style game world, interact with NPCs, view OTC marketplace trade listings as in-game icons, manage NFT inventory, and participate in NFT transactions.

- **Version**: 0.0.1
- **Status**: Active development
- **Network**: ApeChain Mainnet (Chain ID: 33139)

## Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **TypeScript 5.2.2** - Type-safe JavaScript
- **Phaser.js 3.80.1** - 2D game engine
- **Vite 6.4.1** - Build tool and dev server

### Web3
- **Wagmi 2.5.0** - Ethereum hooks
- **Viem 2.5.0** - Low-level Ethereum library
- **RainbowKit 2.0.0** - Wallet connection UI
- **TanStack Query 5.17.0** - Server state management
- **ThirdWeb SDK v5** - Crypto checkout/payment widgets

### Smart Contracts
- **Hardhat 2.28.x** - Solidity development framework
- **OpenZeppelin Contracts 5.x** - Secure contract libraries
- **OpenZeppelin Upgradeable** - UUPS proxy pattern
- **Solidity 0.8.26** - Smart contract language

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build

# Smart Contract Commands
npx hardhat compile  # Compile Solidity contracts
npx hardhat test     # Run contract tests
npx hardhat run contracts/deployment/deployProxies.cjs --network apechain  # Deploy both contracts
npx hardhat run scripts/spawnInitialPokemon.cjs --network apechain  # Spawn 3 initial Pokemon
```

## Project Structure

```
├── src/                     # Main source code
│   ├── components/              # React UI components
│   │   ├── GameCanvas.tsx           # Phaser game wrapper
│   │   ├── WalletConnector.tsx      # Wallet connection
│   │   ├── TradeModal.tsx           # Trade listing details
│   │   ├── InventoryTerminal.tsx    # NFT inventory UI
│   │   ├── VolumeToggle.tsx         # Music volume control
│   │   ├── BikeRentalModal.tsx      # Bike rental UI (2x speed boost)
│   │   ├── BallShop.tsx             # Ball purchase UI (legacy)
│   │   ├── PokeBallShop/            # PokeBall shop components
│   │   │   ├── index.ts                 # Barrel export
│   │   │   ├── PokeBallShop.tsx         # Shop modal (buy balls)
│   │   │   └── GameHUD.tsx              # HUD overlay (inventory + shop button)
│   │   ├── CatchAttemptModal/       # Pokemon catching modal
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── CatchAttemptModal.tsx    # Ball selection + throw UI
│   │   └── CatchResultModal/        # Catch result feedback modal
│   │       ├── index.ts                 # Barrel export
│   │       └── CatchResultModal.tsx     # Success/failure UI + animations
│   │
│   ├── game/                    # Phaser game code
│   │   ├── scenes/
│   │   │   └── GameScene.ts         # Main game scene
│   │   ├── entities/                # Game objects
│   │   │   ├── Player.ts            # Player character
│   │   │   ├── NPC.ts               # Generic NPC
│   │   │   ├── Pokemon.ts           # Wild Pokemon entity (PokeballGame)
│   │   │   ├── GrassRustle.ts       # Grass rustle effect (follows Pokemon)
│   │   │   ├── DialogBubble.ts      # Dialog display
│   │   │   ├── TradeIcon.ts         # OTC listing icon
│   │   │   ├── Building.ts          # Generic building
│   │   │   ├── House.ts             # House entity
│   │   │   ├── Tree.ts, Bush.ts, Rock.ts  # Terrain features
│   │   │   ├── BikeShop.ts          # Interactive bike shop
│   │   │   ├── BikeShopOwner.ts     # Bike shop NPC
│   │   │   └── TradingOutpost.ts    # Trading building
│   │   ├── managers/                # MapManager, NPCManager, TradeIconManager, PokemonSpawnManager, BallInventoryManager, CatchMechanicsManager
│   │   ├── utils/                   # Music utilities (chiptune, mp3)
│   │   └── config/                  # Game configuration
│   │
│   ├── services/                # Web3 services
│   │   ├── apechainConfig.ts        # Network & wallet config
│   │   ├── contractService.ts       # Contract interactions
│   │   ├── config.ts                # Contract configs & ABIs (tokenContractConfig, swapContractConfig, nftUtils)
│   │   ├── thirdwebConfig.ts        # ThirdWeb SDK v5 config (Pay/Checkout)
│   │   └── types.ts                 # Type definitions
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useAllListings.tsx       # Fetch OTC listings
│   │   ├── useManageListing.tsx     # Claim listings
│   │   ├── useApprove.tsx           # Token approvals
│   │   ├── useActiveWeb3React.tsx   # Core Web3 context
│   │   ├── useBridgeListing.tsx     # Cross-chain bridge
│   │   ├── useLMBuyPositions.tsx    # Liquidity manager positions
│   │   ├── useMysteryBox.ts         # Mystery box contract
│   │   ├── usePokeballGame.ts       # PokeballGame contract integration (legacy)
│   │   ├── useTokenBalance.ts       # Token balance queries (generic)
│   │   ├── useTokenBalances.ts      # APE/USDC.e balance hooks
│   │   ├── useNFTExists.tsx         # NFT existence check
│   │   ├── useAllNftPositions.tsx   # All NFT positions
│   │   ├── useNFTBalances/          # NFT balance queries (IPFS, LM, NFT)
│   │   └── pokeballGame/            # PokeballGame Wagmi hooks (modular)
│   │       ├── index.ts                 # Barrel export
│   │       ├── pokeballGameConfig.ts    # Shared config, ABI, types
│   │       ├── usePurchaseBalls.ts      # Buy balls (APE/USDC.e)
│   │       ├── useThrowBall.ts          # Throw ball at Pokemon
│   │       ├── useGetPokemonSpawns.ts   # Read active spawns
│   │       ├── usePlayerBallInventory.ts # Read player inventory
│   │       ├── useContractEvents.ts     # Event subscriptions
│   │       ├── useSetOwnerWallet.ts     # Transfer ownership (owner)
│   │       └── useSetTreasuryWallet.ts  # Update treasury (owner)
│   │
│   ├── config/                  # Static configuration
│   │   ├── knownListings.ts         # Pre-identified listing IDs
│   │   └── abis/                    # Contract ABIs (erc721M.ts)
│   │
│   ├── utils/                   # Utility functions
│   └── utilities/               # Common helpers
│
├── contracts/               # Smart contract files
│   ├── PokeballGame.sol         # Main game contract v1.1.0 (UUPS)
│   ├── SlabNFTManager.sol       # NFT inventory manager (UUPS)
│   ├── interfaces/
│   │   └── IPOPVRNG.sol         # POP VRNG interface (randomness)
│   ├── abi/
│   │   ├── abi_PokeballGame.json    # PokeballGame ABI v1.1.0
│   │   └── abi_SlabNFTManager.json  # SlabNFTManager ABI
│   ├── deployment/
│   │   ├── deployProxies.cjs        # Unified proxy deployment (both contracts)
│   │   ├── deploy_PokeballGame.js   # PokeballGame standalone deployment
│   │   ├── deploy_SlabNFTManager.js # SlabNFTManager standalone deployment
│   │   └── upgrade_PokeballGame.js  # UUPS upgrade example script
│   ├── addresses.json           # Contract addresses & token config
│   └── wallets.json             # Wallet configuration
│
├── docs/                    # Project documentation
│   ├── README_DOCUMENTATION.md  # Documentation index
│   ├── EXECUTIVE_SUMMARY.md     # Project summary
│   ├── implementation_plan.md   # Development roadmap
│   ├── pop_vrng_integration.md  # POP VRNG integration guide
│   ├── WALLET_CONFIG.md         # Wallet setup guide
│   ├── UUPS_UPGRADE_GUIDE.md    # UUPS proxy upgrade documentation
│   ├── SETUP_POKEBALL_GAME.md   # PokeballGame integration setup guide
│   └── claude_agents.md         # Claude agent integration
│
├── scripts/                 # Hardhat scripts
│   └── spawnInitialPokemon.cjs  # Spawn 3 initial Pokemon on-chain
│
└── [root files]
    ├── abi.json                 # OTC Marketplace ABI
    ├── abi_SlabMachine.json     # Slab Machine ABI
    └── hardhat.config.cjs       # Hardhat configuration
```

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component with Web3 providers |
| `src/game/scenes/GameScene.ts` | Main game logic and rendering |
| `src/services/apechainConfig.ts` | ApeChain network configuration |
| `src/services/pokeballGameConfig.ts` | Centralized PokeballGame on-chain config |
| `src/services/thirdwebConfig.ts` | ThirdWeb SDK v5 client & chain config |
| `src/services/contractService.ts` | Contract interaction layer |
| `src/hooks/useAllListings.tsx` | Core hook for fetching listings |
| `contracts/addresses.json` | All contract addresses and token config |
| `contracts/wallets.json` | Wallet configuration (owner, treasury, NFT revenue) |
| `contracts/PokeballGame.sol` | Main game smart contract v1.1.0 |
| `contracts/SlabNFTManager.sol` | NFT inventory and auto-purchase manager |
| `contracts/abi/abi_PokeballGame.json` | PokeballGame ABI v1.1.0 for frontend |
| `contracts/abi/abi_SlabNFTManager.json` | SlabNFTManager ABI for frontend |
| `contracts/deployment/deployProxies.cjs` | Unified deployment script for both proxies |
| `contracts/deployment/upgrade_PokeballGame.js` | UUPS upgrade example script |
| `scripts/spawnInitialPokemon.cjs` | Spawn 3 initial Pokemon on-chain |
| `abi_SlabMachine.json` | Slab Machine contract ABI |
| `hardhat.config.cjs` | Hardhat compilation and deployment config |
| `docs/UUPS_UPGRADE_GUIDE.md` | UUPS proxy upgrade documentation |

## Architecture Patterns

### React
- Functional components with hooks
- TanStack Query for server state caching
- Provider pattern: Wagmi → RainbowKit → QueryClient

### Phaser Game
- **Manager Pattern**: MapManager, NPCManager, TradeIconManager
- **Entity Pattern**: Classes extending `Phaser.GameObjects.Sprite`
- **Scene Lifecycle**: preload → create → update

### Web3
- Service layer abstracts blockchain calls
- Hooks expose contract functionality
- Centralized config for addresses and ABIs

## Contract Addresses (ApeChain Mainnet)

| Contract | Address |
|----------|---------|
| **PokeballGame (Proxy)** | `0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f` |
| **SlabNFTManager (Proxy)** | `0xbbdfa19f9719f9d9348F494E07E0baB96A85AA71` |
| **OTC Marketplace** | `0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf` |
| **Slab NFT / Pokemon Cards** | `0x8a981C2cfdd7Fbc65395dD2c02ead94e9a2f65a7` |
| **Slab Machine** | `0xC2DC75bdd0bAa476fcE8A9C628fe45a72e19C466` |
| **POP VRNG** | `0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1` |
| **USDC.e** | `0xF1815bd50389c46847f0Bda824eC8da914045D14` |
| **APE** | `0x4d224452801aced8b2f0aebe155379bb5d594381` |

### Wallet Addresses

| Role | Address |
|------|---------|
| **Owner** | `0x47c11427B9f0DF4e8bdB674f5e23C8E994befC06` |
| **Treasury** | `0x1D1d0E6eF415f2BAe0c21939c50Bc4ffBeb65c74` |
| **NFT Revenue** | `0x628376239B6ccb6F21d0a6E4196a18F98F86bd48` |

See `contracts/addresses.json` and `contracts/wallets.json` for full configuration.

## Coding Conventions

### TypeScript
- Strict mode enabled
- Interfaces for all props and state
- Avoid `any` type (use `unknown` instead)

### React
- Functional components only
- Custom hooks for logic extraction
- Use `useCallback` and `useRef` for optimization

### Styling
- Inline pixel art styles with `imageRendering: 'pixelated'`
- Monospace fonts (`'Courier New', monospace`)
- Dark color scheme (#000, #2a2a2a)

## Debug Utilities

Browser console functions available after app mount:
```javascript
window.testListings()              // Verify listing fetching
window.testContractConnection()    // Check contract accessibility
window.checkListing(id)            // Inspect specific listing
window.getListingsRange(start, max) // Batch listing check
```

## Development Notes

### Rate Limiting
- Batch queries (10 listings per batch) to avoid 429 errors
- Exponential backoff with 200ms delays and 3 retries

### CORS Proxy
Dev server proxies RPC calls via `/api/rpc` to Alchemy endpoint

### Caching
- NFT data cached 30 seconds with React Query
- Listings have 5-minute stale time

## External Services

- **Alchemy**: RPC endpoint and NFT API v3
- **Apescan**: Block explorer and ABI fetching
- **Magic Eden**: Pokemon card collection viewing

## Common Tasks

### Add a React Component
1. Create file in `src/components/`
2. Export as default
3. Import in `App.tsx`

### Add a Game Entity
1. Create class extending `Phaser.GameObjects.Sprite` in `src/game/entities/`
2. Instantiate in `GameScene.create()`

### Add a Hook
1. Create in `src/hooks/`
2. Use Wagmi hooks for contract interactions
3. Export React hook function

### Modify Contract ABI
Update `src/services/config.ts` or add to `src/config/abis/`

### Add Contract Configuration
1. Add address to `contracts/addresses.json`
2. Add ABI to root (`abi_*.json`) or `src/config/abis/`
3. Create service functions in `src/services/contractService.ts`

## New Features

### ThirdWeb Checkout Integration
Buy crypto directly in the PokeBall Shop using ThirdWeb Pay:

**Location:** `src/services/thirdwebConfig.ts`, `src/components/PokeBallShop/PokeBallShop.tsx`

**Features:**
- Buy USDC.e or APE on ApeChain with card, bank, or other tokens
- Integrated into PokeBallShop as "NEED CRYPTO?" section
- Uses ThirdWeb SDK v5 PayEmbed component
- Graceful degradation if not configured

**Setup:**
1. Get a free client ID at https://thirdweb.com/create-api-key
2. Add `VITE_THIRDWEB_CLIENT_ID=your_client_id` to `.env`

**Usage:**
```typescript
import { thirdwebClient, apechain, isThirdwebConfigured } from './services/thirdwebConfig';

// Check if configured
if (isThirdwebConfigured()) {
  // Use PayEmbed component for crypto purchases
}
```

**Token Addresses (exported from thirdwebConfig):**
- `APECHAIN_TOKENS.USDC` - USDC.e on ApeChain
- `APECHAIN_TOKENS.APE` - Native APE (undefined for native token)

### Bike Rental System
- `BikeRentalModal.tsx` - UI for renting bikes
- `BikeShop.ts` / `BikeShopOwner.ts` - In-game bike shop
- Provides 2x movement speed boost

### POP VRNG Integration
On-chain verifiable randomness for fair catch mechanics and Pokemon positioning:

**Contract Address:** `0x9eC728Fce50c77e0BeF7d34F1ab28a46409b7aF1`

**Used For:**
1. **Catch Determination** - Fair success/failure via `randomNumber % 100 < catchRate`
2. **Pokemon Positioning** - Random spawn/relocation coordinates

**Request Flow:**
```
throwBall() → vrng.requestRandomNumberWithTraceId() → 1-2 blocks → randomNumberCallback()
```

**Callback Handler:**
- Detects request type via `pendingThrow.thrower`
- `thrower == address(this)` → Spawn/respawn request → `_handleSpawnCallback()`
- `thrower == player address` → Throw attempt → `_handleThrowCallback()`

**Key Functions:**
- `_handleSpawnCallback()` - Creates Pokemon at random position
- `_handleThrowCallback()` - Determines catch success, awards NFT if caught

**Interface:** `contracts/interfaces/IPOPVRNG.sol`
- `requestRandomNumberWithTraceId(uint256 traceId)` - Request random number
- `randomNumberCallback(uint256 requestId, uint256 randomNumber)` - VRNG calls back

See `docs/pop_vrng_integration.md` for complete implementation details

### Slab Machine
- New contract for NFT/token interactions
- ABI at `abi_SlabMachine.json`
- Address: `0xC2DC75bdd0bAa476fcE8A9C628fe45a72e19C466`

### PokeballGame Contract (v1.1.0)
Pokemon catching mini-game with provably fair mechanics:

**Ball System:**
| Ball Type | Price | Catch Rate |
|-----------|-------|------------|
| Poke Ball | $1.00 | 2% |
| Great Ball | $10.00 | 20% |
| Ultra Ball | $25.00 | 50% |
| Master Ball | $49.90 | 99% |

**Features:**
- UUPS upgradeable proxy pattern
- Dual token payment (USDC.e and APE)
- POP VRNG integration for fair randomness
- 97% revenue sent to SlabNFTManager, 3% platform fee
- Delegates NFT management to SlabNFTManager
- Up to 3 active Pokemon spawns
- Max 3 throw attempts per Pokemon before relocation

**Key Functions:**
- `purchaseBalls(ballType, quantity, useAPE)` - Buy balls
- `throwBall(pokemonSlot, ballType)` - Attempt catch, returns requestId
- `randomNumberCallback(requestId, randomNumber)` - VRNG callback (handles both throws and spawns)
- `spawnPokemon(slot)` - Spawn Pokemon at slot (owner only, uses VRNG for position)
- `forceSpawnPokemon(slot, posX, posY)` - Spawn with specific position (owner only)
- `getAllPlayerBalls(player)` - Get player inventory
- `getAllActivePokemons()` - Get spawned Pokemon
- `setSlabNFTManager(address)` - Set NFT manager (owner only)
- `getNFTInventoryCount()` - Query NFT inventory via manager

**Internal Callback Handlers:**
- `_handleSpawnCallback()` - Creates Pokemon at VRNG-determined position
- `_handleThrowCallback()` - Determines catch success, handles NFT award

**Events for Frontend:**
- `BallPurchased`, `ThrowAttempted`, `CaughtPokemon`
- `FailedCatch`, `PokemonRelocated`, `WalletUpdated`
- `RevenueSentToManager` - When revenue deposited to SlabNFTManager

### SlabNFTManager Contract
NFT inventory management and auto-purchase from SlabMachine:

**Features:**
- UUPS upgradeable proxy pattern
- Max 10 NFTs in inventory
- Auto-purchase when USDC.e balance >= $51
- Awards NFTs to Pokemon catchers
- Integrates with SlabMachine for NFT purchasing
- ERC721Receiver for receiving NFTs

**Key Functions:**
- `depositRevenue(amount)` - Receive USDC.e from PokeballGame
- `checkAndPurchaseNFT()` - Trigger auto-purchase if threshold met
- `awardNFTToWinner(winner)` - Transfer NFT to winner
- `getInventoryCount()` - Get current NFT count
- `getInventory()` - Get all NFT token IDs
- `setPokeballGame(address)` - Set PokeballGame address (owner only)

**Events for Frontend:**
- `RevenueDeposited` - When revenue received
- `NFTPurchaseTriggered` - When SlabMachine purchase initiated
- `NFTAddedToInventory` - When NFT received
- `NFTAwardedToWinner` - When NFT sent to winner

**Contract Integration Flow:**
```
Player → PokeballGame.purchaseBalls()
    ↓
PokeballGame → SlabNFTManager.depositRevenue(97%)
    ↓
SlabNFTManager → SlabMachine.pull() (when >= $51)
    ↓
SlabMachine → SlabNFTManager (NFT via callback)
    ↓
Player catches Pokemon → PokeballGame._handleSuccessfulCatch()
    ↓
PokeballGame → SlabNFTManager.awardNFTToWinner(player)
    ↓
SlabNFTManager → Player (NFT transfer)
```

### PokemonSpawnManager (Frontend)
Phaser manager for tracking active Pokemon spawns in the game world:

**Location:** `src/game/managers/PokemonSpawnManager.ts`

**Data Structure:**
```typescript
interface PokemonSpawn {
  id: bigint;           // Contract Pokemon ID (uint256)
  x: number;            // Pixel X position
  y: number;            // Pixel Y position
  attemptCount: number; // Throws so far (0-3)
  timestamp: number;    // Spawn time (ms)
  entity?: Pokemon;     // Visual Phaser sprite
  grassRustle?: GrassRustle; // Grass effect following Pokemon
}
```

**Contract Sync Methods (called from React/Web3 listeners):**
- `syncFromContract(initialSpawns)` - Initialize on scene start
- `onSpawnAdded(spawn)` - Handle PokemonSpawned event
- `onPokemonRelocated(pokemonId, newX, newY)` - Handle PokemonRelocated event
- `onCaughtPokemon(pokemonId)` - Handle CaughtPokemon event
- `onFailedCatch(pokemonId, attemptsRemaining)` - Handle FailedCatch event

**Query Methods:**
- `getSpawnAt(x, y)` - Find spawn near position (distance-based)
- `getAllSpawns()` - Get all active spawns
- `getPokemonInCatchRange(playerX, playerY)` - Find nearest catchable Pokemon
- `isPlayerInCatchRange(...)` - Check if player can throw
- `getRemainingAttempts(pokemonId)` - Get attempts left

**Phaser Events Emitted:**
- `pokemon-spawns-synced` - After initial contract sync
- `pokemon-spawn-added` - New Pokemon appeared
- `pokemon-relocated` - Pokemon moved to new position
- `pokemon-caught` - Successful catch (for celebration animation)
- `pokemon-catch-failed` - Failed attempt (for shake animation)
- `pokemon-spawn-effects` - For GrassRustle integration

**Configuration:**
```typescript
SPAWN_CONFIG = {
  MAX_ACTIVE_SPAWNS: 3,    // Max Pokemon at once
  MAX_ATTEMPTS: 3,          // Throws before relocate
  CATCH_RANGE_PIXELS: 48,   // Interaction distance
  SPAWN_QUERY_RADIUS: 32,   // Click detection radius
}
```

**GrassRustle Lifecycle (automatic):**
- Created when Pokemon entity spawns (`createPokemonEntity`)
- Starts playing immediately via `playRustle()`
- Auto-follows Pokemon position via scene update
- Destroyed when Pokemon is removed (`destroyPokemonEntity`)

**Integration Example:**
```typescript
// In GameScene.create():
this.pokemonSpawnManager = new PokemonSpawnManager(this);

// From React Web3 listener:
pokemonSpawnManager.syncFromContract(contractSpawns);
pokemonSpawnManager.onCaughtPokemon(BigInt(pokemonId));

// Listen for events in React:
scene.events.on('pokemon-caught', (data) => {
  showCelebrationModal(data.pokemonId);
});
```

### Pokemon Entity (Frontend)
Visual representation of wild Pokemon in the game world:

**Location:** `src/game/entities/Pokemon.ts`

**Properties:**
- `id: bigint` - Unique Pokemon ID from contract
- `pokemonId: bigint` - Alias for id (backwards compatibility)
- `attemptCount: number` - Catch attempts made (0-3)

**Animation Methods (Promise-returning):**
- `playSpawnAnimation()` - Fade in with bounce, shadow appears
- `playDespawnAnimation()` - Fade out (for removal, not catch)
- `playSuccessAnimation()` - Sparkles, scale bounce, shrink into capture
- `playFailAnimation()` - Shake, red tint flash, escape hop
- `playRelocateAnimation(toX, toY)` - Teleport with departure/arrival particles

**Features:**
- Idle bobbing animation (tween-based)
- Shadow ellipse that follows Pokemon
- Click interaction emits `pokemon-clicked` event
- Sparkle/particle effects for animations

**Configuration:**
```typescript
POKEMON_CONFIG = {
  DEPTH: 10,
  IDLE_BOB_AMPLITUDE: 2,
  IDLE_BOB_DURATION: 1200,
  SPAWN_DURATION: 400,
  SUCCESS_DURATION: 600,
  FAIL_DURATION: 400,
  RELOCATE_FADE_OUT: 250,
  RELOCATE_FADE_IN: 300,
}
```

### GrassRustle Entity (Frontend)
Animated grass rustle effect beneath wild Pokemon:

**Location:** `src/game/entities/GrassRustle.ts`

**Properties:**
- `pokemonId: bigint` - Associated Pokemon ID
- `followTarget: Pokemon | null` - Pokemon being followed

**Methods:**
- `playRustle()` - Start looping rustle animation with fade in
- `stopRustle(immediate?)` - Stop animation with optional fade out
- `pause()` / `resume()` - Pause/resume animation
- `setFollowTarget(pokemon)` - Change follow target
- `hasValidTarget()` - Check if following valid Pokemon

**Features:**
- Auto-follows Pokemon position via scene update listener
- Fallback pulsing animation if sprite animation not defined
- Renders below Pokemon (depth 8 vs 10)

**Texture Requirements:**
- `grass-rustle`: 4-frame sprite sheet (16x16 each)
- Animation `grass-rustle-anim` created in GameScene

### BallInventoryManager (Frontend)
Client-side manager for tracking player's PokeBall inventory:

**Location:** `src/game/managers/BallInventoryManager.ts`

**Data Structure:**
```typescript
interface BallInventory {
  pokeBalls: number;    // Type 0 - $1.00, 2% catch
  greatBalls: number;   // Type 1 - $10.00, 20% catch
  ultraBalls: number;   // Type 2 - $25.00, 50% catch
  masterBalls: number;  // Type 3 - $49.90, 99% catch
}
```

**Query Methods:**
- `hasBall(ballType)` - Check if player has any of that type
- `getBallCount(ballType)` - Get count for specific type
- `getAllCounts()` - Get full inventory snapshot
- `getBallPrice(ballType)` - Get USD price
- `getBallCatchChance(ballType)` - Get catch percentage
- `getBallName(ballType)` - Get display name

**Modification Methods:**
- `updateInventory(ballType, newCount)` - Set specific count
- `decrementBall(ballType)` - Consume one ball (returns success)

**Contract Sync Methods:**
- `onBallPurchased(ballType, quantity)` - Handle BallPurchased event
- `onInventorySynced(initial)` - Replace inventory from contract
- `onBallConsumed(ballType)` - Handle ball consumption

**Event Listener Pattern:**
```typescript
const manager = getBallInventoryManager(); // Singleton
manager.addListener((inventory) => updateUI(inventory));
manager.removeListener(listener);
```

### usePokeballGame Hook
React hook for PokeballGame contract integration:

**Location:** `src/hooks/usePokeballGame.ts`

**Returns:**
```typescript
const {
  inventory,           // Current BallInventory
  isLoading,           // Initial load state
  isPurchasing,        // Transaction pending
  error,               // Last error message
  purchaseBalls,       // (ballType, quantity, useAPE) => Promise<void>
  refreshInventory,    // Manual refresh function
  isContractConfigured // Is contract address set?
} = usePokeballGame();
```

**Features:**
- Reads inventory via `getAllPlayerBalls()`
- Watches `BallPurchased` events for real-time updates
- Syncs to BallInventoryManager singleton
- Requires `VITE_POKEBALL_GAME_ADDRESS` env var (Vite uses `VITE_` prefix)

**Utility Hooks:**
- `useBallPrice(ballType)` - Get ball price from contract
- `useHasBall(ballType)` - Check if player has a ball type

### PokeballGame Modular Hooks (New)
Reusable Wagmi hooks for PokeballGame contract interactions:

**Location:** `src/hooks/pokeballGame/`

**Import Pattern:**
```typescript
import {
  usePurchaseBalls,
  useThrowBall,
  useGetPokemonSpawns,
  usePlayerBallInventory,
  useContractEvents,
  type BallType,
  type PokemonSpawn,
} from '../hooks/pokeballGame';
```

**Available Hooks:**

| Hook | Purpose |
|------|---------|
| `usePurchaseBalls()` | Buy balls with APE or USDC.e |
| `useThrowBall()` | Throw ball at Pokemon slot, returns requestId |
| `useGetPokemonSpawns()` | Read active Pokemon (polls every 5s) |
| `usePlayerBallInventory(address)` | Read player's ball counts |
| `useContractEvents(eventName)` | Subscribe to contract events |
| `useSetOwnerWallet()` | Transfer ownership (owner only) |
| `useSetTreasuryWallet()` | Update treasury address (owner only) |

**Specialized Event Hooks:**
- `useBallPurchasedEvents()` - Ball purchase events
- `useCaughtPokemonEvents()` - Successful catch events
- `useFailedCatchEvents()` - Failed catch events
- `usePokemonSpawnedEvents()` - New spawn events
- `usePokemonRelocatedEvents()` - Relocation events
- `useAllGameEvents()` - All game events combined

**Usage Example:**
```typescript
const { account } = useActiveWeb3React();

// Read hooks
const { data: spawns } = useGetPokemonSpawns();
const { pokeBalls, greatBalls } = usePlayerBallInventory(account);

// Write hooks
const { write: purchase, isPending } = usePurchaseBalls();
const { write: throwBall, requestId } = useThrowBall();

// Actions (always null-check write functions)
purchase?.(0, 5, false);              // Buy 5 Poké Balls with USDC.e
throwBall?.(spawns[0].slotIndex, 0);  // Throw Poké Ball at first spawn

// Event listeners
const { events: catches } = useCaughtPokemonEvents();
```

**Configuration:**
- Contract address: `VITE_POKEBALL_GAME_ADDRESS` env var
- Chain: ApeChain Mainnet (33139)
- ABI: `contracts/abi/abi_PokeballGame.json`

**Return Shape (write hooks):**
```typescript
{
  write: ((args...) => void) | undefined;  // undefined if not configured
  isLoading: boolean;      // Transaction processing
  isPending: boolean;      // Waiting for submission
  error: Error | undefined;
  hash: `0x${string}` | undefined;
  receipt: TransactionReceipt | undefined;
  reset: () => void;
}
```

### BallShop Component (Legacy)
Test UI for ball purchasing:

**Location:** `src/components/BallShop.tsx`

**Usage:**
```tsx
<BallShop isOpen={showShop} onClose={() => setShowShop(false)} />
```

**Features:**
- Inventory display with colored ball icons
- Ball type selection with price/catch info
- Quantity selector (+/-, quick-select buttons)
- USDC.e / APE payment toggle
- Purchase transaction handling
- Error display and loading states

### PokeBallShop Component (New)
Production-ready shop modal for purchasing PokeBalls:

**Location:** `src/components/PokeBallShop/PokeBallShop.tsx`

**Props:**
```typescript
interface PokeBallShopProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: `0x${string}`;
}
```

**Usage:**
```tsx
import { PokeBallShop } from './components/PokeBallShop';

<PokeBallShop
  isOpen={shopOpen}
  onClose={() => setShopOpen(false)}
  playerAddress={account}
/>
```

**Features:**
- Displays all 4 ball types with name, price, catch rate
- APE / USDC.e payment toggle
- Shows current APE and USDC.e balances
- Player inventory display (color-coded balls)
- Quantity input per ball type
- Insufficient balance warning per row
- Transaction loading state with wallet prompt
- Success message with transaction hash
- Error display with dismiss button
- No wallet connected warning

**Hooks Used:**
- `usePurchaseBalls()` - Contract write
- `usePlayerBallInventory(address)` - Read inventory
- `useApeBalance(address)` - APE balance
- `useUsdcBalance(address)` - USDC.e balance

### GameHUD Component
Heads-up display overlay for the game, showing real-time inventory and spawn info:

**Location:** `src/components/PokeBallShop/GameHUD.tsx`

**Props:**
```typescript
interface GameHUDProps {
  playerAddress?: `0x${string}`;
}
```

**Usage:**
```tsx
import { GameHUD } from './components/PokeBallShop';

function AppContent() {
  const { account } = useActiveWeb3React();

  return (
    <div>
      <GameCanvas />
      <GameHUD playerAddress={account} />
    </div>
  );
}
```

**Features:**
- Fixed position (top-right corner), non-intrusive design
- Ball inventory display (2x2 grid with color-coded dots and counts)
- Active Pokemon count with attempt indicators per spawn
- "SHOP" button opens PokeBallShop modal
- "Connect Wallet" message if not connected
- Real-time updates via polling hooks (5s for spawns, 10s for inventory)
- Mobile-responsive layout (horizontal on desktop, stacks vertically on ≤768px)

**Sub-Components:**
- `BallInventorySection` - 2x2 grid showing ball counts by type
- `PokemonSpawnsSection` - Active Pokemon count with spawn badges
- `AttemptDots` - Visual indicator (green=remaining, red=used) for catch attempts

**Ball Colors:**
| Ball Type | Color |
|-----------|-------|
| Poke Ball (0) | Red `#ff4444` |
| Great Ball (1) | Blue `#4488ff` |
| Ultra Ball (2) | Yellow `#ffcc00` |
| Master Ball (3) | Purple `#aa44ff` |

### CatchAttemptModal Component
Modal for selecting and throwing a PokeBall at a specific Pokemon:

**Location:** `src/components/CatchAttemptModal/CatchAttemptModal.tsx`

**Props:**
```typescript
interface CatchAttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: `0x${string}`;
  pokemonId: bigint;        // On-chain Pokemon ID for display
  slotIndex: number;        // 0-2, used as pokemonSlot in throwBall()
  attemptsRemaining: number; // Attempts before Pokemon relocates
}
```

**Usage:**
```tsx
import { CatchAttemptModal } from './components/CatchAttemptModal';

// In parent component (e.g., GameScene wrapper):
const [selectedPokemon, setSelectedPokemon] = useState<{
  pokemonId: bigint;
  slotIndex: number;
  attemptsRemaining: number;
} | null>(null);

// When Phaser scene emits pokemon-clicked:
const handlePokemonClick = (spawn: PokemonSpawn) => {
  setSelectedPokemon({
    pokemonId: spawn.id,
    slotIndex: spawn.slotIndex,
    attemptsRemaining: 3 - spawn.attemptCount,
  });
};

<CatchAttemptModal
  isOpen={selectedPokemon !== null}
  onClose={() => setSelectedPokemon(null)}
  playerAddress={account}
  pokemonId={selectedPokemon?.pokemonId ?? BigInt(0)}
  slotIndex={selectedPokemon?.slotIndex ?? 0}
  attemptsRemaining={selectedPokemon?.attemptsRemaining ?? 0}
/>
```

**Features:**
- Shows Pokemon ID and attempts remaining (color-coded)
- Lists only balls the player owns (filters empty types)
- Displays ball name, price (~$X.XX), catch rate (Y%)
- "Throw" button for each available ball type
- Calls `useThrowBall().write(slotIndex, ballType)` on click
- Disables all buttons during transaction pending
- Shows "Throwing..." label on active button
- Error display with dismiss button
- "Connect wallet" warning if no address
- "No attempts remaining" warning when attemptsRemaining <= 0
- "No PokeBalls" message with shop hint if inventory empty

**Hooks Used:**
- `useThrowBall()` - Contract write for throwBall()
- `usePlayerBallInventory(address)` - Read ball counts

**Note:** This modal only initiates the throw transaction. The VRNG result (caught/escaped) should be handled by the parent component via contract event listeners.

**App.tsx Integration (already wired):**
The CatchAttemptModal is integrated in App.tsx via:
1. `GameCanvas` emits `pokemon-clicked` event with `PokemonClickData`
2. `App.tsx` (AppContent) listens via `onPokemonClick` prop
3. State `selectedPokemon` controls modal open/close
4. `useActiveWeb3React()` provides `account` for playerAddress

```typescript
// GameCanvas emits:
interface PokemonClickData {
  pokemonId: bigint;
  slotIndex: number;
  attemptCount: number;
  x: number;
  y: number;
}

// App.tsx handles:
const handlePokemonClick = (data: PokemonClickData) => {
  setSelectedPokemon({
    pokemonId: data.pokemonId,
    slotIndex: data.slotIndex,
    attemptsRemaining: 3 - data.attemptCount,
  });
};
```

### CatchResultModal Component
Modal for displaying catch attempt results (success or failure):

**Location:** `src/components/CatchResultModal/CatchResultModal.tsx`

**Types:**
```typescript
type CatchResultState =
  | {
      type: 'success';
      pokemonId: bigint;
      tokenId: bigint;           // NFT token ID
      imageUrl?: string;         // Optional Pokemon sprite
      txHash?: `0x${string}`;
    }
  | {
      type: 'failure';
      pokemonId: bigint;
      attemptsRemaining: number;
      txHash?: `0x${string}`;
    };

interface CatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain?: () => void;       // Reopen CatchAttemptModal
  result: CatchResultState | null;
}
```

**Usage:**
```tsx
import { CatchResultModal, type CatchResultState } from './components/CatchResultModal';

const [catchResult, setCatchResult] = useState<CatchResultState | null>(null);

// Set from contract events:
// useCaughtPokemonEvents() -> setCatchResult({ type: 'success', ... })
// useFailedCatchEvents() -> setCatchResult({ type: 'failure', ... })

<CatchResultModal
  isOpen={catchResult !== null}
  onClose={() => setCatchResult(null)}
  onTryAgain={() => {
    // Reopen CatchAttemptModal for same Pokemon
    if (catchResult?.type === 'failure') {
      setSelectedPokemon({ ... });
      setCatchResult(null);
    }
  }}
  result={catchResult}
/>
```

**Success State Features:**
- Confetti animation (CSS-based, 50 pieces)
- Bounce animation on icon
- Pokemon ID and NFT token ID display
- Optional Pokemon image
- "View NFT" button (links to Apescan)
- Transaction hash link

**Failure State Features:**
- Shake animation on modal
- "The Pokemon broke free!" message
- Attempts remaining with color coding
- Visual progress bar (3 segments)
- "Try Again" button (calls onTryAgain)
- Disabled state when attemptsRemaining <= 0
- "Pokemon has relocated" warning

**Animations (CSS keyframes):**
- `fadeIn` - Modal entrance
- `shake` - Failure effect
- `bounce` - Success icon
- `confettiFall` - Confetti pieces

**Integration Flow:**
```
throwBall() → VRNG callback → CaughtPokemon/FailedCatch event
    ↓
Event listener sets catchResult state
    ↓
CatchResultModal opens with result
    ↓
User clicks "Try Again" → onTryAgain → CatchAttemptModal reopens
```

### useTokenBalances Hook
Shared hooks for APE and USDC.e token balances:

**Location:** `src/hooks/useTokenBalances.ts`

**Usage:**
```typescript
import { useApeBalance, useUsdcBalance, useTokenBalances } from '../hooks/useTokenBalances';

// Individual hooks
const { balance, raw, isLoading, refetch } = useApeBalance(address);
const { balance, raw, isLoading, refetch } = useUsdcBalance(address);

// Combined hook
const { ape, usdc, isLoading, refetchAll } = useTokenBalances(address);
```

**Token Addresses (ApeChain Mainnet):**
- USDC.e: `0xF1815bd50389c46847f0Bda824eC8da914045D14` (6 decimals)
- APE: `0x4d224452801aced8b2f0aebe155379bb5d594381` (18 decimals)

### CatchMechanicsManager (Frontend)
Manages the Pokemon catching flow, state machine, and animations:

**Location:** `src/game/managers/CatchMechanicsManager.ts`

**State Machine:**
```
idle → throwing → awaiting_result → success/failure → idle
```

**Catch States:**
- `idle` - Ready for new catch attempt
- `throwing` - Ball animation in progress
- `awaiting_result` - Waiting for VRNG callback
- `success` - Catch successful, playing celebration
- `failure` - Catch failed, playing escape animation

**Handler Callbacks (set by React layer):**
```typescript
type BallSelectionHandler = (pokemonId: bigint) => Promise<BallType | null>;
type ContractThrowHandler = (pokemonId: bigint, ballType: BallType) => Promise<void>;
type StateChangeHandler = (state: CatchState, pokemonId?: bigint) => void;
type ErrorHandler = (error: string, pokemonId?: bigint) => void;
```

**Configuration Methods:**
- `setPlayerPosition(x, y)` - Update player position (for range checks)
- `setBallSelectionHandler(handler)` - UI ball picker callback
- `setContractThrowHandler(handler)` - Blockchain transaction callback
- `setStateChangeHandler(handler)` - State change notifications
- `setErrorHandler(handler)` - Error notifications

**Catch Flow Methods:**
- `onPokemonClicked(pokemonId)` - Start catch flow (validates state, range, inventory)
- `initiateThrow(pokemonId, ballType)` - Execute throw (decrements ball, plays animation)
- `handleCatchResult(caught, pokemonId)` - Process VRNG result
- `onPokemonRelocated(...)` - Handle Pokemon relocation

**Animation Methods:**
- `playThrowAnimation(ballType, targetX, targetY)` - Ball arc toward Pokemon
- `playSuccessAnimation(x, y)` - Sparkles and "CAUGHT!" text
- `playFailAnimation(x, y)` - Ball fragments and "ESCAPED!" shake
- `playRelocateAnimation(fromX, fromY, toX, toY)` - Teleport fade effect

**Phaser Events Emitted:**
- `catch-state-changed` - State transition with oldState, newState, pokemonId
- `catch-error` - Error occurred with message
- `catch-out-of-range` - Player too far from Pokemon
- `catch-success` - Successful catch with pokemonId, ballType
- `catch-failure` - Failed catch with attemptsRemaining
- `catch-transaction-failed` - Contract call failed
- `pokemon-relocate-animated` - Relocation animation complete

**Animation Configuration:**
```typescript
CATCH_CONFIG = {
  THROW_ANIMATION_DURATION: 500,   // Ball flight time
  WOBBLE_DURATION: 300,             // Ball wobble timing
  WOBBLE_COUNT: 3,                  // Wobbles before result
  SUCCESS_ANIMATION_DURATION: 800,  // Celebration effect
  FAILURE_ANIMATION_DURATION: 400,  // Escape shake
  RELOCATE_ANIMATION_DURATION: 600, // Teleport effect
  RESULT_RESET_DELAY: 1500,         // Time before idle
  BALL_COLORS: { 0: 0xff4444, 1: 0x4488ff, 2: 0xffcc00, 3: 0xaa44ff }
}
```

**GameScene Integration (already wired):**
```typescript
// In GameScene.create():
this.pokemonSpawnManager = new PokemonSpawnManager(this);
this.catchMechanicsManager = new CatchMechanicsManager(this, this.pokemonSpawnManager);
this.setupPokemonClickHandler();

// setupPokemonClickHandler() listens for:
// - 'pointerdown' on game world → checks getSpawnAt() → calls onPokemonClicked()
// - 'pokemon-clicked' event from Pokemon entities

// In GameScene.update():
this.catchMechanicsManager.setPlayerPosition(this.player.x, this.player.y);

// In GameScene.destroy():
this.catchMechanicsManager.destroy();
```

**React Integration (to be wired):**
```typescript
// Set handlers from React component:
catchMechanicsManager.setBallSelectionHandler(async (pokemonId) => {
  return showBallPickerModal(pokemonId); // Returns BallType or null
});

catchMechanicsManager.setContractThrowHandler(async (pokemonId, ballType) => {
  await writeContract({ functionName: 'throwBall', args: [pokemonId, ballType] });
});

// When VRNG callback arrives (via contract event listener):
catchMechanicsManager.handleCatchResult(caught, pokemonId);
```

### UUPS Proxy Pattern

Both contracts use OpenZeppelin's UUPS (Universal Upgradeable Proxy Standard):

**Why UUPS:**
- No separate ProxyAdmin contract needed
- Upgrade logic embedded in implementation via `_authorizeUpgrade()`
- Lower gas costs than transparent proxy
- Owner-controlled upgrades

**Upgrade Process:**
1. Create new implementation contract (e.g., `PokeballGameV2.sol`)
2. Ensure storage layout compatibility (no removed/reordered variables)
3. Run upgrade script: `npx hardhat run contracts/deployment/upgrade_PokeballGame.js --network apechain`
4. Verify state preservation after upgrade

**Who Can Upgrade:**
- Only the contract owner (`0x47c11427B9f0DF4e8bdB674f5e23C8E994befC06`)
- Controlled by `onlyOwner` modifier in `_authorizeUpgrade()`

**Storage Gap:**
- Both contracts reserve `uint256[49-50] private __gap` for future state variables
- Reduce gap size when adding new variables

See `docs/UUPS_UPGRADE_GUIDE.md` for complete upgrade documentation.

### Mystery Box System
- `useMysteryBox.ts` hook for mystery box contract interactions
- Randomness-dependent NFT mechanics

### Cross-Chain Bridge
- `useBridgeListing.tsx` - Create cross-chain token swaps
- Bridge functionality for multi-chain support

### Liquidity Manager Positions
- `useLMBuyPositions.tsx` - Query liquidity manager positions with options
- `useAllNftPositions.tsx` - Aggregate NFT position data

## Environment Variables

Required environment variables for the application:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_POKEBALL_GAME_ADDRESS` | Yes | PokeballGame UUPS proxy address on ApeChain |
| `VITE_THIRDWEB_CLIENT_ID` | No | ThirdWeb client ID for crypto checkout (get free at thirdweb.com/create-api-key) |
| `VITE_PUBLIC_RPC_URL` | No | Override default ApeChain RPC URL |
| `VITE_WALLETCONNECT_PROJECT_ID` | No | WalletConnect project ID (has default) |

Example `.env` file (see `.env.example` for full template):
```env
VITE_POKEBALL_GAME_ADDRESS=0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
```

See `docs/SETUP_POKEBALL_GAME.md` for complete setup instructions.

## Centralized Configuration

All PokeballGame on-chain configuration is centralized in `src/services/pokeballGameConfig.ts`:

```typescript
import { pokeballGameConfig, isPokeballGameConfigured } from './services/pokeballGameConfig';

// Check if contract is configured
if (!isPokeballGameConfigured()) {
  console.warn('Set VITE_POKEBALL_GAME_ADDRESS in .env');
}

// Access configuration
const {
  chainId,              // 33139 (ApeChain Mainnet)
  rpcUrl,               // Alchemy RPC URL
  explorerUrl,          // https://apescan.io
  pokeballGameAddress,  // From env var
  abi,                  // PokeballGame ABI
  tokenAddresses,       // { APE, USDC }
  ballConfig,           // Ball prices, catch rates, colors
} = pokeballGameConfig;
```

Helper functions:
- `getTransactionUrl(hash)` - Get Apescan tx link
- `getAddressUrl(addr)` - Get Apescan address link
- `getNftUrl(contract, tokenId)` - Get Apescan NFT link
- `getBallConfig(type)` - Get ball name, price, catch rate, color

## Documentation

Comprehensive documentation available in `docs/`:
- `README_DOCUMENTATION.md` - Documentation index
- `EXECUTIVE_SUMMARY.md` - Project overview
- `implementation_plan.md` - Development roadmap
- `pop_vrng_integration.md` - POP VRNG integration guide
- `WALLET_CONFIG.md` - Wallet setup instructions
- `UUPS_UPGRADE_GUIDE.md` - UUPS proxy upgrade guide
- `SETUP_POKEBALL_GAME.md` - **PokeballGame integration setup guide**
- `claude_agents.md` - Claude agent integration
