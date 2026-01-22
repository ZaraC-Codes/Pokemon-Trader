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
npx hardhat run scripts/spawnInitialPokemon.cjs --network apechain  # Spawn 3 initial Pokemon (slots 0-2)
npx hardhat run scripts/spawnMorePokemon.cjs --network apechain     # Spawn Pokemon in slots 3-19 (v1.2.0)
```

## Project Structure

```
├── src/                     # Main source code
│   ├── components/              # React UI components
│   │   ├── GameCanvas.tsx           # Phaser game wrapper + Web3 spawn sync
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
│   │   ├── CatchResultModal/        # Catch result feedback modal
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── CatchResultModal.tsx     # Success/failure UI + animations
│   │   ├── CatchWinModal/           # NFT win celebration modal
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── CatchWinModal.tsx        # NFT display + confetti
│   │   ├── TransactionHistory/      # Player transaction history
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── TransactionHistory.tsx   # History modal with pagination
│   │   └── FundingWidget/           # Cross-chain funding widget
│   │       ├── index.ts                 # Barrel export
│   │       └── FundingWidget.tsx        # Bridge/swap/buy modal
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
│   │   ├── useTransactionHistory.ts # Player transaction history from events
│   │   ├── useNFTMetadata.ts        # NFT metadata fetching (tokenURI + IPFS)
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
│   ├── PokeballGame.sol         # Main game contract v1.1.0 (UUPS, legacy)
│   ├── PokeballGameV2.sol       # Game contract v1.2.0 (20 Pokemon support)
│   ├── PokeballGameV3.sol       # Game contract v1.3.0 (configurable pricing, $49.90 cap)
│   ├── SlabNFTManager.sol       # NFT inventory manager v1.0.0 (UUPS)
│   ├── SlabNFTManagerV2.sol     # NFT manager v2.0.0 (max 20 NFTs)
│   ├── interfaces/
│   │   └── IPOPVRNG.sol         # POP VRNG interface (randomness)
│   ├── abi/
│   │   ├── abi_PokeballGame.json    # PokeballGame ABI v1.1.0 (legacy, 3 slots)
│   │   ├── abi_PokeballGameV2.json  # PokeballGame ABI v1.2.0 (20 slots)
│   │   └── abi_SlabNFTManager.json  # SlabNFTManager ABI
│   ├── deployment/
│   │   ├── deployProxies.cjs        # Unified proxy deployment (both contracts)
│   │   ├── deploy_PokeballGame.js   # PokeballGame standalone deployment
│   │   ├── deploy_SlabNFTManager.js # SlabNFTManager standalone deployment
│   │   ├── upgrade_PokeballGame.js  # UUPS upgrade example script
│   │   ├── upgrade_PokeballGameV2.cjs # Upgrade to v1.2.0 (20 Pokemon)
│   │   ├── upgrade_PokeballGameV3.cjs # Upgrade to v1.3.0 (configurable pricing)
│   │   └── upgrade_SlabNFTManagerV2.cjs # Upgrade to v2.0.0 (max 20 NFTs)
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
│   ├── UPGRADE_V1.2.0_20_POKEMON.md # v1.2.0 upgrade guide (3→20 Pokemon)
│   └── claude_agents.md         # Claude agent integration
│
├── scripts/                 # Hardhat scripts
│   ├── spawnInitialPokemon.cjs  # Spawn 3 initial Pokemon (slots 0-2)
│   └── spawnMorePokemon.cjs     # Spawn Pokemon in slots 3-19 (v1.2.0)
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
| `src/game/scenes/GameScene.ts` | Main game logic, rendering, exposes `getPokemonSpawnManager()` |
| `src/services/apechainConfig.ts` | ApeChain network configuration |
| `src/services/pokeballGameConfig.ts` | Centralized PokeballGame on-chain config |
| `src/services/thirdwebConfig.ts` | ThirdWeb SDK v5 client & chain config |
| `src/services/contractService.ts` | Contract interaction layer |
| `src/hooks/useAllListings.tsx` | Core hook for fetching listings |
| `contracts/addresses.json` | All contract addresses and token config |
| `contracts/wallets.json` | Wallet configuration (owner, treasury, NFT revenue) |
| `contracts/PokeballGame.sol` | Main game smart contract v1.1.0 (legacy) |
| `contracts/PokeballGameV2.sol` | Game contract v1.2.0 (20 Pokemon support) |
| `contracts/PokeballGameV3.sol` | Game contract v1.3.0 (configurable pricing, $49.90 cap) |
| `contracts/SlabNFTManager.sol` | NFT inventory manager v1.0.0 |
| `contracts/SlabNFTManagerV2.sol` | NFT manager v2.0.0 (max 20 NFTs) |
| `contracts/abi/abi_PokeballGame.json` | PokeballGame ABI v1.1.0 (legacy, 3 slots) |
| `contracts/abi/abi_PokeballGameV2.json` | PokeballGame ABI v1.2.0 (20 slots) |
| `contracts/abi/abi_SlabNFTManager.json` | SlabNFTManager ABI for frontend |
| `contracts/deployment/deployProxies.cjs` | Unified deployment script for both proxies |
| `contracts/deployment/upgrade_PokeballGame.js` | UUPS upgrade example script |
| `contracts/deployment/upgrade_PokeballGameV2.cjs` | Upgrade to v1.2.0 (20 Pokemon) |
| `contracts/deployment/upgrade_PokeballGameV3.cjs` | Upgrade to v1.3.0 (configurable pricing) |
| `contracts/deployment/upgrade_SlabNFTManagerV2.cjs` | Upgrade to v2.0.0 (max 20 NFTs) |
| `scripts/spawnInitialPokemon.cjs` | Spawn 3 initial Pokemon (slots 0-2) |
| `scripts/spawnMorePokemon.cjs` | Spawn Pokemon in slots 3-19 (v1.2.0) |
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
| **Multicall3** | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| **USDC.e** | `0xF1815bd50389c46847f0Bda824eC8da914045D14` |
| **APE** | `0x4d224452801aced8b2f0aebe155379bb5d594381` |

### Multicall3 Configuration

Wagmi's `useReadContracts` hook batches multiple contract calls via Multicall3. The correct address for ApeChain is the canonical Multicall3 deployment at `0xcA11bde05977b3631167028862bE2a173976CA11` (same address on most EVM chains).

**Configuration in `apechainConfig.ts`:**
```typescript
export const apeChainMainnet = defineChain({
  // ... other config
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0,
    },
  },
});
```

**Common Multicall Errors:**
- `aggregate3 returned no data ("0x")` - Wrong Multicall3 address configured
- `execution reverted` - Address exists but isn't Multicall3 contract

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

### Pokemon Spawn Debugging

Console commands to debug the spawn system:
```javascript
// Get references
const game = window.__PHASER_GAME__;
const scene = game.scene.getScene('GameScene');
const mgr = scene.pokemonSpawnManager;

// View spawn state
mgr.debugLogState();           // Detailed state dump
mgr.printSpawnTable();         // Formatted table of all spawns
console.log(mgr.getSummary()); // One-line status

// Enable visual debug mode (slot labels + overlay)
mgr.setDebugMode(true);        // Turn on
mgr.toggleDebugMode();         // Toggle on/off
mgr.isDebugMode();             // Check current state

// Query spawns
mgr.getStats();                // { activeCount, maxCount, poolSize, poolInUse, gridCells }
mgr.getOccupiedSlots();        // Array of slot indices with Pokemon
mgr.getAllSpawns();            // Array of all PokemonSpawn objects
mgr.getSpawnBySlot(0);         // Get Pokemon in slot 0
```

**Diagnostic Logging:**
The spawn system includes extensive console logging at each step of data flow. Watch for these log prefixes:
- `[useGetPokemonSpawns]` - Contract read hook (raw data from chain)
- `[GameCanvas]` - React-to-Phaser bridge (conversion and sync)
- `[PokemonSpawnManager]` - Phaser manager (entity creation)

**Common Issues to Check:**
1. `[useGetPokemonSpawns] Parsed active spawns: 0` → No Pokemon with `isActive: true` on-chain
2. `[GameCanvas] Manager exists: false` → Scene not ready, spawns buffered
3. `[PokemonSpawnManager] Received array length: 0` → Data lost in conversion

## Development Notes

### Rate Limiting
- Batch queries (10 listings per batch) to avoid 429 errors
- Exponential backoff with 200ms delays and 3 retries

### CORS Proxy
Dev server proxies RPC calls via `/api/rpc` to Alchemy endpoint

### Caching
- NFT data cached 30 seconds with React Query
- Listings have 5-minute stale time

### Troubleshooting

**Contract calls fail with "execution reverted" or "aggregate3 returned no data":**
1. Check Multicall3 address in `apechainConfig.ts` is `0xcA11bde05977b3631167028862bE2a173976CA11`
2. Verify contract address is correct in `.env` (`VITE_POKEBALL_GAME_ADDRESS`)
3. Check ABI is loaded correctly (console shows `ABI loaded, entry count: 110`)

**ABI import returns undefined:**
- Ensure JSON ABI files are arrays directly `[...]`, not objects `{abi: [...]}`
- Use `import ABI from './abi.json'` then `ABI as typeof ABI` (not `ABI.abi`)

**Pokemon spawns show 0 even though contract has data:**
1. Check `[useGetPokemonSpawns] pokemonsResult status: success` in console
2. Verify `isActive: true` on spawned Pokemon
3. Check `[PokemonSpawnManager] Added spawn` logs appear
4. Ensure scene is ready before syncing (check for "Scene not ready, buffering" logs)

**Spawn sync race condition:**
- `GameCanvas.tsx` buffers spawns in `pendingSpawnsRef` if scene not ready
- Spawns are flushed after Phaser scene emits `create` event
- Check for `[GameCanvas] Flushing X buffered spawns` in console

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

### FundingWidget (Bridge/Swap/Buy)
Comprehensive wallet funding widget using ThirdWeb Universal Bridge:

**Location:** `src/components/FundingWidget/FundingWidget.tsx`

**Features:**
- **Bridge** tokens from other chains (Ethereum, Arbitrum, Base, Optimism, etc.)
- **Swap** any token into APE or USDC.e
- **Buy with fiat** (card, bank transfer) via multiple providers
- Cross-chain swap+bridge in a single transaction
- Destination locked to ApeChain for seamless gameplay

**Props:**
```typescript
interface FundingWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultToken?: 'APE' | 'USDC';  // Pre-select destination token
  onFundingComplete?: () => void; // Callback when transaction completes
}
```

**Usage:**
```tsx
import { FundingWidget } from './components/FundingWidget';

<FundingWidget
  isOpen={showFunding}
  onClose={() => setShowFunding(false)}
  defaultToken="APE"
  onFundingComplete={() => refetchBalances()}
/>
```

**User Flow (e.g., ETH on Ethereum → APE on ApeChain):**
1. User clicks "Get APE" or "Get USDC.e" in the SHOP
2. FundingWidget opens with destination pre-set to ApeChain
3. User selects source chain (Ethereum) and token (ETH)
4. ThirdWeb Universal Bridge calculates best route
5. User approves transaction in wallet
6. Bridge/swap executes automatically
7. User receives APE/USDC.e on ApeChain, ready to play

**Supported Methods:**
- 95+ EVM chains supported as source
- 17,000+ tokens supported for swapping
- Fiat providers: Stripe, Kado, Transak, Coinbase

### TransactionHistory Component
Displays player's transaction history from the PokeballGame contract:

**Location:** `src/components/TransactionHistory/TransactionHistory.tsx`

**Features:**
- Ball purchases (quantity, tier, token used APE/USDC.e, total cost)
- Ball throws (Pokemon ID targeted)
- Catch results with win/loss status
- NFT tokenId links for successful catches
- Real-time updates via Wagmi event subscriptions
- "Load More" pagination for older transactions
- Color-coded transaction types (purchase=green, throw=yellow, caught=cyan, failed=red)
- Stats bar showing total purchases, throws, catches, escapes, and catch rate

**Props:**
```typescript
interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: `0x${string}`;
}
```

**Usage:**
```tsx
import { TransactionHistory } from './components/TransactionHistory';

<TransactionHistory
  isOpen={showHistory}
  onClose={() => setShowHistory(false)}
  playerAddress={account}
/>
```

**Hook (useTransactionHistory):**
```typescript
import { useTransactionHistory } from '../hooks/useTransactionHistory';

const {
  transactions,    // All fetched transactions (newest first)
  isLoading,       // Initial load state
  error,           // Error message if any
  hasMore,         // Whether more transactions available
  loadMore,        // Load older transactions
  isLoadingMore,   // Load more in progress
  refresh,         // Refresh all transactions
  totalCount,      // Total loaded count
} = useTransactionHistory(playerAddress, { pageSize: 50 });
```

**Transaction Types:**
| Type | Event | Data |
|------|-------|------|
| `purchase` | BallPurchased | ballType, quantity, usedAPE, estimatedCost |
| `throw` | ThrowAttempted | pokemonId, ballType, requestId |
| `caught` | CaughtPokemon | pokemonId, nftTokenId |
| `failed` | FailedCatch | pokemonId, attemptsRemaining |

**Event Querying:**
- Queries ~1 week of blocks by default (302,400 blocks at 2s/block)
- Uses Wagmi `useWatchContractEvent` for real-time updates
- Filters events by player address (indexed parameter)
- Sorts transactions by timestamp (newest first)

### ThirdWeb Checkout Integration (Legacy)
Buy crypto directly in the PokeBall Shop using ThirdWeb Pay:

**Location:** `src/services/thirdwebConfig.ts`, `src/components/PokeBallShop/PokeBallShop.tsx`

**Features:**
- Buy USDC.e or APE on ApeChain with card, bank, or other tokens
- Integrated into PokeBallShop as "NEED CRYPTO?" section
- Uses ThirdWeb SDK v5 PayEmbed component
- Graceful degradation if not configured
- Error boundary prevents app crashes from ThirdWeb widget failures
- Retry functionality for failed widget loads

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

**Error Handling Architecture:**
The ThirdWeb integration uses a layered error handling approach to prevent app crashes:

1. **`ThirdwebErrorBoundary`** - React class component that catches runtime errors
2. **`React.lazy()` + `Suspense`** - Proper async loading with fallback UI
3. **`ThirdwebLoadingFallback`** - Shows "Loading payment widget..." during load
4. **`ThirdwebErrorFallback`** - Shows error message with "Retry" button
5. **`PayEmbedWithProvider`** - Wraps PayEmbed with ThirdwebProvider context

```typescript
// Component hierarchy in BuyCryptoModal:
<ThirdwebErrorBoundary fallback={<ThirdwebErrorFallback />}>
  <Suspense fallback={<ThirdwebLoadingFallback />}>
    <PayEmbedWithProvider tokenAddress={...} title={...} />
  </Suspense>
</ThirdwebErrorBoundary>
```

**Troubleshooting:**
- If widget shows "Failed to load payment widget", click Retry
- Check browser console for `[BuyCryptoModal] Widget error:` logs
- Verify `VITE_THIRDWEB_CLIENT_ID` is set correctly in `.env`
- ThirdWeb may fail if user blocks third-party cookies/scripts

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

### PokeballGame Contract (v1.3.0)
Pokemon catching mini-game with provably fair mechanics:

**Versions:**
| Version | MAX_ACTIVE_POKEMON | Key Features | Status |
|---------|-------------------|--------------|--------|
| v1.1.0 | 3 | Initial release | Legacy (deprecated) |
| v1.2.0 | 20 | 20 Pokemon support | Superseded |
| v1.3.0 | 20 | Configurable pricing, $49.90 cap, enhanced events | **Latest** |

**Deployed Addresses:**
- Proxy: `0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f`
- Implementation (v1.2.0): `0x71ED694476909FD5182afE1fDc9098a9975EA6b5`
- Implementation (v1.3.0): *Deploy via `upgrade_PokeballGameV3.cjs`*

**Ball System (Default Prices - Configurable in v1.3.0):**
| Ball Type | Default Price | Default Catch Rate |
|-----------|---------------|-------------------|
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
- Up to 20 active Pokemon spawns
- Max 3 throw attempts per Pokemon before relocation
- **v1.3.0:** Configurable ball prices via `setBallPrice()`
- **v1.3.0:** $49.90 max purchase cap per transaction (`MAX_PURCHASE_USD`)
- **v1.3.0:** Optional revert if no NFT available on catch (`revertOnNoNFT`)

**Key Functions:**
- `purchaseBalls(ballType, quantity, useAPE)` - Buy balls (enforces $49.90 cap in v1.3.0)
- `throwBall(pokemonSlot, ballType)` - Attempt catch, returns requestId (slot 0-19)
- `randomNumberCallback(requestId, randomNumber)` - VRNG callback (handles both throws and spawns)
- `spawnPokemon(slot)` - Spawn Pokemon at slot (owner only, uses VRNG for position)
- `forceSpawnPokemon(slot, posX, posY)` - Spawn with specific position (owner only)
- `getAllPlayerBalls(player)` - Get player inventory
- `getAllActivePokemons()` - Get spawned Pokemon (returns `Pokemon[20]`)
- `setSlabNFTManager(address)` - Set NFT manager (owner only)
- `getNFTInventoryCount()` - Query NFT inventory via manager

**New Functions (v1.2.0+):**
- `getActivePokemonCount()` - Returns count of active Pokemon (uint8)
- `getActivePokemonSlots()` - Returns array of occupied slot indices (uint8[])

**New Functions (v1.3.0 only):**
- `setBallPrice(ballType, newPrice)` - Set price for a ball type (owner only)
- `setCatchRate(ballType, newRate)` - Set catch rate for a ball type (owner only)
- `setPricingConfig(poke, great, ultra, master)` - Set all prices at once (owner only)
- `setOwnerWallet(newOwner)` - Transfer ownership with event (owner only)
- `setRevertOnNoNFT(bool)` - Configure NFT availability behavior (owner only)
- `getAllBallPrices()` - Get all 4 ball prices
- `getAllCatchRates()` - Get all 4 catch rates
- `initializeV130()` - One-time call after upgrade to set default prices

**Internal Callback Handlers:**
- `_handleSpawnCallback()` - Creates Pokemon at VRNG-determined position
- `_handleThrowCallback()` - Determines catch success, handles NFT award

**Events for Frontend:**
- `BallPurchased(buyer, ballType, quantity, usedAPE, totalAmount)` - **v1.3.0 adds totalAmount**
- `ThrowAttempted`, `CaughtPokemon`, `FailedCatch`, `PokemonRelocated`
- `WalletUpdated(walletType, oldAddress, newAddress)` - **v1.3.0 includes "owner" type**
- `RevenueSentToManager` - When revenue deposited to SlabNFTManager
- `PokemonSpawned` - slotIndex is 0-19
- `RandomnessReceived(requestId, randomNumber, isSpawnRequest)` - **v1.3.0 new**
- `BallPriceUpdated(ballType, oldPrice, newPrice)` - **v1.3.0 new**
- `CatchRateUpdated(ballType, oldRate, newRate)` - **v1.3.0 new**

**Upgrade Commands:**
```bash
# Upgrade to v1.3.0 (configurable pricing, $49.90 cap)
npx hardhat run contracts/deployment/upgrade_PokeballGameV3.cjs --network apechain
```

**Post-Upgrade Configuration (v1.3.0):**
```solidity
// Example: Change Master Ball to $75 (will fail - exceeds $49.90 cap)
// Example: Change Poke Ball to $2
await pokeballGame.setBallPrice(0, 2 * 1e6);

// Example: Set all prices at once
await pokeballGame.setPricingConfig(
    1 * 1e6,    // Poke Ball: $1
    15 * 1e6,   // Great Ball: $15
    30 * 1e6,   // Ultra Ball: $30
    49900000    // Master Ball: $49.90
);

// Example: Enable revert if no NFT available
await pokeballGame.setRevertOnNoNFT(true);
```

**Upgrade History:**
- v1.2.0 deployed 2026-01-21 via `upgrade_PokeballGameV2.cjs`
- v1.3.0 adds configurable pricing, $49.90 cap, enhanced events
- See `docs/UPGRADE_V1.2.0_20_POKEMON.md` for v1.2.0 upgrade guide

### SlabNFTManager Contract (v2.0.0)
NFT inventory management and auto-purchase from SlabMachine:

**Versions:**
| Version | MAX_INVENTORY_SIZE | Key Features | Status |
|---------|-------------------|--------------|--------|
| v1.0.0 | 10 | Initial release | Superseded |
| v2.0.0 | 20 | Max 20 NFTs, setOwnerWallet, enhanced events | **Latest** |

**Deployed Addresses:**
- Proxy: `0xbbdfa19f9719f9d9348F494E07E0baB96A85AA71`
- Implementation (v2.0.0): *Deploy via `upgrade_SlabNFTManagerV2.cjs`*

**Features:**
- UUPS upgradeable proxy pattern
- Max 10 NFTs in inventory (v1.0.0) / **Max 20 NFTs (v2.0.0)**
- Auto-purchase when USDC.e balance >= $51
- Awards NFTs to Pokemon catchers
- Integrates with SlabMachine for NFT purchasing
- ERC721Receiver for receiving NFTs
- **v2.0.0:** `setOwnerWallet()` for ownership transfer with event

**Key Functions:**
- `depositRevenue(amount)` - Receive USDC.e from PokeballGame
- `checkAndPurchaseNFT()` - Trigger auto-purchase if threshold met (respects max 20 cap)
- `awardNFTToWinner(winner)` - Transfer NFT to winner
- `getInventoryCount()` - Get current NFT count
- `getInventory()` - Get all NFT token IDs
- `setPokeballGame(address)` - Set PokeballGame address (owner only)
- `setTreasuryWallet(address)` - Set treasury wallet (owner only)

**New Functions (v2.0.0 only):**
- `setOwnerWallet(newOwner)` - Transfer ownership with event (owner only)
- `getMaxInventorySize()` - Returns `MAX_INVENTORY_SIZE` (20)

**Events for Frontend:**
- `RevenueDeposited(depositor, amount, newBalance)` - When revenue received
- `NFTPurchaseInitiated(requestId, amount, recipient)` - When SlabMachine purchase initiated
- `NFTReceived(tokenId, inventorySize)` - When NFT received
- `NFTAwarded(winner, tokenId, remainingInventory)` - When NFT sent to winner
- `TreasuryWalletUpdated(oldAddress, newAddress)` - Treasury changed
- `PokeballGameUpdated(oldAddress, newAddress)` - PokeballGame changed
- `OwnerWalletUpdated(oldOwner, newOwner)` - **v2.0.0 new**
- `InventoryCapacityReached(currentSize, maxSize)` - **v2.0.0 new**
- `AutoPurchaseSkippedInventoryFull(balance, inventorySize, maxSize)` - **v2.0.0 new**

**Upgrade Commands:**
```bash
# Upgrade to v2.0.0 (max 20 NFTs)
npx hardhat run contracts/deployment/upgrade_SlabNFTManagerV2.cjs --network apechain
```

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
  slotIndex: number;    // Contract slot (0-19)
  x: number;            // Pixel X position
  y: number;            // Pixel Y position
  attemptCount: number; // Throws so far (0-3)
  timestamp: number;    // Spawn time (ms)
  entity?: Pokemon;     // Visual Phaser sprite
  grassRustle?: GrassRustle; // Grass effect following Pokemon
}
```

**Contract Sync Methods (called from React/Web3 listeners):**
- `syncFromContract(initialSpawns, worldBounds?)` - Initialize on scene start
- `onSpawnAdded(spawn)` - Handle PokemonSpawned event
- `onPokemonRelocated(pokemonId, newX, newY)` - Handle PokemonRelocated event
- `onCaughtPokemon(pokemonId)` - Handle CaughtPokemon event
- `onFailedCatch(pokemonId, attemptsRemaining)` - Handle FailedCatch event

**Query Methods:**
- `getSpawnById(pokemonId)` - O(1) lookup by Pokemon ID (Map-based)
- `getSpawnBySlot(slotIndex)` - Get spawn by contract slot (0-19)
- `getSpawnAt(x, y)` - Find spawn near position (spatial grid optimized)
- `getAllSpawns()` - Get all active spawns
- `getPokemonInCatchRange(playerX, playerY)` - Find nearest catchable Pokemon
- `getPokemonInRange(playerX, playerY, range?)` - Get all Pokemon within range, sorted by distance
- `isPlayerInCatchRange(...)` - Check if player can throw
- `getCatchRange()` - Get configured catch range in pixels (96)
- `getRemainingAttempts(pokemonId)` - Get attempts left
- `getOccupiedSlots()` - Get array of active slot indices
- `getAvailableSlots()` - Get array of empty slot indices
- `getStats()` - Get spawn statistics (activeCount, poolSize, gridCells)

**Phaser Events Emitted:**
- `pokemon-spawns-synced` - After initial contract sync
- `pokemon-spawn-added` - New Pokemon appeared (includes slotIndex)
- `pokemon-relocated` - Pokemon moved to new position
- `pokemon-caught` - Successful catch (includes slotIndex)
- `pokemon-catch-failed` - Failed attempt (includes slotIndex)
- `pokemon-spawn-effects` - For GrassRustle/sound integration
- `pokemon-catch-ready` - Player clicked Pokemon AND is within catch range (ready to throw)
- `catch-out-of-range` - Player clicked Pokemon but is too far away (includes distance info)

**Configuration:**
```typescript
SPAWN_CONFIG = {
  MAX_ACTIVE_SPAWNS: 20,         // Max Pokemon at once (v1.2.0 contract)
  MAX_ATTEMPTS: 3,               // Throws before relocate
  CATCH_RANGE_PIXELS: 96,        // Proximity required to catch (pixels)
  SPAWN_QUERY_RADIUS: 32,        // Click detection radius
  ENTITY_POOL_SIZE: 24,          // Pre-allocated entities (>= MAX_ACTIVE_SPAWNS)
  USE_POOLING: true,             // Enable object pooling
  MIN_SPAWN_DISTANCE: 64,        // Min distance between spawns
  SPATIAL_GRID_CELL_SIZE: 128,   // Grid cell size for proximity queries
}
```

**Performance Features (for 20 spawns):**
- **Object Pooling**: Pre-allocates Pokemon + GrassRustle entities to reduce GC pressure
- **Spatial Partitioning**: Grid-based proximity queries avoid iterating all spawns
- **Map-based Lookups**: O(1) retrieval by Pokemon ID or slot index

**Why 20 sprites is safe:**
- Phaser 3 WebGL renderer efficiently batches sprites
- Each Pokemon = sprite + shadow ellipse + grass rustle (~3 draw calls)
- 20 Pokemon = ~60 simple objects, well within Phaser's capabilities
- Simple tile-based world has low overall draw call count
- Modern browsers easily handle 1000+ sprites at 60fps

**GrassRustle Lifecycle (automatic):**
- Created when Pokemon entity spawns (from pool if available)
- Starts playing immediately via `playRustle()`
- Auto-follows Pokemon position via scene update
- Returned to pool when Pokemon is removed (or destroyed if not pooled)

**Debug Mode:**
Visual debugging for spawn system testing:
- `setDebugMode(true/false)` - Enable/disable debug visuals
- `toggleDebugMode()` - Toggle debug on/off (returns new state)
- `isDebugMode()` - Check if debug mode is enabled
- `updateDebug()` - Call in scene update loop to update label positions
- `printSpawnTable()` - Print formatted table to console
- `getSummary()` - Get one-line status string

**Debug Mode Features:**
- **Slot Labels**: Yellow `[0]`, `[1]`, etc. above each Pokemon
- **Stats Overlay**: Fixed panel showing active count, pool usage, occupied slots
- **Console Logging**: Detailed spawn/remove events with position and ID
- **Debug Beacons**: Large pulsing colored circles at spawn positions (high visibility)
- **Range Circles**: Green semi-transparent circles showing catch range (96px radius)

**Debug Beacons:**
Visual markers that appear at spawn positions regardless of entity rendering:
```typescript
// Colors cycle by slot index: red, green, blue, yellow, magenta, cyan
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

// Beacon properties:
- Radius: 24 pixels
- Depth: 500 (above all game layers)
- Alpha: 0.4-0.8 (pulsing)
- Scale: 0.8-1.2 (pulsing)
- White stroke: 3px border
```

Beacons are useful for diagnosing:
- Coordinate transformation issues (beacons appear but Pokemon don't)
- Camera/depth rendering problems (beacons visible when entities aren't)
- Position verification (confirm spawns are in expected locations)

**Debug Mode Usage:**
```typescript
// In GameScene.create():
this.pokemonSpawnManager = new PokemonSpawnManager(this);
this.pokemonSpawnManager.setDebugMode(true); // Enable on startup

// Add F3 toggle key
this.input.keyboard?.on('keydown-F3', () => {
  this.pokemonSpawnManager?.toggleDebugMode();
});

// In GameScene.update():
this.pokemonSpawnManager?.updateDebug();
```

**Integration Example (GameCanvas.tsx handles this automatically):**
```typescript
// GameCanvas.tsx syncs spawns via useGetPokemonSpawns() hook:
const { data: contractSpawns } = useGetPokemonSpawns();

useEffect(() => {
  if (contractSpawns) {
    const manager = scene.getPokemonSpawnManager();
    manager?.syncFromContract(contractSpawns.map(toManagerSpawn), worldBounds);
  }
}, [contractSpawns]);

// Access manager from browser console:
window.__PHASER_GAME__.scene.getScene('GameScene').getPokemonSpawnManager()

// Listen for events in React:
scene.events.on('pokemon-caught', (data) => {
  showCelebrationModal(data.pokemonId);
});
```

### Pokemon Entity (Frontend)
Visual representation of wild Pokemon in the game world:

**Location:** `src/game/entities/Pokemon.ts`

**Properties:**
- `id: bigint` - Unique Pokemon ID from contract (getter)
- `pokemonId: bigint` - Alias for id (backwards compatibility)
- `attemptCount: number` - Catch attempts made (0-3)

**Animation Methods (Promise-returning):**
- `playSpawnAnimation()` - Fade in with bounce, shadow appears
- `playDespawnAnimation()` - Fade out (for removal, not catch)
- `playSuccessAnimation()` - Sparkles, scale bounce, shrink into capture
- `playFailAnimation()` - Shake, red tint flash, escape hop
- `playRelocateAnimation(toX, toY)` - Teleport with departure/arrival particles

**Pooling Methods (internal):**
- `_setId(newId)` - Update Pokemon ID for pool reuse
- `_resetForPool()` - Reset visual state for pool reuse

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
Animated grass rustle effect beneath wild Pokemon - the primary visual indicator for spawn locations:

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
- `_resetForPool()` - Reset visual state for pool reuse (internal)

**Features:**
- Auto-follows Pokemon position via scene update listener
- Fallback pulsing animation if sprite animation not defined
- Renders just below Pokemon (depth 9 vs 10)
- Supports object pooling for efficient reuse
- **Enhanced visual effect** with kicked-up grass blades and particles

**Visual Elements:**
- 5 swaying grass blades (varying heights, alternating sway directions)
- 3 floating grass particles that rise and fall
- Small dust/debris particles for added motion
- Dark grass base at ground level
- All elements animate in sync at 10fps

**Configuration:**
```typescript
GRASS_RUSTLE_CONFIG = {
  DEPTH: 9,              // Just below Pokemon
  Y_OFFSET: 4,           // Position at Pokemon's feet
  FRAME_RATE: 10,        // Animation speed
  FADE_IN_DURATION: 150,
  FADE_OUT_DURATION: 100,
  SCALE: 1.5,            // Larger for visibility
  VISIBLE_ALPHA: 1.0,    // Fully opaque
}
```

**Texture Requirements:**
- `grass-rustle`: 4-frame sprite sheet (24x24 each, 96x24 total)
- `grass-particle`: Small grass blade texture (4x6) for future particle effects
- Animation `grass-rustle-anim` created in GameScene.create()

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

### PokeballGame Modular Hooks (v1.2.0)
Reusable Wagmi hooks for PokeballGame contract interactions:

**Location:** `src/hooks/pokeballGame/`

**Import Pattern:**
```typescript
import {
  usePurchaseBalls,
  useThrowBall,
  useGetPokemonSpawns,
  useActivePokemonCount,
  useActivePokemonSlots,
  usePlayerBallInventory,
  useContractEvents,
  MAX_ACTIVE_POKEMON,
  type BallType,
  type PokemonSpawn,
} from '../hooks/pokeballGame';
```

**Available Hooks:**

| Hook | Purpose |
|------|---------|
| `usePurchaseBalls()` | Buy balls with APE or USDC.e |
| `useThrowBall()` | Throw ball at Pokemon slot (0-19), returns requestId |
| `useGetPokemonSpawns()` | Read all 20 Pokemon slots (polls every 5s) |
| `useActivePokemonCount()` | Get count of active Pokemon (efficient) |
| `useActivePokemonSlots()` | Get array of occupied slot indices |
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

**Usage Example (v1.2.0):**
```typescript
const { account } = useActiveWeb3React();

// Read hooks (v1.2.0 - supports 20 Pokemon)
const { data: spawns, activeCount, activeSlotIndices } = useGetPokemonSpawns();
const { pokeBalls, greatBalls } = usePlayerBallInventory(account);

// Write hooks
const { write: purchase, isPending } = usePurchaseBalls();
const { write: throwBall, requestId } = useThrowBall();

// Actions (always null-check write functions)
purchase?.(0, 5, false);              // Buy 5 Poké Balls with USDC.e
throwBall?.(spawns[0].slotIndex, 0);  // Throw Poké Ball at first spawn (slot 0-19)

// Event listeners
const { events: catches } = useCaughtPokemonEvents();
```

**Configuration:**
- Contract address: `VITE_POKEBALL_GAME_ADDRESS` env var
- ABI: `contracts/abi/abi_PokeballGameV2.json` (20 slots)
- Chain: ApeChain Mainnet (33139)

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
- Displays all 4 ball types with name, price, catch rate (circular ball icons)
- APE / USDC.e payment toggle
- Shows current APE and USDC.e balances with USD value
- Player inventory display (color-coded circular ball icons)
- Quantity input per ball type
- Insufficient balance warning per row
- Transaction loading state with wallet prompt
- Success message with transaction hash
- Error display with dismiss button
- No wallet connected warning

**Hooks Used:**
- `usePurchaseBalls()` - Contract write
- `usePlayerBallInventory(address)` - Read inventory
- `useApeBalanceWithUsd(address)` - APE balance with USD value
- `useUsdcBalance(address)` - USDC.e balance

### GameCanvas Component
React ⇄ Phaser bridge component that mounts the game and syncs Web3 data:

**Location:** `src/components/GameCanvas.tsx`

**Props:**
```typescript
interface GameCanvasProps {
  onTradeClick?: (listing: TradeListing) => void;
  /** Called when player clicks Pokemon AND is in range (ready to catch) */
  onPokemonClick?: (data: PokemonClickData) => void;
  /** Called when player clicks Pokemon but is OUT of range */
  onCatchOutOfRange?: (data: CatchOutOfRangeData) => void;
}

interface PokemonClickData {
  pokemonId: bigint;
  slotIndex: number;
  attemptCount: number;
  x: number;
  y: number;
}

interface CatchOutOfRangeData {
  pokemonId: bigint;
  distance: number;
  requiredRange: number;
  playerX: number;
  playerY: number;
}
```

**Features:**
- Mounts Phaser game with `GameScene`
- Syncs on-chain Pokemon spawns to `PokemonSpawnManager` via `useGetPokemonSpawns()`
- Handles race condition: buffers spawns if they arrive before scene is ready
- Exposes game instance as `window.__PHASER_GAME__` for debugging
- **Proximity-aware events**: Forwards `pokemon-catch-ready` (in range) and `catch-out-of-range` (too far) to React
- **Coordinate Scaling**: Transforms contract coordinates (0-999) to game world pixels (0-2400)

**Coordinate System:**

The contract and game use different coordinate systems:
- **Contract**: 0-999 (`MAX_COORDINATE = 999`) - compact uint16 storage
- **Game World**: 0-2400 pixels (150 tiles × 16 pixels)

The `scaleContractToWorld()` function handles this transformation:
```typescript
const CONTRACT_MAX_COORDINATE = 999;

function scaleContractToWorld(contractCoord: number, worldSize: number): number {
  const margin = TILE_SIZE;  // 16px margin to avoid edge spawns
  const usableSize = worldSize - margin * 2;
  const scaled = (contractCoord / CONTRACT_MAX_COORDINATE) * usableSize + margin;
  return Math.floor(scaled);
}

// Example: Contract (500, 500) → Game (~1200, 1200) pixels (near center)
```

**Web3 → Phaser Sync Flow:**
```
useGetPokemonSpawns() polls contract (5s interval)
    ↓
contractSpawns changes → useEffect triggers
    ↓
syncSpawnsToManager() called
    ↓
toManagerSpawn() scales coordinates (0-999 → 0-2400)
    ↓
If scene ready: manager.syncFromContract(spawns, worldBounds)
If scene not ready: buffer to pendingSpawnsRef
    ↓
On scene 'create' event: flush buffered spawns
```

**Key Functions:**
- `scaleContractToWorld(coord, worldSize)` - Scales contract coordinate to game world pixels
- `toManagerSpawn(contract)` - Converts contract spawn format to manager format with coordinate scaling
- `syncSpawnsToManager(spawns)` - Syncs to `PokemonSpawnManager` with buffering
- `setupSceneListeners(scene)` - Attaches event listeners and flushes pending spawns

**Console Logs (for debugging):**
- `[GameCanvas] Scene is ready, manager available: true`
- `[GameCanvas] Syncing X spawns to PokemonSpawnManager`
- `[GameCanvas] Scene not ready, buffering X spawns`
- `[GameCanvas] Flushing X buffered spawns`

**Debug Access:**
```javascript
// Access game instance
window.__PHASER_GAME__

// Access PokemonSpawnManager
window.__PHASER_GAME__.scene.getScene('GameScene').getPokemonSpawnManager()

// Enable debug mode
window.__PHASER_GAME__.scene.getScene('GameScene').getPokemonSpawnManager()?.setDebugMode(true)
```

### WalletConnector Component
Custom-styled RainbowKit wallet connect button matching the game's pixel-art HUD:

**Location:** `src/components/WalletConnector.tsx`

**Features:**
- Uses `ConnectButton.Custom` for full styling control
- Yellow pixel-art border style matching SHOP button and HUD
- Dark background with monospace font
- Shows truncated address and balance when connected
- Chain icon button for network switching
- "WRONG NETWORK" warning with red styling if on unsupported chain
- Hover effects consistent with game UI

**States:**
| State | Display |
|-------|---------|
| Not connected | Yellow "CONNECT WALLET" button |
| Wrong network | Red "⚠️ WRONG NETWORK" button |
| Connected | [Chain icon] [Balance + Address] |

**Styling:**
- Border: `2px solid #ffcc00` (yellow)
- Background: `rgba(0, 0, 0, 0.85)`
- Font: `'Courier New', monospace`, 12px, bold
- Hover: lighter background, brighter border

**Integration:**
```tsx
// In App.tsx
<WalletConnector />  // Renders in top-right via .wallet-connector CSS class
<GameHUD playerAddress={account} />  // Only renders when connected
```

### GameHUD Component
Minimal heads-up display overlay showing ball inventory and shop access:

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
- Responsive positioning coordinated with WalletConnector
- Ball inventory display (2x2 grid with color-coded **circular** icons and counts)
- **Click ball inventory to open TransactionHistory modal** (cyan hover highlight)
- "SHOP" button opens PokeBallShop modal
- Returns `null` when wallet not connected (WalletConnector handles connection UI)
- Real-time updates via polling hooks (10s for inventory)

**Layout:** `[Balls Panel (clickable)] [SHOP Button] ... [Wallet Connect]`

**Responsive Layout (coordinated with WalletConnector):**
| Breakpoint | Layout |
|------------|--------|
| Desktop (>900px) | HUD to the left of wallet (`right: 280px`), same row |
| Tablet (≤900px) | HUD moves below wallet (`top: 70px`) |
| Mobile (≤768px) | HUD below wallet (`top: 60px`), stacks vertically |
| Small mobile (≤480px) | Compact spacing, smaller panels |

**CSS Classes:**
- `.wallet-connector` - Wallet button positioning (defined in GameHUD styles)
- `.game-hud-container` - HUD panel positioning and layout

**Sub-Components:**
- `BallInventorySection` - 2x2 grid showing ball counts by type (circular icons), clickable with cyan hover effect

**Modals Managed:**
- `PokeBallShop` - Opens via SHOP button click
- `TransactionHistory` - Opens via ball inventory panel click

**Ball Icon Styling:**
All ball icons use circular styling (`borderRadius: '50%'`) for visual consistency:
- HUD ball dots: 12×12px circles with 1px white border
- Shop inventory: 14×14px circles with 1px white border
- Shop purchase rows: 20×20px circles with 2px white border

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
1. `GameCanvas` emits `pokemon-catch-ready` event when player is in range
2. `GameCanvas` emits `catch-out-of-range` event when player is too far
3. `App.tsx` (AppContent) listens via `onPokemonClick` and `onCatchOutOfRange` props
4. State `selectedPokemon` controls modal open/close
5. Toast notification system shows "Move closer to the Pokémon!" warning
6. `useActiveWeb3React()` provides `account` for playerAddress

```typescript
// GameCanvas emits (only when player is in range):
interface PokemonClickData {
  pokemonId: bigint;
  slotIndex: number;
  attemptCount: number;
  x: number;
  y: number;
}

// App.tsx handles in-range click:
const handlePokemonClick = (data: PokemonClickData) => {
  setSelectedPokemon({
    pokemonId: data.pokemonId,
    slotIndex: data.slotIndex,
    attemptsRemaining: 3 - data.attemptCount,
  });
};

// App.tsx handles out-of-range click:
const handleCatchOutOfRange = (_data: CatchOutOfRangeData) => {
  addToast('Move closer to the Pokémon!', 'warning');
};
```

### CatchWinModal Component
Celebratory modal displayed when a player successfully catches a Pokemon and receives an NFT:

**Location:** `src/components/CatchWinModal/CatchWinModal.tsx`

**Props:**
```typescript
interface CatchWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint;              // NFT token ID awarded
  txHash?: `0x${string}`;       // Transaction hash
  pokemonId?: bigint;           // Pokemon ID that was caught
}
```

**Usage:**
```tsx
import { CatchWinModal } from './components/CatchWinModal';

// Triggered by CaughtPokemon event
const { events: caughtEvents } = useCaughtPokemonEvents();

useEffect(() => {
  if (caughtEvents.length > 0) {
    const latest = caughtEvents[caughtEvents.length - 1];
    if (latest.args.catcher === account) {
      setCatchWin({
        tokenId: latest.args.nftTokenId,
        pokemonId: latest.args.pokemonId,
        txHash: latest.transactionHash,
      });
    }
  }
}, [caughtEvents]);

<CatchWinModal
  isOpen={catchWin !== null}
  onClose={() => setCatchWin(null)}
  tokenId={catchWin?.tokenId ?? BigInt(0)}
  pokemonId={catchWin?.pokemonId}
  txHash={catchWin?.txHash}
/>
```

**Features:**
- Automatic NFT metadata fetching via `useSlabNFTMetadata` hook
- Loading skeleton while fetching metadata
- Fallback display if metadata fails (shows tokenId)
- 80-piece confetti celebration animation
- Pulsing green glow border effect
- NFT image display (with error fallback)
- NFT name and token ID
- Pokemon ID (if provided)
- Links to Apescan and Magic Eden
- Transaction hash link

**Animations (CSS keyframes):**
- `catchWinFadeIn` - Modal entrance with scale
- `catchWinPulse` - Green glow pulsing
- `catchWinBounce` - Icon bounce
- `catchWinGlow` - Title text glow
- `catchWinConfetti` - Confetti falling
- `catchWinShimmer` - Loading skeleton shimmer

**Integration in App.tsx:**
Already wired - listens for `CaughtPokemon` events and shows modal automatically for current user's catches.

### useNFTMetadata Hook
Hook for fetching NFT metadata from tokenURI:

**Location:** `src/hooks/useNFTMetadata.ts`

**Returns:**
```typescript
interface UseNFTMetadataResult {
  metadata: NFTMetadata | null;  // { name, image, description, attributes }
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  tokenURI: string | null;
}
```

**Usage:**
```typescript
import { useNFTMetadata, useSlabNFTMetadata } from '../hooks/useNFTMetadata';

// Generic NFT metadata
const { metadata, isLoading, error } = useNFTMetadata(
  '0x8a981C2cfdd7Fbc65395dD2c02ead94e9a2f65a7',
  BigInt(123)
);

// Slab NFT shorthand (pre-configured address)
const { metadata, isLoading } = useSlabNFTMetadata(BigInt(123));

// Access metadata
if (metadata) {
  console.log(metadata.name);   // "Pokemon Card #123"
  console.log(metadata.image);  // Resolved IPFS URL
}
```

**Features:**
- Reads `tokenURI` from ERC-721 contract
- Fetches and parses JSON metadata
- IPFS URL resolution with 4 gateway fallbacks
- 5-minute cache with TanStack Query
- Graceful error handling

**IPFS Gateway Fallbacks:**
1. `ipfs.io`
2. `cloudflare-ipfs.com`
3. `gateway.pinata.cloud`
4. `dweb.link`

**Exported:**
- `useNFTMetadata(address, tokenId, enabled?)` - Generic hook
- `useSlabNFTMetadata(tokenId, enabled?)` - Slab NFT shorthand
- `resolveIPFSUrl(url, gatewayIndex?)` - IPFS URL resolver
- `SLAB_NFT_ADDRESS` - Slab NFT contract address

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
Hooks for APE (native) and USDC.e (ERC-20) balances on ApeChain:

**Location:** `src/hooks/useTokenBalances.ts`

**IMPORTANT:** On ApeChain, APE is the **native gas token** (like ETH on Ethereum), not an ERC-20:
- `useApeBalance()` uses wagmi's `useBalance` hook for native balance
- `useUsdcBalance()` uses `useReadContract` for ERC-20 `balanceOf`

**Available Hooks:**
| Hook | Purpose |
|------|---------|
| `useApeBalance(address)` | Native APE balance |
| `useUsdcBalance(address)` | USDC.e ERC-20 balance |
| `useApeUsdPrice()` | APE/USD price from CoinGecko |
| `useApeBalanceWithUsd(address)` | APE balance + USD value |
| `useTokenBalances(address)` | Both balances combined |

**Usage:**
```typescript
import { useApeBalanceWithUsd, useUsdcBalance, useApeUsdPrice } from '../hooks/useTokenBalances';

// APE balance with USD value
const { balance, usdValue, isLoading, isError, refetch } = useApeBalanceWithUsd(address);
// balance: 12.34 (APE amount)
// usdValue: 7.89 (USD equivalent, or null if price unavailable)

// USDC.e balance
const { balance, isLoading, isError, refetch } = useUsdcBalance(address);
// balance: 25.00 (already in USD)

// APE price only
const { price, isLoading, isError } = useApeUsdPrice();
// price: 0.64 (USD per APE)

// Combined balances
const { ape, usdc, isLoading, refetchAll } = useTokenBalances(address);
```

**Return Shape:**
```typescript
interface TokenBalanceResult {
  balance: number;          // Formatted (e.g., 12.34)
  raw: bigint | undefined;  // Wei value
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

interface BalanceWithUsdResult extends TokenBalanceResult {
  usdValue: number | null;  // balance * apePrice (null if price unavailable)
  isUsdLoading: boolean;    // True if balance OR price still loading
}
```

**Token Addresses (ApeChain Mainnet):**
- USDC.e: `0xF1815bd50389c46847f0Bda824eC8da914045D14` (6 decimals, ERC-20)
- APE: Native token (18 decimals, NOT an ERC-20 contract)

**Price Caching:**
- APE/USD price fetched from CoinGecko API
- 60-second stale time, 5-minute cache
- Retry on failure (2 retries, 1s delay)

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

**Query Methods:**
- `getCatchRange()` - Get configured catch range in pixels (96)

**Phaser Events Emitted:**
- `catch-state-changed` - State transition with oldState, newState, pokemonId
- `catch-error` - Error occurred with message
- `pokemon-catch-ready` - Player clicked Pokemon AND is in range (triggers modal)
- `catch-out-of-range` - Player too far (includes distance, requiredRange, playerX, playerY)
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
- `UPGRADE_V1.2.0_20_POKEMON.md` - **v1.2.0 upgrade guide (3→20 Pokemon)**
- `claude_agents.md` - Claude agent integration
