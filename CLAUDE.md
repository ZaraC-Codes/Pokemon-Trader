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
- **Custom Wallet Connectors** - dGen1/EthereumPhone, Glyph Wallet

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
│   │   ├── SfxVolumeToggle.tsx      # SFX volume control (independent from music)
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
│   │   ├── PokemonCard/             # NFT card display component
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── PokemonCard.tsx          # Pokemon card art from metadata
│   │   ├── AdminDevTools/           # Dev tools panel (dev mode only)
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── AdminDevTools.tsx        # SlabNFTManager admin operations
│   │   ├── HelpModal/               # How to Play help modal
│   │   │   ├── index.ts                 # Barrel export
│   │   │   └── HelpModal.tsx            # Game instructions + ball info
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
│   │   ├── utils/                   # Audio utilities (chiptune music, SFX)
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
│   │       ├── pokeballGameConfig.ts    # Shared config, ABI, types, token addresses
│   │       ├── usePurchaseBalls.ts      # Buy balls (APE/USDC.e)
│   │       ├── useThrowBall.ts          # Throw ball at Pokemon (v1.6.0 includes Entropy fee)
│   │       ├── useThrowFee.ts           # Get Pyth Entropy fee for throwBall
│   │       ├── useGetPokemonSpawns.ts   # Read active spawns
│   │       ├── usePlayerBallInventory.ts # Read player inventory
│   │       ├── useContractEvents.ts     # Event subscriptions
│   │       ├── useTokenApproval.ts      # ERC-20 approval for APE/USDC.e
│   │       ├── useSetOwnerWallet.ts     # Transfer ownership (owner)
│   │       └── useSetTreasuryWallet.ts  # Update treasury (owner)
│   │
│   ├── connectors/              # Custom wallet connectors
│   │   ├── index.ts                 # Barrel export
│   │   ├── ethereumPhoneConnector.ts # dGen1/ethOS Wagmi connector
│   │   ├── glyphConnector.ts        # Glyph Wallet Wagmi connector
│   │   └── customWallets.ts         # RainbowKit wallet metadata
│   │
│   ├── config/                  # Static configuration
│   │   ├── knownListings.ts         # Pre-identified listing IDs
│   │   └── abis/                    # Contract ABIs (erc721M.ts)
│   │
│   ├── utils/                   # Utility functions
│   │   └── walletDetection.ts       # dGen1/Glyph wallet detection helpers
│   │
│   ├── connectors/              # Custom Wagmi wallet connectors
│   │   ├── index.ts                 # Barrel export
│   │   ├── ethereumPhoneConnector.ts # dGen1/ethOS wallet connector
│   │   ├── glyphConnector.ts        # Glyph wallet connector
│   │   └── customWallets.ts         # RainbowKit wallet definitions
│   │
│   ├── styles/                  # CSS stylesheets
│   │   └── touchscreen.css          # Touch/square-screen responsive styles
│   │
│   └── utilities/               # Common helpers
│
├── contracts/               # Smart contract files
│   ├── PokeballGame.sol         # Main game contract v1.1.0 (UUPS, legacy)
│   ├── PokeballGameV2.sol       # Game contract v1.2.0 (20 Pokemon support)
│   ├── PokeballGameV3.sol       # Game contract v1.3.0 (configurable pricing, $49.90 cap)
│   ├── PokeballGameV5.sol       # Game contract v1.5.0 (unified payments, auto-swap)
│   ├── PokeballGameV6.sol       # Game contract v1.6.0 (Pyth Entropy for randomness)
│   ├── PokeballGameV7.sol       # Game contract v1.7.0 (random NFT selection)
│   ├── SlabNFTManager.sol       # NFT inventory manager v1.0.0 (UUPS)
│   ├── SlabNFTManagerV2.sol     # NFT manager v2.0.0 (max 20 NFTs)
│   ├── SlabNFTManagerV2_1.sol   # NFT manager v2.1.0 (pull price fix)
│   ├── SlabNFTManagerV2_2.sol   # NFT manager v2.2.0 (NFT recovery, transferFrom fix)
│   ├── SlabNFTManagerV2_3.sol   # NFT manager v2.3.0 (random NFT selection)
│   ├── interfaces/
│   │   └── IPOPVRNG.sol         # POP VRNG interface (randomness)
│   ├── abi/
│   │   ├── abi_PokeballGame.json    # PokeballGame ABI v1.1.0 (legacy, 3 slots)
│   │   ├── abi_PokeballGameV2.json  # PokeballGame ABI v1.2.0 (20 slots)
│   │   ├── abi_PokeballGameV4.json  # PokeballGame ABI v1.4.x (native APE)
│   │   ├── abi_PokeballGameV5.json  # PokeballGame ABI v1.5.0 (unified payments)
│   │   ├── abi_PokeballGameV6.json  # PokeballGame ABI v1.6.0 (Pyth Entropy)
│   │   ├── abi_PokeballGameV7.json  # PokeballGame ABI v1.7.0 (random NFT selection, **current**)
│   │   ├── abi_SlabNFTManager.json  # SlabNFTManager ABI (legacy)
│   │   └── abi_SlabNFTManagerV2_3.json  # SlabNFTManager ABI v2.3.0 (**current**)
│   ├── deployment/
│   │   ├── deployProxies.cjs        # Unified proxy deployment (both contracts)
│   │   ├── deploy_PokeballGame.js   # PokeballGame standalone deployment
│   │   ├── deploy_SlabNFTManager.js # SlabNFTManager standalone deployment
│   │   ├── upgrade_PokeballGame.js  # UUPS upgrade example script
│   │   ├── upgrade_PokeballGameV2.cjs # Upgrade to v1.2.0 (20 Pokemon)
│   │   ├── upgrade_PokeballGameV3.cjs # Upgrade to v1.3.0 (configurable pricing)
│   │   ├── upgrade_PokeballGameV4_NativeAPE.cjs # Upgrade to v1.4.0 (native APE)
│   │   ├── upgrade_PokeballGameV5.cjs   # Upgrade to v1.5.0 (unified payments)
│   │   ├── set_slabNFTManager.cjs       # Configure SlabNFTManager on PokeballGame
│   │   ├── upgrade_SlabNFTManagerV2.cjs # Upgrade to v2.0.0 (max 20 NFTs)
│   │   ├── upgrade_SlabNFTManagerV2_1.cjs # Upgrade to v2.1.0 (pull price fix)
│   │   ├── upgrade_SlabNFTManagerV2_2.cjs # Upgrade to v2.2.0 (NFT recovery)
│   │   ├── upgrade_SlabNFTManagerV2_3.cjs # Upgrade to v2.3.0 (random NFT selection)
│   │   └── upgrade_PokeballGameV7.cjs     # Upgrade to v1.7.0 (random NFT selection)
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
│   ├── spawnMorePokemon.cjs     # Spawn Pokemon in slots 3-19 (v1.2.0)
│   ├── verify_revenue_flow.cjs  # Verify 3%/97% fee/revenue split (v1.7.0)
│   ├── withdraw_test_funds.cjs  # Withdraw fees/revenue for testing (v1.7.0)
│   ├── update_ape_price.cjs     # Auto-update APE/USD price from CoinGecko
│   └── debug/                   # Debug/inspection utilities (48 scripts)
│       ├── check_*.cjs          # State inspection scripts
│       ├── debug_*.cjs          # Debug utilities
│       ├── trace_*.cjs          # Transaction tracing
│       ├── verify_*.cjs         # Verification scripts
│       └── ...                  # Other diagnostic tools
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
| `src/game/scenes/GameScene.ts` | Main game logic, rendering, exposes `getPokemonSpawnManager()` and `getCatchMechanicsManager()` |
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
| `contracts/PokeballGameV4.sol` | Game contract v1.4.0 (native APE via msg.value) |
| `contracts/PokeballGameV5.sol` | Game contract v1.5.0 (unified payments, auto-swap) |
| `contracts/PokeballGameV6.sol` | Game contract v1.6.0 (Pyth Entropy for randomness) |
| `contracts/PokeballGameV7.sol` | Game contract v1.7.0 (random NFT selection) |
| `contracts/SlabNFTManager.sol` | NFT inventory manager v1.0.0 |
| `contracts/SlabNFTManagerV2.sol` | NFT manager v2.0.0 (max 20 NFTs) |
| `contracts/SlabNFTManagerV2_3.sol` | NFT manager v2.3.0 (random NFT selection) |
| `contracts/abi/abi_PokeballGame.json` | PokeballGame ABI v1.1.0 (legacy, 3 slots) |
| `contracts/abi/abi_PokeballGameV2.json` | PokeballGame ABI v1.2.0 (20 slots) |
| `contracts/abi/abi_PokeballGameV4.json` | PokeballGame ABI v1.4.x (native APE) |
| `contracts/abi/abi_PokeballGameV5.json` | PokeballGame ABI v1.5.0 (unified payments) |
| `contracts/abi/abi_PokeballGameV6.json` | PokeballGame ABI v1.6.0 (Pyth Entropy) |
| `contracts/abi/abi_PokeballGameV7.json` | PokeballGame ABI v1.7.0 (random NFT selection, **current**) |
| `contracts/abi/abi_SlabNFTManagerV2_3.json` | SlabNFTManager ABI v2.3.0 (random NFT selection, **current**) |
| `contracts/deployment/deployProxies.cjs` | Unified deployment script for both proxies |
| `contracts/deployment/upgrade_PokeballGame.js` | UUPS upgrade example script |
| `contracts/deployment/upgrade_PokeballGameV2.cjs` | Upgrade to v1.2.0 (20 Pokemon) |
| `contracts/deployment/upgrade_PokeballGameV3.cjs` | Upgrade to v1.3.0 (configurable pricing) |
| `contracts/deployment/upgrade_PokeballGameV4_NativeAPE.cjs` | Upgrade to v1.4.0 (native APE payments) |
| `contracts/deployment/upgrade_PokeballGameV5.cjs` | Upgrade to v1.5.0 (unified payments, auto-swap) |
| `contracts/deployment/set_slabNFTManager.cjs` | Configure SlabNFTManager on PokeballGame |
| `contracts/deployment/upgrade_SlabNFTManagerV2.cjs` | Upgrade to v2.0.0 (max 20 NFTs) |
| `scripts/spawnInitialPokemon.cjs` | Spawn 3 initial Pokemon (slots 0-2) |
| `scripts/spawnMorePokemon.cjs` | Spawn Pokemon in slots 3-19 (v1.2.0) |
| `scripts/verify_revenue_flow.cjs` | Verify 3%/97% fee/revenue split on-chain (v1.7.0) |
| `scripts/withdraw_test_funds.cjs` | Withdraw fees/revenue from contracts for testing |
| `scripts/update_ape_price.cjs` | Hourly APE/USD price updater from CoinGecko |
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
| **WAPE (Wrapped APE)** | `0x48b62137EdfA95a428D35C09E44256a739F6B557` |
| **PokeballGame Implementation (v1.7.0)** | `0xc087bCcFF99431787d4C38bb3378d45726Dc7DE4` |
| **SlabNFTManager Implementation (v2.3.0)** | `0xC4DDe9b1BaE8f77e08c035e0D5E8aBA59238Ad13` |
| **Camelot Router (AMMv3)** | `0xC69Dc28924930583024E067b2B3d773018F4EB52` |
| **Pyth Entropy** | `0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320` |
| **Pyth Entropy Provider** | `0x52DeaA1c84233F7bb8C8A45baeDE41091c616506` |

**Note:** On ApeChain, APE is the native gas token. PokeballGame v1.7.0 uses **Pyth Entropy** for randomness (replaced POP VRNG which required whitelisting). Both APE and USDC.e result in USDC.e. APE is auto-swapped via Camelot DEX. 97% revenue goes to SlabNFTManager, 3% platform fees to treasury (in USDC.e). `throwBall()` requires ~0.073 APE for the Entropy fee. **v1.7.0** adds random NFT selection - the same Entropy random number is reused for both catch determination and NFT index selection (no extra fee). Players pay Entropy fees directly via `msg.value`; the contract does NOT maintain an APE buffer.

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

### Dev Server Port Convention

**CRITICAL:** The Vite dev server MUST run on port 5173.

The frontend uses relative URLs (`/api/rpc`) that are proxied through Vite's dev server to the Alchemy RPC endpoint. However, `apechainConfig.ts` has hardcoded references to `http://localhost:5173/api/rpc` in certain fallback paths.

**Configuration (`vite.config.ts`):**
```typescript
server: {
  port: 5173,        // Canonical dev port
  strictPort: true,  // Fail if port is busy instead of picking another
  proxy: {
    '/api/rpc': {
      target: 'https://apechain-mainnet.g.alchemy.com',
      rewrite: (path) => path.replace(/^\/api\/rpc/, '/v2/YOUR_KEY'),
    },
  },
}
```

**Symptoms of wrong port:**
- Console spam: `POST http://localhost:5173/api/rpc 400 (Bad Request)`
- `throwFee` returns 0 or undefined
- MetaMask shows absurdly high gas estimates (millions of APE)
- Contract reads fail silently, causing UI to show stale/default data

**Fix:** Kill any process using port 5173, then restart dev server:
```bash
# Windows
npx kill-port 5173
npm run dev

# Linux/macOS
lsof -ti:5173 | xargs kill -9
npm run dev
```

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

**Wallet shows insane gas estimate (~7M APE) when purchasing balls:**
- Cause 1: Missing ERC-20 token approval before `purchaseBalls` call (USDC.e only)
- Cause 2 (v1.4.0+): Using generic `purchaseBalls()` function for gas estimation when buying with APE after USDC.e purchases can trigger "ERC20: transfer amount exceeds allowance" error
- **v1.4.0:** APE is now native currency - NO approval needed for APE purchases!
- USDC.e still requires ERC-20 approval before `safeTransferFrom`
- Fix 1: PokeBallShop shows "Approve" button for USDC.e, direct "Buy" for APE
- Fix 2 (v1.4.1+): `usePurchaseBalls` hook now uses dedicated contract functions:
  - `purchaseBallsWithAPE(ballType, quantity)` - payable, avoids ERC-20 checks
  - `purchaseBallsWithUSDC(ballType, quantity)` - nonpayable, explicit USDC.e path
- The `useTokenApproval` hook returns `isApproved: true` for APE (native)

**Per-transaction $49.90 cap exceeded:**
- Cause: Contract enforces `MAX_PURCHASE_USD = $49.90` per transaction
- Symptom: Transaction reverts with `PurchaseExceedsMaximum` error
- Fix: PokeBallShop now validates quantity in frontend before allowing purchase
- UI shows "Over Cap" button (red) and "Max $49.90/tx" warning when exceeded
- Master Ball is $49.90, so max quantity = 1 per transaction
- Ultra Ball ($25) max = 1, Great Ball ($10) max = 4, Poke Ball ($1) max = 49

**Shop screen goes blank when entering quantity:**
- Cause: `BigInt(NaN)` throws an error when quantity input is empty/invalid
- Fix: `calculateTotalCost()` guards against NaN with `Number.isFinite()` checks
- All quantity handling in PokeBallShop validates before using `BigInt()`

**Phaser game crashes/recreates when interacting with shop:**
- Cause: GameCanvas useEffect had `syncSpawnsToManager` in dependency array
- When React detects dependency change, it triggers cleanup (game.destroy()) and recreates
- This caused `GrassRustle.destroy()` to crash accessing undefined `this.anims`
- Fix 1: Changed GameCanvas useEffect to `[]` (only run on mount)
- Fix 2: Added try/catch guards in `GrassRustle.destroy()` and `Pokemon.destroy()`

**Shop crashes when switching payment tokens (APE ↔ USDC.e):**
- Cause 1: Division by zero in `getBallPriceInWei()` if `apePriceUSD` is 0
- Cause 2: `useTokenApproval` hook violated React's rules of hooks by returning early for APE
- Fix 1: Added guard in `getBallPriceInWei()` to ensure `apePriceUSD > 0n`, fallback to $0.64
- Fix 2: Added guard in `useApePriceFromContract()` to never return 0
- Fix 3: Refactored `useTokenApproval` to call all hooks unconditionally (uses `isNativeCurrency` flag)
- Fix 4: For APE, hook disables queries via `enabled: false` and returns safe defaults
- Note: Hooks must be called in the same order every render - no early returns allowed!

**Transaction History shows "No transactions found" or 400/429 RPC errors:**
- Cause: Alchemy free tier limits `eth_getLogs` to 10 blocks per request
- Symptom 1: 400 Bad Request with "block range exceeded" message
- Symptom 2: 429 Too Many Requests when chunking into many small requests
- Fix: `useTransactionHistory` uses Caldera public RPC for historical queries (no block limits)
- The hook creates a separate viem client: `createPublicClient({ transport: http(CALDERA_URL) })`
- Wagmi's Alchemy client is still used for real-time event subscriptions
- Default lookback: 25,000 blocks (~14 hours) covers most recent activity

**useThrowBall rejects Pokemon slots > 2 ("Invalid pokemon slot must be 0-2"):**
- Cause: Hardcoded validation `pokemonSlot > 2` from v1.1.0 (only 3 slots)
- Fix: Updated to use `MAX_ACTIVE_POKEMON` (20) from config
- Now accepts slots 0-19 for v1.2.0+ contracts

**useGetPokemonSpawns fails with "abi.filter is not a function":**
- Cause: ABI file is a Hardhat artifact object `{ _format, contractName, abi: [...] }` instead of raw array
- viem/wagmi expects ABI to be a raw array `[...]`, not an object
- Fix: Extract the `abi` property from the artifact, or regenerate ABI as array-only
- Diagnostic: Check `Array.isArray(POKEBALL_GAME_ABI)` returns true
- The hooks config file has a startup diagnostic that logs ABI entry count

**MetaMask shows insane gas estimate (millions of APE) for throwBall:**
- Cause: Transaction will revert, causing gas estimation to fail
- Common revert reasons:
  - `InsufficientBalls(ballType, required, available)` - Player has 0 balls of that type
  - `PokemonNotActive(slot)` - No Pokemon in that slot
  - `NoAttemptsRemaining(slot)` - Pokemon already at max attempts
- Fix: Frontend should validate before calling (CatchAttemptModal already does this)
- Debug: Use `simulateContract` to see the actual revert reason before sending

**throwBall transaction fails or throwFee is 0:**
- Cause 1: Dev server running on wrong port (see "Dev Server Port Convention" above)
- Cause 2: RPC endpoint unreachable or rate limited
- Cause 3: Contract state changed between fee read and transaction send
- **Fail-Safe Behavior (v1.6.0+):**
  - `useThrowBall` hook now BLOCKS transactions when throwFee is 0 or unavailable
  - Gas estimation runs BEFORE sending to wallet - reverts are caught early
  - Hook returns `isFeeReady: boolean` and `feeError: string | null` for UI feedback
  - `write()` returns `Promise<boolean>` - false means transaction was blocked
- Console logs to watch for:
  - `[useThrowBall] BLOCKED: Cannot proceed without valid throw fee` - Fee unavailable
  - `[useThrowBall] BLOCKED: Gas estimation failed` - Transaction would revert
  - `[useThrowBall] Gas estimation successful` - All checks passed
- UI should check `isFeeReady` before enabling throw button
- If `feeError` is set, display it to user instead of attempting transaction

**TransactionHistory shows empty, events not found:**
- Cause 1: Wrong env var name - `VITE_POKEBALLGAME_ADDRESS` vs `VITE_POKEBALL_GAME_ADDRESS` (with underscore)
- Cause 2: Different config files using different ABI versions
- There are TWO config files that must stay in sync:
  - `src/services/pokeballGameConfig.ts` - Used by useTransactionHistory, general services
  - `src/hooks/pokeballGame/pokeballGameConfig.ts` - Used by pokeball hooks
- Both must use the same env var name (`VITE_POKEBALL_GAME_ADDRESS`) and ABI version
- Fix: Ensure both configs import the same ABI (currently V5) and read the same env var

**Verify 3%/97% revenue split is working correctly:**
- Run: `node scripts/verify_revenue_flow.cjs` to check on-chain balances
- Compares `APESwappedToUSDC` events against `accumulatedUSDCFees` and SlabNFTManager balance
- Expected: 3% of USDC.e goes to PokeballGame fee pool, 97% to SlabNFTManager
- Script shows actual vs expected values with variance check
- If variance > 1%, investigate swap events and revert history

**Withdraw test funds for recycling:**
- Run: `node scripts/withdraw_test_funds.cjs` to see current balances and options
- Actions:
  - `status` - Show current balances (default)
  - `ape` - Withdraw accumulated APE fees from PokeballGame
  - `allape` - Emergency withdraw ALL APE from PokeballGame
  - `usdc` - Withdraw accumulated USDC.e fees from PokeballGame
  - `revenue` - Withdraw ALL USDC.e from SlabNFTManager (keeps NFTs)
  - `revenue:X` - Withdraw specific amount X from SlabNFTManager (e.g., `revenue:10.50`)
- Requires DEPLOYER_PRIVATE_KEY set in .env.local and must be owner wallet
- Withdrawn funds go to treasury wallet, can be reused for more testing

**Ball inventory shows in UI but throws fail with "InsufficientBalls":**
- Cause: `BallInventoryManager` singleton not synced from on-chain data
- Symptom: `usePlayerBallInventory` shows correct counts but Phaser's `CatchMechanicsManager` sees 0 balls
- Fix: `usePlayerBallInventory` now syncs to `BallInventoryManager` singleton automatically
- Console logs to watch for:
  - `[usePlayerBallInventory] Synced to BallInventoryManager singleton` - Sync successful
  - `[BallInventoryManager] onInventorySynced:` - Shows received inventory
- If sync fails, check that `getBallInventoryManager()` returns the same singleton instance

**useThrowBall gas estimation fails with "missing account":**
- Cause: Gas estimation requires the user's account address to check inventory
- Symptom: `[useThrowBall] BLOCKED: Gas estimation failed` on every throw attempt
- Error message: May contain "execution reverted" without specific reason
- Fix: `useThrowBall` now imports `useAccount` and passes `userAddress` to `estimateContractGas`
- The `account` parameter is required for contract reads that check `msg.sender`-dependent storage

**CatchMechanicsManager stuck in "awaiting_result" state:**
- Cause: State machine not reset when catch result arrives from contract events
- Symptom: First throw works, clicking same Pokemon again logs "Ignoring click: not idle (state: awaiting_result)"
- Fix: `GameCanvas` now accepts `onCatchResultRef` prop that App.tsx uses to notify Phaser of catch results
- **Integration Flow:**
  1. App.tsx creates `catchResultRef = useRef<((caught: boolean, pokemonId: bigint) => void) | null>(null)`
  2. GameCanvas wires ref to `catchMechanicsManager.handleCatchResult()`
  3. When `CaughtPokemon` or `FailedCatch` event fires, App.tsx calls `catchResultRef.current(caught, pokemonId)`
  4. CatchMechanicsManager receives result and resets to idle state
- Console logs to watch for:
  - `[GameCanvas] Catch result callback registered` - Ref wired successfully
  - `[GameCanvas] Catch result received: CAUGHT/FAILED` - Result forwarded to manager
  - `[CatchMechanicsManager] handleCatchResult:` - Manager processing result
  - `[CatchMechanicsManager] Force resetting to idle` - State machine reset

## External Services

- **Alchemy**: Primary RPC endpoint (wagmi client) and NFT API v3
- **Caldera**: Public RPC for historical event queries (no block range limits)
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

### Custom Wallet Support (dGen1 & Glyph)
Custom Wagmi connectors for EthereumPhone dGen1 and Glyph wallets.

**Location:** `src/connectors/`

**Wallet Picker Position:** Custom wallets appear at **TOP** of RainbowKit modal in "ApeChain Wallets" group, before MetaMask and other standard wallets.

**Supported Wallets:**
1. **Glyph Wallet** - Yuga Labs' wallet for ApeChain (listed first)
   - Social login (X, email, Apple ID)
   - No KYC for purchases ≤$500
   - Multi-chain swaps
   - Works via SDK (`@use-glyph/sdk-react`)

2. **dGen1 Wallet** - EthereumPhone device running ethOS
   - ERC-4337 Account Abstraction
   - Square screen (1:1) optimized
   - Touchscreen-only interface
   - Auto-detected on ethOS devices

**Files:**
| File | Purpose |
|------|---------|
| `ethereumPhoneConnector.ts` | Wagmi connector for dGen1 |
| `glyphConnector.ts` | Wagmi connector for Glyph (with SDK fallback) |
| `customWallets.ts` | RainbowKit wallet factory functions |
| `walletDetection.ts` | Detection utilities for both wallets |
| `touchscreen.css` | Touch-friendly responsive styles |

**RainbowKit Integration:**
Uses `connectorsForWallets` API (not `getDefaultConfig`) to ensure custom wallets appear at TOP:

```typescript
// src/services/apechainConfig.ts
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { dGen1Wallet, glyphWallet } from '../connectors/customWallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'ApeChain Wallets',
      wallets: [glyphWallet, dGen1Wallet],  // Factory functions
    },
    {
      groupName: 'Popular Wallets',
      wallets: [metaMaskWallet, rainbowWallet, ...],
    },
  ],
  { appName: 'Pokemon Trader', projectId: WALLETCONNECT_PROJECT_ID }
);

export const config = createConfig({ connectors, chains: [apeChainMainnet], ... });
```

**Environment Variables:**
```env
# ERC-4337 bundler for dGen1 (optional)
VITE_BUNDLER_RPC_URL=https://api.pimlico.io/v2/33139/rpc

# Glyph API key if required (optional)
VITE_GLYPH_API_KEY=
```

**Detection Methods:**
- dGen1: `window.ethereum.isEthereumPhone` or `window.__ETHOS_WALLET__`
- Glyph: SDK-based (always available via connector)

**Touchscreen Optimizations:**
- Minimum 44px touch targets
- No hover-only interactions
- Active/pressed states instead of hover
- Square screen layout (300x300px viewport)

**Documentation:** See `docs/WALLET_INTEGRATION.md` for full setup and troubleshooting guide.

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
- **Spending summary bar** for NFT trigger testing (Total USD spent, APE used, USDC.e used)

**Spending Summary (for NFT Trigger Testing):**
The component displays a secondary stats bar with spending totals to help verify NFT pool contributions:
- **Total Spent (USD)**: Approximate USD equivalent of all ball purchases
- **APE Used**: Total APE spent (if any APE purchases)
- **USDC.e Used**: Total USDC.e spent (if any USDC.e purchases)
- Shows note: "(NFT pool: 97% of purchases)" as reminder of revenue split

This helps answer "have I spent enough to trigger an NFT purchase?" (threshold is $51 in SlabNFTManager)

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
- Uses **Caldera public RPC** (`https://apechain.calderachain.xyz/http`) for historical queries
- Caldera has NO block range limits (unlike Alchemy's 10-block free tier limit)
- Queries 25,000 blocks (~14 hours at 2s/block) by default
- Creates separate viem `PublicClient` for historical event fetching
- Uses Wagmi `useWatchContractEvent` for real-time updates (new events)
- Filters events by player address (indexed parameter: `buyer`, `thrower`, `catcher`)
- Sorts transactions by timestamp (newest first)

**RPC Architecture:**
```typescript
// Historical queries - Caldera public RPC (no limits)
const publicRpcClient = createPublicClient({
  chain: apeChainMainnet,
  transport: http('https://apechain.calderachain.xyz/http'),
});

// Real-time subscriptions - Wagmi's configured client (Alchemy)
useWatchContractEvent({ ... });
```

**Why Two RPC Clients:**
- Alchemy free tier limits `eth_getLogs` to 10 blocks per request (400 errors)
- Too many chunked requests hit rate limits (429 errors)
- Caldera public RPC has no block range limits, ideal for historical queries
- Wagmi client still used for real-time event subscriptions

### PokemonCard Component
Reusable component for displaying Slab NFTs as Pokemon cards with metadata:

**Location:** `src/components/PokemonCard/PokemonCard.tsx`

**Features:**
- Fetches NFT metadata via `useSlabNFTMetadata` hook
- Displays card image from IPFS (with fallback handling)
- Shows NFT name from metadata (not generic "Slab NFT")
- Loading skeleton animation while fetching
- Error placeholder if metadata fetch fails
- Compact mode for smaller displays
- Optional attributes display
- Optional Apescan link

**Props:**
```typescript
interface PokemonCardProps {
  tokenId: bigint;           // NFT token ID to display
  showLoading?: boolean;     // Show skeleton while loading (default: true)
  showError?: boolean;       // Show error state on failure (default: true)
  showAttributes?: boolean;  // Show card attributes (default: false)
  compact?: boolean;         // Compact size mode (default: false)
  showTokenId?: boolean;     // Show token ID below name (default: true)
  className?: string;        // Custom CSS class
  onClick?: () => void;      // Click handler
  showViewLink?: boolean;    // Show "View on Apescan" link (default: false)
}
```

**Usage:**
```tsx
import { PokemonCard } from './components/PokemonCard';

// Basic usage
<PokemonCard tokenId={BigInt(300)} />

// Full featured
<PokemonCard
  tokenId={BigInt(300)}
  showAttributes
  showViewLink
  onClick={() => openDetailModal(300)}
/>

// Compact mode for lists
<PokemonCard tokenId={BigInt(300)} compact />
```

**Integration:**
- Used in `CatchWinModal` to display won NFTs
- Used in `AdminDevTools` for Token 300 metadata testing
- Can be used in any inventory or collection display

### AdminDevTools Component
Development panel for SlabNFTManager v2.2.0 diagnostics and admin operations:

**Location:** `src/components/AdminDevTools/AdminDevTools.tsx`

**Access:**
- Dev mode only (URL param `?dev=1` or `localStorage.setItem('pokeballTrader_devMode', 'true')`)
- Press **F2** to toggle panel visibility
- Purple "DEV TOOLS" button in bottom-left corner

**Features:**
1. **Contract Status** - Real-time SlabNFTManager state:
   - USDC.e balance with auto-purchase status
   - Inventory count vs max (e.g., "3/20")
   - Pending VRF requests count
   - canAutoPurchase check result

2. **Token 300 Metadata Test** - Verify IPFS metadata loading:
   - Displays Token 300 using PokemonCard component
   - Shows raw metadata JSON for debugging

3. **Find Untracked NFTs** - Discover NFTs received via `transferFrom()`:
   - Search by ID range (start, end)
   - Lists NFTs owned by contract but not in inventory tracking
   - One-click batch recovery

4. **Fix Stuck Pending Requests** - Clear stale VRF request counts:
   - Clear specific request ID
   - Reset entire pending count (emergency)

**Owner Detection:**
- Compares connected wallet to hardcoded owner address
- Read-only users see status but cannot execute admin functions
- Admin functions show "Connect owner wallet" when not owner

**Props:**
```typescript
interface AdminDevToolsProps {
  isOpen: boolean;
  onClose: () => void;
  connectedAddress?: `0x${string}`;
}
```

**Usage:**
```tsx
import { AdminDevTools } from './components/AdminDevTools';

// In App.tsx (already integrated)
{isDevMode && (
  <AdminDevTools
    isOpen={isAdminToolsOpen}
    onClose={() => setIsAdminToolsOpen(false)}
    connectedAddress={account}
  />
)}
```

**Console Logs:**
- `[AdminDevTools] Finding untracked NFTs in range X-Y`
- `[AdminDevTools] Recovering NFT X`
- `[AdminDevTools] Clearing pending request X`

### HelpModal Component
In-game "How to Play" help modal explaining Pokemon catching mechanics:

**Location:** `src/components/HelpModal/HelpModal.tsx`

**Props:**
```typescript
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Step-by-step gameplay instructions (Buy Balls → Find Pokemon → Throw & Catch → Collect NFT)
- Ball type info with catch rates (2%, 20%, 50%, 99%)
- Color-coded ball indicators matching game UI
- ESC key to close
- Click outside to close
- Pixel-art styling consistent with game theme

**First-Visit Auto-Open:**
- On first visit, modal auto-opens after 1 second delay
- Sets `localStorage.setItem('pokemonTrader_helpSeen', 'true')` to prevent re-opening
- Users can always reopen via the "?" button in the HUD

**HUD Integration:**
- Yellow "?" button appears in GameHUD next to SHOP button
- Button only renders when `onShowHelp` prop is provided to GameHUD

**Usage:**
```tsx
import { HelpModal } from './components/HelpModal';

// State management
const [showHelp, setShowHelp] = useState(false);

// Render
<HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

// Pass callback to HUD
<GameHUD playerAddress={account} onShowHelp={() => setShowHelp(true)} />
```

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

### PokeballGame Contract (v1.7.0)
Pokemon catching mini-game with provably fair mechanics:

**Versions:**
| Version | MAX_ACTIVE_POKEMON | Key Features | Status |
|---------|-------------------|--------------|--------|
| v1.1.0 | 3 | Initial release | Legacy (deprecated) |
| v1.2.0 | 20 | 20 Pokemon support | Superseded |
| v1.3.0 | 20 | Configurable pricing, $49.90 cap, enhanced events | Superseded |
| v1.3.1 | 20 | WAPE token fix for APE payments | Superseded |
| v1.4.0 | 20 | Native APE payments via msg.value | Superseded |
| v1.4.1 | 20 | Fee calculation fix - no user markup | Superseded |
| v1.4.2 | 20 | Division by zero fix in calculateAPEAmount() | Superseded |
| v1.5.0 | 20 | Unified payments: APE auto-swap to USDC.e, 97% to SlabNFTManager | Superseded |
| v1.6.0 | 20 | Pyth Entropy for randomness (replaces POP VRNG, no whitelist needed) | Superseded |
| v1.7.0 | 20 | **Random NFT selection using Pyth Entropy random number** | **Latest** |

**Deployed Addresses:**
- Proxy: `0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f`
- Implementation (v1.7.0): `0xc087bCcFF99431787d4C38bb3378d45726Dc7DE4` (deployed 2026-01-24)
- Implementation (v1.6.0): `0x363f32ca7Cf83a215aDef4B139a47cAd323F1482` (superseded)
- Implementation (v1.5.0): `0xc3EB6a8C02b6E6013B95492eC3Dc15333c52A89E` (superseded)
- Implementation (v1.4.2): `0x2cbF8E954D29E2e08E4E521ac031930543962F13` (superseded)
- Implementation (v1.4.1): `0xac45C2104c49eCD51f1B570e6c5d962EB10B72Cc` (superseded)
- Implementation (v1.2.0): `0x71ED694476909FD5182afE1fDc9098a9975EA6b5` (legacy)

**v1.7.0 Unified Payment Flow:**
All payments (APE or USDC.e) follow the same economics:
```
User pays in APE or USDC.e
    ↓
APE → auto-swap to USDC.e via Camelot DEX
USDC.e → pass through directly
    ↓
Split: 3% → treasury (accumulatedUSDCFees)
       ~96.5% → SlabNFTManager.depositRevenue() (NFT pool)
       ~0.5% → APE buffer for Entropy fees + SlabMachine pull gas
    ↓
SlabNFTManager.checkAndPurchaseNFT() triggers auto-buy if ≥$51
    ↓
On catch success: random NFT selected from pool via Pyth Entropy
```

**APE Buffer for Entropy/Ops (~0.5%):**
A small slice of revenue is retained in APE to fund:
- Pyth Entropy fees for catch randomness (~0.073 APE per throw)
- SlabMachine pull gas when auto-purchasing NFTs
- Future randomness requests

This buffer is platform-controlled and not withdrawable as player rewards. It ensures players pay only ball prices while the platform covers Entropy and gas costs. Effective RTP for players remains ~97%.

**Payment Methods (v1.5.0):**
| Token | Method | Approval Required | What Happens |
|-------|--------|------------------|--------------|
| APE | Native via `msg.value` | **NO** | Auto-swapped to USDC.e via Camelot |
| USDC.e | ERC-20 `transferFrom` | Yes | Direct USDC.e payment |

**Camelot DEX Integration:**
- Router: `0xC69Dc28924930583024E067b2B3d773018F4EB52` (SwapRouter AMMv3)
- WAPE: `0x48b62137EdfA95a428D35C09E44256a739F6B557`
- Slippage: Configurable (default 1%)

**Fee Structure (v1.7.0 - Unified USDC.e + APE Buffer):**
Users pay the **exact ball price** with no markup. Fees are split internally:
| User Pays | Treasury (3%) | NFT Pool (~96.5%) | APE Buffer (~0.5%) |
|-----------|--------------|-------------------|-------------------|
| $1.00 | $0.03 | ~$0.965 | ~$0.005 |
| $10.00 | $0.30 | ~$9.65 | ~$0.05 |
| $25.00 | $0.75 | ~$24.13 | ~$0.12 |
| $49.90 | $1.50 | ~$48.15 | ~$0.25 |

The APE buffer funds Entropy fees and SlabMachine pull gas. Players still see ~97% RTP.

**v1.4.1 Bug Fix:** Previous versions calculated fees from `msg.value` (which could include user-sent buffer), causing users to overpay. Now fees are calculated from the exact required amount.

**v1.4.2 Bug Fix:** Fixed division by zero in `calculateAPEAmount()` when `apePriceUSD` was 0 (uninitialized). Now defaults to $0.64 (64000000 in 8 decimals) if `apePriceUSD` is not set. Upgrade script also auto-sets APE price after deployment.

**v1.5.0 Swap Fix:** The initial v1.5.0 deployment had swap failures due to:
1. Missing WAPE approval to Camelot router before swap
2. Slippage check used contract's `apePriceUSD` ($0.64) but DEX pool rate was different (~$0.19)

Fixed by:
- Adding WAPE approval in `_swapAPEtoUSDC()` before calling Camelot
- Setting `amountOutMinimum: 0` to accept market rate (DEX handles slippage via deadline)
- Processing whatever USDC.e the market gives (3%/97% split on actual received amount)

**APE Price Configuration:**
The contract stores `apePriceUSD` (8 decimals) to calculate how much APE equals a given USD amount.
- Formula: `apeAmount = (usdcAmount * 1e20) / apePriceUSD`
- Example: $25 at $0.19/APE = (25000000 * 1e20) / 19000000 = ~131.58 APE

**IMPORTANT:** The `apePriceUSD` must be kept updated to match market price, otherwise users will be under/overcharged in APE. Use `setAPEPrice(newPrice)` (owner only) to update.

| APE Market Price | apePriceUSD Value (8 decimals) | Script to Update |
|-----------------|-------------------------------|------------------|
| $0.19 | 19000000 | `await contract.setAPEPrice(19000000)` |
| $0.50 | 50000000 | `await contract.setAPEPrice(50000000)` |
| $1.00 | 100000000 | `await contract.setAPEPrice(100000000)` |

To check current price: `await contract.apePriceUSD()` → returns 8-decimal value.

**Ball System (Default Prices - Configurable in v1.3.0+):**
| Ball Type | Default Price | Default Catch Rate |
|-----------|---------------|-------------------|
| Poke Ball | $1.00 | 2% |
| Great Ball | $10.00 | 20% |
| Ultra Ball | $25.00 | 50% |
| Master Ball | $49.90 | 99% |

**Features:**
- UUPS upgradeable proxy pattern
- **v1.4.0+:** APE payments use native APE via `msg.value` (like ETH on Ethereum)
- **v1.4.1:** Users pay exact ball price - no fee markup (fees split internally)
- USDC.e payments use ERC-20 `transferFrom` (requires approval)
- **v1.6.0:** Pyth Entropy integration for fair randomness (replaces POP VRNG)
- **v1.7.0:** Revenue split: 3% treasury, ~96.5% NFT pool, ~0.5% APE buffer for Entropy/ops
- Delegates NFT management to SlabNFTManager
- Up to 20 active Pokemon spawns
- Max 3 throw attempts per Pokemon before relocation
- **v1.3.0:** Configurable ball prices via `setBallPrice()`
- **v1.3.0:** $49.90 max purchase cap per transaction (`MAX_PURCHASE_USD`)
- **v1.3.0:** Optional revert if no NFT available on catch (`revertOnNoNFT`)
- **v1.7.0:** Random NFT selection from inventory using Pyth Entropy—no deterministic "next in array" selection
- **v1.7.0:** Platform pays Entropy fees from APE buffer; players pay only ball prices

**Key Functions:**
- `purchaseBalls(ballType, quantity, useAPE)` - Buy balls (if useAPE=true, send APE via msg.value)
- `purchaseBallsWithAPE(ballType, quantity)` - **v1.4.0** Payable, send native APE
- `purchaseBallsWithUSDC(ballType, quantity)` - **v1.4.0** Uses ERC-20 USDC.e
- `throwBall(pokemonSlot, ballType)` - **v1.6.0 PAYABLE** - Requires ~0.073 APE for Entropy fee, returns sequence number
- `entropyCallback(sequenceNumber, provider, randomNumber)` - **v1.6.0** Pyth Entropy callback (replaces VRNG)
- `spawnPokemon(slot)` - **v1.6.0 PAYABLE** - Requires Entropy fee, spawn Pokemon at slot (owner only)
- `forceSpawnPokemon(slot, posX, posY)` - Spawn with specific position (owner only)
- `getAllPlayerBalls(player)` - Get player inventory
- `getAllActivePokemons()` - Get spawned Pokemon (returns `Pokemon[20]`)
- `setSlabNFTManager(address)` - Set NFT manager (owner only)
- `getNFTInventoryCount()` - Query NFT inventory via manager

**New Functions (v1.2.0+):**
- `getActivePokemonCount()` - Returns count of active Pokemon (uint8)
- `getActivePokemonSlots()` - Returns array of occupied slot indices (uint8[])

**New Functions (v1.3.0+):**
- `setBallPrice(ballType, newPrice)` - Set price for a ball type (owner only)
- `setCatchRate(ballType, newRate)` - Set catch rate for a ball type (owner only)
- `setPricingConfig(poke, great, ultra, master)` - Set all prices at once (owner only)
- `setOwnerWallet(newOwner)` - Transfer ownership with event (owner only)
- `setRevertOnNoNFT(bool)` - Configure NFT availability behavior (owner only)
- `getAllBallPrices()` - Get all 4 ball prices
- `getAllCatchRates()` - Get all 4 catch rates
- `initializeV130()` - One-time call after upgrade to set default prices

**New Functions (v1.4.0):**
- `purchaseBallsWithAPE(ballType, quantity)` - Payable function for native APE purchases
- `purchaseBallsWithUSDC(ballType, quantity)` - Explicit USDC.e purchase function
- `setAPEPrice(priceUSD)` - Update APE/USD price for cost calculations (owner only, 8 decimals)
- `apePriceUSD()` - View current APE price in USD (8 decimals)
- `calculateAPEAmount(usdcAmount)` - Calculate APE amount for given USDC.e (6 decimals in, 18 out)
- `withdrawAPEFees()` - Withdraw accumulated native APE fees to treasury (owner only)
- `withdrawAllAPE()` - Emergency withdraw all APE to treasury (owner only)
- `accumulatedAPEFees()` - View accumulated native APE platform fees

**New Functions (v1.5.0):**
- `initializeV150(router, wape, slippage)` - Initialize Camelot swap integration (one-time)
- `withdrawUSDCFees()` - Withdraw accumulated USDC.e fees to treasury (owner only)
- `setCamelotRouter(router)` - Update Camelot router address (owner only)
- `setSwapSlippage(bps)` - Set swap slippage tolerance in basis points (owner only)
- `accumulatedUSDCFees()` - View accumulated USDC.e platform fees
- `camelotRouter()` - View configured Camelot router address
- `wape()` - View WAPE token address
- `swapSlippageBps()` - View current slippage tolerance

**Internal Functions (v1.5.0):**
- `_swapAPEtoUSDC(apeAmount, expectedUSDC)` - Swap APE→USDC.e via Camelot
- `_processUnifiedPayment(usdcAmount)` - Split 3%/97% and fund SlabNFTManager

**New Functions (v1.6.0 - Pyth Entropy):**
- `initializeV160(entropyAddress)` - Initialize Pyth Entropy integration (one-time)
- `getThrowFee()` - View current Pyth Entropy fee for throwBall (~0.073 APE)
- `entropy()` - View Pyth Entropy contract address
- `entropyProvider()` - View Pyth Entropy provider address

**New Functions (v1.7.0 - Random NFT Selection):**
- `initializeV170()` - Initialize v1.7.0 (marks as initialized, no parameters needed)
- Uses `awardNFTToWinnerWithRandomness(winner, randomNumber)` instead of `awardNFTToWinner(winner)`
- Reuses Pyth Entropy random number from catch determination for NFT selection
- Uses different entropy bits: low 128 bits for catch rate, high 128 bits for NFT index
- Formula: `(randomNumber >> 128) % inventorySize` for unbiased index selection

**Internal Callback Handlers:**
- `_handleSpawnCallback()` - Creates Pokemon at Entropy-determined position
- `_handleThrowCallback()` - Determines catch success, handles NFT award (v1.7.0: passes randomNumber to SlabNFTManager)
- `_handleSuccessfulCatch()` - **v1.7.0** Now calls `awardNFTToWinnerWithRandomness()` for random NFT selection
- `entropyCallback()` - **v1.6.0** Pyth Entropy calls back with randomness (internal)

**Events for Frontend:**
- `BallPurchased(buyer, ballType, quantity, usedAPE, totalAmount)` - **v1.3.0 adds totalAmount**
- `ThrowAttempted`, `CaughtPokemon`, `FailedCatch`, `PokemonRelocated`
- `WalletUpdated(walletType, oldAddress, newAddress)` - **v1.3.0 includes "owner" type**
- `RevenueSentToManager` - When revenue deposited to SlabNFTManager
- `PokemonSpawned` - slotIndex is 0-19
- `RandomnessReceived(requestId, randomNumber, isSpawnRequest)` - **v1.3.0 new**
- `BallPriceUpdated(ballType, oldPrice, newPrice)` - **v1.3.0 new**
- `CatchRateUpdated(ballType, oldRate, newRate)` - **v1.3.0 new**
- `APESwappedToUSDC(apeAmount, usdcAmount)` - **v1.5.0 new** - When APE swapped
- `USDCFeesWithdrawn(recipient, amount)` - **v1.5.0 new** - When USDC fees withdrawn
- `SwapSlippageUpdated(oldSlippage, newSlippage)` - **v1.5.0 new**
- `CamelotRouterUpdated(oldRouter, newRouter)` - **v1.5.0 new**

**Upgrade Commands:**
```bash
# Upgrade to v1.5.0 (Unified Payments + Auto-Swap)
npx hardhat run contracts/deployment/upgrade_PokeballGameV5.cjs --network apechain

# Upgrade to v1.7.0 (Random NFT Selection - requires SlabNFTManager v2.3.0 first!)
npx hardhat run contracts/deployment/upgrade_SlabNFTManagerV2_3.cjs --network apechain  # First
npx hardhat run contracts/deployment/upgrade_PokeballGameV7.cjs --network apechain      # Second
```

**v1.7.0 Payment Flow:**
- **APE payments**: User sends native APE → contract wraps to WAPE → swaps via Camelot to USDC.e → splits 3% treasury / ~96.5% NFT pool / ~0.5% APE buffer
- **USDC.e payments**: User sends USDC.e (requires approval) → same split
- **Both paths**: ~96.5% goes to `SlabNFTManager.depositRevenue()` then `checkAndPurchaseNFT()`
- **APE buffer**: ~0.5% retained in APE to fund Entropy fees and SlabMachine pull gas (platform-controlled, not player rewards)
- **Fee withdrawal**: Owner calls `withdrawUSDCFees()` to send accumulated USDC.e to treasury

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
- v1.4.0 adds native APE payments via msg.value (no more ERC-20 approval for APE!)
- v1.6.0 adds Pyth Entropy for randomness (replaces POP VRNG)
- v1.7.0 adds random NFT selection using same Entropy random number from catch determination
- See `docs/UPGRADE_V1.2.0_20_POKEMON.md` for v1.2.0 upgrade guide

### SlabNFTManager Contract (v2.3.0)
NFT inventory management and auto-purchase from SlabMachine:

**Versions:**
| Version | MAX_INVENTORY_SIZE | Key Features | Status |
|---------|-------------------|--------------|--------|
| v1.0.0 | 10 | Initial release | Superseded |
| v2.0.0 | 20 | Max 20 NFTs, setOwnerWallet, enhanced events | Superseded |
| v2.1.0 | 20 | Fixed SlabMachine pull price bug, emergency revenue withdrawal | Superseded |
| v2.2.0 | 20 | NFT recovery functions, transferFrom fix, pending request clearing | Superseded |
| v2.3.0 | 20 | **Random NFT selection using Pyth Entropy, O(1) swap-and-pop** | **Latest** |

**Deployed Addresses:**
- Proxy: `0xbbdfa19f9719f9d9348F494E07E0baB96A85AA71`
- Implementation (v2.3.0): `0xC4DDe9b1BaE8f77e08c035e0D5E8aBA59238Ad13` (deployed 2026-01-24)
- Implementation (v2.2.0): `0x05c0e3aD3DB67285b7CDaA396f3993A3130b6E25` (superseded)
- Implementation (v2.1.0): `0xd12644fba183c4bea6f7d8b92c068640929631b6` (superseded)

**Features:**
- UUPS upgradeable proxy pattern
- Max 10 NFTs in inventory (v1.0.0) / **Max 20 NFTs (v2.0.0)**
- Holds a pool of Pokemon card NFTs for random award on catch success
- Auto-purchase when USDC.e balance >= $51
- **v2.3.0:** Random NFT selection from pool using Pyth Entropy—no deterministic "next in array" selection
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

**New Functions (v2.1.0):**
- `PULL_PRICE_USDC` - Fixed $51 approval amount for SlabMachine (fixes allowance bug)
- `getPullPrice()` - Returns the fixed pull price ($51 USDC.e)
- `emergencyWithdrawRevenue(amount)` - Withdraw specific amount of USDC.e, keeps NFTs (owner only)
- `emergencyWithdrawAllRevenue()` - Withdraw ALL USDC.e, keeps NFTs (owner only)

**New Functions (v2.2.0):**
- `recoverUntrackedNFT(tokenId)` - Manually add NFTs that arrived via transferFrom (owner only)
- `batchRecoverUntrackedNFTs(tokenIds[])` - Recover multiple untracked NFTs in one tx (owner only)
- `getUntrackedNFTs(startId, endId)` - Find NFTs owned but not tracked in inventory
- `clearPendingRequest(requestId)` - Fix stuck pendingRequestCount (owner only)
- `resetPendingRequestCount()` - Emergency reset pending count to zero (owner only)
- `canAutoPurchase()` - View function for frontend diagnostics

**New Functions (v2.3.0):**
- `awardNFTToWinnerWithRandomness(winner, randomNumber)` - Award random NFT using Pyth Entropy randomness (PokeballGame only)
- Uses `(randomNumber >> 128) % inventorySize` for independent random index selection
- O(1) removal via `_removeFromInventoryAtIndex()` using swap-and-pop pattern
- Backwards compatible: `awardNFTToWinner()` (FIFO) still works for legacy calls

**v2.1.0 Bug Fix:**
The `slabMachine.machineConfig().usdcPullPrice` returned `1` (stale/incorrect), but the actual SlabMachine charges $50 per pull. This caused "ERC20: transfer amount exceeds allowance" errors when auto-purchasing NFTs. Fixed by using a hardcoded `PULL_PRICE_USDC = $51` constant for approvals.

**v2.2.0 Bug Fix - SlabMachine transferFrom Issue:**
SlabMachine uses `transferFrom()` instead of `safeTransferFrom()` when transferring NFTs after VRF callback. This means `onERC721Received()` is **never called**, and NFTs arrive without being tracked in inventory.

**Symptoms:**
- `balanceOf(SlabNFTManager)` shows 1 NFT
- `getInventory()` returns empty array
- `pendingRequestCount` stays at 1 forever

**Solution:** Use `recoverUntrackedNFT(tokenId)` to manually add the NFT to inventory tracking, then `clearPendingRequest(0)` to reset the pending counter.

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
- `RevenueWithdrawn(recipient, amount, remainingBalance)` - **v2.1.0 new** - USDC.e revenue withdrawn
- `NFTRecovered(tokenId, inventorySize)` - **v2.2.0 new** - Untracked NFT recovered to inventory
- `PendingRequestCleared(requestId, remainingPending)` - **v2.2.0 new** - Pending request counter fixed
- `NFTAwardedWithRandomness(winner, tokenId, selectedIndex, inventorySize, remainingInventory)` - **v2.3.0 new** - Random NFT awarded to winner

**Upgrade Commands:**
```bash
# Upgrade to v2.0.0 (max 20 NFTs)
npx hardhat run contracts/deployment/upgrade_SlabNFTManagerV2.cjs --network apechain

# Upgrade to v2.1.0 (fixed pull price bug)
npx hardhat run contracts/deployment/upgrade_SlabNFTManagerV2_1.cjs --network apechain

# Upgrade to v2.2.0 (NFT recovery, transferFrom fix)
npx hardhat run contracts/deployment/upgrade_SlabNFTManagerV2_2.cjs --network apechain

# Upgrade to v2.3.0 (random NFT selection)
npx hardhat run contracts/deployment/upgrade_SlabNFTManagerV2_3.cjs --network apechain
```

**Contract Integration Flow:**
```
Player → PokeballGame.purchaseBalls()
    ↓
Revenue split:
  - 3% → treasury (accumulatedUSDCFees)
  - ~96.5% → SlabNFTManager.depositRevenue() (NFT pool)
  - ~0.5% → APE buffer for Entropy fees + SlabMachine pull gas
    ↓
SlabNFTManager → SlabMachine.pull() (when >= $51)
    ↓
SlabMachine → requests VRF randomness (Pyth Entropy)
    ↓
VRF callback → SlabMachine determines rarity → mints NFT
    ↓
SlabMachine → SlabNFTManager (NFT via transferFrom - NOT safeTransferFrom!)
    ↓
⚠️ NFT arrives but onERC721Received() NOT called (SlabMachine bug)
    ↓
Owner runs: recoverUntrackedNFT(tokenId) + clearPendingRequest(0)
    ↓
NFT now in inventory, ready to award
    ↓
Player catches Pokemon → PokeballGame._handleSuccessfulCatch()
    ↓
PokeballGame v1.7.0+ → SlabNFTManager.awardNFTToWinnerWithRandomness(player, randomNumber)
    ↓
SlabNFTManager v2.3.0 → Random index selection via (randomNumber >> 128) % inventorySize
    ↓
O(1) swap-and-pop removal → Random NFT transferred to Player

Note: The APE buffer is platform-controlled and not withdrawable as player rewards.
It exists to guarantee randomness and SlabMachine pulls without charging players extra fees.
Effective RTP for players remains ~97%.
```

**SlabMachine VRF Flow (Slab Reveal):**
The SlabMachine uses VRF (Pyth Entropy) for randomness. When `pull()` is called:
1. SlabMachine requests random number from VRF provider
2. VRF callback fires (takes seconds to minutes)
3. SlabMachine uses random number to determine rarity (COMMON/RARE/EPIC/LEGEND/LEGENDARY)
4. SlabMachine calls `slabNFT.transferFrom()` to send NFT to recipient

**IMPORTANT:** SlabMachine uses `transferFrom()`, not `safeTransferFrom()`. This means:
- `onERC721Received()` is **never called** on the recipient
- NFTs arrive without triggering inventory tracking
- Must use `recoverUntrackedNFT()` to manually add to inventory

### Test Fund Recycling (v2.1.0+)
During testing and development, funds accumulate in the contracts. Use the `withdraw_test_funds.cjs` script to recycle these back to the treasury.

**Script Location:** `scripts/withdraw_test_funds.cjs`

**Available Commands:**
| Command | Description | Contract Function |
|---------|-------------|-------------------|
| `status` | Show all balances (APE fees, USDC fees, SlabNFTManager revenue) | Read-only |
| `usdc` | Withdraw USDC.e platform fees from PokeballGame (3%) | `withdrawUSDCFees()` |
| `ape` | Withdraw legacy APE platform fees from PokeballGame (v1.4.x) | `withdrawAPEFees()` |
| `revenue` | Withdraw ALL USDC.e from SlabNFTManager (97% pool) | `emergencyWithdrawAllRevenue()` |
| `revenue:X` | Withdraw X USDC.e from SlabNFTManager (e.g., `revenue:10` for $10) | `emergencyWithdrawRevenue(amount)` |
| `allape` | ⚠️ EMERGENCY - Withdraw ALL APE from PokeballGame | `withdrawAllAPE()` |

**Important Notes on APE in PokeballGame (v1.6.0+):**
- Players pay Pyth Entropy fees (~0.073 APE) directly via `msg.value` when calling `throwBall()`
- The entropy fee goes directly to Pyth, NOT to the contract's fee pools
- The contract does NOT maintain an APE buffer for entropy fees
- Any APE in the contract is from: (1) legacy v1.4.x platform fees, (2) failed refunds
- The `allape` command is marked EMERGENCY because it drains everything

**Usage Examples:**
```bash
# Check current balances
node scripts/withdraw_test_funds.cjs status

# Withdraw platform fees (3%)
node scripts/withdraw_test_funds.cjs usdc
node scripts/withdraw_test_funds.cjs ape

# Withdraw player pool revenue (97%)
node scripts/withdraw_test_funds.cjs revenue
node scripts/withdraw_test_funds.cjs revenue:25

# Emergency only - drains ALL APE
node scripts/withdraw_test_funds.cjs allape
```

**When to Use Each Command:**
- `status` - Always run first to see what's available
- `usdc` - Collect USDC.e platform fees (3% of all ball purchases)
- `ape` - Collect legacy APE platform fees (should be 0 for v1.5.0+ purchases)
- `revenue` - Recycle SlabNFTManager funds back to treasury for more testing
- `revenue:X` - Partial withdrawal when you want to keep some balance in SlabNFTManager
- `allape` - ⚠️ Emergency only, may include pending refunds or stuck funds

**Requirements:**
- Must run with owner wallet (`0x47c11427B9f0DF4e8bdB674f5e23C8E994befC06`)
- Requires `DEPLOYER_PRIVATE_KEY` in `.env`
- All withdrawals go to treasury wallet (`0x1D1d0E6eF415f2BAe0c21939c50Bc4ffBeb65c74`)

### APE Price Auto-Update Script
Automatically updates the on-chain `apePriceUSD` value from CoinGecko market data. Run hourly to keep APE payment pricing accurate.

**Script Location:** `scripts/update_ape_price.cjs`

**Features:**
- Fetches APE/USD price from CoinGecko API
- Converts to 8-decimal on-chain format
- Safety check: rejects >30% price changes (configurable)
- Sanity bounds: $0.01 - $100 USD
- Dry-run mode for testing
- Timestamped logging for cron output

**Usage:**
```bash
# Check current price and what would be updated (no transaction)
node scripts/update_ape_price.cjs --dry-run

# Update price on-chain
node scripts/update_ape_price.cjs

# Force update even if change exceeds 30% safety limit
node scripts/update_ape_price.cjs --force
```

**Example Output:**
```
[2026-01-23T05:51:05.853Z] SUCCESS: APE price updated $0.1900 -> $0.1901 (19000000 -> 19012300), tx: 0x318c99...
```

**Scheduling (Hourly):**

Linux/macOS (cron):
```bash
# Edit crontab
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * cd /path/to/Pokemon-Trader && node scripts/update_ape_price.cjs >> logs/ape_price.log 2>&1
```

Windows (Task Scheduler):
1. Open Task Scheduler → Create Basic Task
2. Trigger: Daily, repeat every 1 hour
3. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/update_ape_price.cjs`
   - Start in: `C:\path\to\Pokemon-Trader`
4. Optionally redirect output to a log file

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `DEPLOYER_PRIVATE_KEY` | (required) | Owner wallet private key |
| `APECHAIN_RPC_URL` | Caldera public | RPC endpoint |
| `APE_PRICE_API_URL` | CoinGecko | Alternative price API |
| `APE_PRICE_MAX_CHANGE_PCT` | 30 | Max allowed % change per update |

**Safety Checks:**
- **Price bounds**: Rejects prices outside $0.01 - $100 range
- **Change limit**: Rejects >30% change in single update (protects against bad API data)
- **Ownership verification**: Confirms signer is contract owner before sending tx
- Use `--force` to override change limit for legitimate large moves

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
Grass shard confetti effect beneath wild Pokemon - visual indicator for spawn locations:

**Location:** `src/game/entities/GrassRustle.ts`

**Properties:**
- `pokemonId: bigint` - Associated Pokemon ID
- `followTarget: Pokemon | null` - Pokemon being followed

**Methods:**
- `playRustle()` - Start burst animation then transition to idle flutter
- `stopRustle(immediate?)` - Stop animation with optional fade out
- `pause()` / `resume()` - Pause/resume idle flutter timer
- `setFollowTarget(pokemon)` - Change follow target
- `hasValidTarget()` - Check if following valid Pokemon
- `_resetForPool()` - Reset visual state for pool reuse (internal)

**Features:**
- **Particle-based confetti** - Small grass shards that burst upward and fall
- Auto-follows Pokemon position via scene update listener
- Renders just below Pokemon (depth 9 vs 10)
- Supports object pooling for efficient reuse
- Two-phase animation: burst on spawn, gentle idle flutter

**Visual Effect:**
- **Burst Phase (500ms)**: 12 shards (grass + dirt) shoot upward with horizontal spread
- **Idle Phase**: 3 shards every 800ms at 30% intensity for gentle flutter
- **Grass shards** (70%): Tall and thin (2-3px × 5-9px), various greens
- **Dirt shards** (30%): Short and wide (3-5px × 2-4px), brown tones for contrast
- Gravity simulation with fade-out in final 30% of lifespan
- Rotating shards for natural tumbling effect
- Higher contrast against green map for better visibility

**Configuration:**
```typescript
GRASS_RUSTLE_CONFIG = {
  DEPTH: 9,              // Just below Pokemon
  Y_OFFSET: 6,           // Position at Pokemon's feet
  FADE_IN_DURATION: 150,
  FADE_OUT_DURATION: 100,
  VISIBLE_ALPHA: 1.0,    // Fully opaque
}

SHARD_CONFIG = {
  BURST_COUNT: 12,       // Shards in initial burst
  IDLE_COUNT: 3,         // Shards per idle flutter
  GRASS_COLORS: [0x228B22, 0x32CD32, 0x3CB371, 0x2E8B57, 0x90EE90, 0x006400],
  DIRT_COLORS: [0x5D4037, 0x8B7355, 0xD2B48C], // dark soil, earth, tan
  DIRT_PROBABILITY: 0.30, // 30% dirt shards
  GRASS_WIDTH: 2-3,      // Tall thin grass blades
  GRASS_HEIGHT: 5-9,
  DIRT_WIDTH: 3-5,       // Short wide dirt clumps
  DIRT_HEIGHT: 2-4,
  VELOCITY_Y_MIN: -120,  // Upward velocity range
  VELOCITY_Y_MAX: -200,
  VELOCITY_X_RANGE: 60,  // Horizontal spread
  GRAVITY: 300,          // Downward acceleration
  LIFESPAN_BURST: 500,   // Burst shard lifespan (ms)
  LIFESPAN_IDLE: 400,    // Idle shard lifespan (ms)
  SPAWN_RADIUS: 12,      // Spawn area radius
  BURST_DURATION: 500,   // Time before transitioning to idle
  IDLE_INTERVAL: 800,    // Time between idle spawns
  IDLE_INTENSITY: 0.3,   // Velocity multiplier for idle
}
```

**No Texture Required:**
- Uses Phaser Graphics objects for shards (no sprite sheets needed)
- Each shard is a small filled rectangle with physics simulation

### ChiptuneSFX (Audio)
8-bit chiptune sound effects for Pokemon catching mechanics:

**Location:** `src/game/utils/chiptuneSFX.ts`

**Design Philosophy:**
- Retro 8-bit / chiptune-adjacent, short and snappy
- Very dry (no reverb) to sit cleanly under music
- Target length: 150-500ms, max 700ms for win fanfare
- 70-80% volume relative to background music

**Sound Effects:**
| SFX | Trigger | Duration | Description |
|-----|---------|----------|-------------|
| `playThrowStart()` | Ball leaves hand | ~200ms | Click + upward pitch blips + whoosh |
| `playBallImpact()` | Ball hits Pokemon | ~250ms | Low thump + higher bounce blip |
| `playCatchSuccess()` | Catch succeeds | ~600ms | C4-E4-G4-C5 ascending arpeggio + sparkle |
| `playCatchFail()` | Pokemon escapes | ~350ms | G3-E3-C3 descending womp |

**Sound Synthesis (Web Audio API):**
- **Square wave**: Bright 8-bit tones (throw blips, success arpeggio)
- **Triangle wave**: Softer bass (impact thump, fail womp)
- **White noise + highpass**: Clicks, sparkles, whoosh effects
- **ADSR envelope**: Fast attack (5-10ms), quick decay, no sustain

**Usage:**
```typescript
import { getChiptuneSFX, ChiptuneSFX } from '../utils/chiptuneSFX';

// Get singleton instance
const sfx = getChiptuneSFX();

// Play sounds (async, fire-and-forget)
sfx.playThrowStart();    // When throw animation begins
sfx.playBallImpact();    // When ball reaches Pokemon
sfx.playCatchSuccess();  // On catch success
sfx.playCatchFail();     // On catch failure

// Volume controls
sfx.setVolume(0.5);      // 0-1
sfx.mute();              // Silence all SFX
sfx.unmute();            // Restore volume
sfx.toggleMute();        // Toggle mute state
sfx.isSfxMuted();        // Check mute status
```

**Integration Points (CatchMechanicsManager):**
- `playBallThrow()` → calls `playThrowStart()` at start
- `playBallThrow()` → calls `playBallImpact()` when ball reaches target
- `playSuccessAnimation()` → calls `playCatchSuccess()`
- `playFailAnimation()` → calls `playCatchFail()`

**Configuration:**
```typescript
SFX_CONFIG = {
  MASTER_VOLUME: 0.75,      // 75% (relative to music ~100%)
  THROW_DURATION: 200,      // ms
  IMPACT_DURATION: 250,     // ms
  WIN_DURATION: 600,        // ms
  FAIL_DURATION: 350,       // ms
  NOTES: {
    C4: 261.63, E4: 329.63, G4: 392.00, C5: 523.25,  // Success arpeggio
    C3: 130.81, E3: 164.81, G3: 196.00,              // Fail motif
  }
}
```

**Browser Compatibility:**
- Uses `AudioContext` or `webkitAudioContext` fallback
- Auto-resumes suspended context on user interaction
- Graceful degradation if Web Audio API unavailable

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

**React-Phaser Sync:**
The `usePlayerBallInventory` hook automatically syncs on-chain inventory to the singleton:
```typescript
// In usePlayerBallInventory.ts - syncs when contract data loads
useEffect(() => {
  if (rawData && !isLoading) {
    const manager = getBallInventoryManager();
    manager.onInventorySynced({
      pokeBalls: Number(rawData[0]),
      greatBalls: Number(rawData[1]),
      ultraBalls: Number(rawData[2]),
      masterBalls: Number(rawData[3]),
    });
  }
}, [rawData, isLoading]);
```

This ensures Phaser's `CatchMechanicsManager` sees the same inventory as React components.

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
  useThrowFee,
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
| `usePurchaseBalls()` | Buy balls via dedicated functions: `purchaseBallsWithAPE` (payable) or `purchaseBallsWithUSDC` (nonpayable) |
| `useThrowBall()` | Throw ball at Pokemon slot (0-19), includes Entropy fee automatically |
| `useThrowFee()` | Get current Pyth Entropy fee for throwBall (~0.073 APE) |
| `useGetPokemonSpawns()` | Read all 20 Pokemon slots (polls every 5s) |
| `useActivePokemonCount()` | Get count of active Pokemon (efficient) |
| `useActivePokemonSlots()` | Get array of occupied slot indices |
| `usePlayerBallInventory(address)` | Read player's ball counts |
| `useContractEvents(eventName)` | Subscribe to contract events |
| `useTokenApproval(token, amount)` | Approval hook: APE=always approved, USDC.e=check allowance |
| `useApeApproval(amount)` | Returns isApproved: true (native APE, no approval needed) |
| `useUsdcApproval(amount)` | USDC.e token approval helper (requires ERC-20 approval) |
| `useApePriceFromContract()` | Read APE price from contract |
| `useContractDiagnostics()` | Environment sanity checks (APE price, NFT pool status, warnings) |
| `useSetOwnerWallet()` | Transfer ownership (owner only) |
| `useSetTreasuryWallet()` | Update treasury address (owner only) |

**Specialized Event Hooks:**
- `useBallPurchasedEvents()` - Ball purchase events
- `useCaughtPokemonEvents()` - Successful catch events
- `useFailedCatchEvents()` - Failed catch events
- `usePokemonSpawnedEvents()` - New spawn events
- `usePokemonRelocatedEvents()` - Relocation events
- `useAllGameEvents()` - All game events combined

**Usage Example (v1.6.0):**
```typescript
const { account } = useActiveWeb3React();

// Read hooks (v1.2.0+ - supports 20 Pokemon)
const { data: spawns, activeCount, activeSlotIndices } = useGetPokemonSpawns();
const { pokeBalls, greatBalls } = usePlayerBallInventory(account);
const { throwFee, formattedFee } = useThrowFee(); // v1.6.0 - ~0.073 APE

// Write hooks
const { write: purchase, isPending } = usePurchaseBalls();
const { write: throwBall, requestId, throwFee: inlineFee } = useThrowBall();

// Display fee to user
console.log(`Throw fee: ${formattedFee} APE`);

// Actions (always null-check write functions)
purchase?.(0, 5, false);              // Buy 5 Poké Balls with USDC.e
throwBall?.(spawns[0].slotIndex, 0);  // Throw Poké Ball - fee is auto-included!

// Event listeners
const { events: catches } = useCaughtPokemonEvents();
```

**Configuration:**
- Contract address: `VITE_POKEBALL_GAME_ADDRESS` env var
- ABI: `contracts/abi/abi_PokeballGameV5.json` (v1.5.x, unified payments)
- Chain: ApeChain Mainnet (33139)
- **Important:** ABI file must be a raw array `[...]`, not a Hardhat artifact object

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

**Token Approval (v1.4.0):**

**IMPORTANT:** On ApeChain, APE is the **native gas token** (like ETH on Ethereum), NOT an ERC-20.

| Token | Type | Approval Required |
|-------|------|------------------|
| APE | Native (msg.value) | **NO** |
| USDC.e | ERC-20 | Yes |

The `useTokenApproval` hook handles both cases automatically:
- For APE: Returns `isApproved: true` immediately (no contract calls needed)
- For USDC.e: Checks allowance and provides `approve()` function

```typescript
import {
  useTokenApproval,
  calculateTotalCost,
  useApePriceFromContract,
} from '../hooks/pokeballGame';

// In your component:
const { price: apePriceUSD } = useApePriceFromContract();
const cost = calculateTotalCost(ballType, quantity, useAPE, apePriceUSD);

const {
  isApproved,      // true for APE (native), checks allowance for USDC.e
  approve,         // No-op for APE, requests approval for USDC.e
  isApproving,     // Approval transaction pending (USDC.e only)
  allowance,       // maxUint256 for APE, actual allowance for USDC.e
} = useTokenApproval(useAPE ? 'APE' : 'USDC', cost);

// Flow:
if (!isApproved) {
  approve();  // Only triggers for USDC.e
  return;
}
// Purchase (APE sends via msg.value, USDC.e uses transferFrom):
purchaseBalls(ballType, quantity, useAPE, apePriceUSD);
```

**Why this matters:**
- APE purchases are simpler - no approval step needed, just send native APE
- USDC.e still requires approval before `purchaseBalls()` can call `transferFrom`
- The PokeBallShop component handles this automatically
- The hook follows React's rules of hooks (calls all hooks unconditionally)

**Token Addresses:**
- APE: Native gas token (18 decimals) - NO contract address
- USDC.e: `0xF1815bd50389c46847f0Bda824eC8da914045D14` (ERC-20, 6 decimals)
- WAPE: `0x48b62137EdfA95a428D35C09E44256a739F6B557` (wrapped APE, deprecated in v1.4.0)

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
- Quantity input per ball type (safe handling of NaN/empty values)
- Insufficient balance warning per row
- **Token approval flow**: Shows orange "Approve" button when approval needed
- **Approval status**: Shows loading state during approval transaction
- Transaction loading state with wallet prompt
- **Enhanced success display**: Shows transaction hash link to Apescan, detects NFT auto-purchase
- Error display with dismiss button
- No wallet connected warning
- **Warning banner**: Yellow banner appears if contract config looks unusual (uses `useContractDiagnostics`)

**Token Approval Flow:**
1. User selects quantity and payment token (APE or USDC.e)
2. Shop checks if contract has sufficient allowance via `useTokenApproval`
3. If not approved: Orange "APPROVE [TOKEN]" button shown
4. User clicks approve → wallet prompts for unlimited approval
5. After approval: Green "BUY" button becomes active
6. User clicks buy → purchase transaction executes

**Hooks Used:**
- `usePurchaseBalls()` - Contract write (stops on gas estimation failure)
- `usePlayerBallInventory(address)` - Read inventory
- `useApeBalanceWithUsd(address)` - APE balance with USD value
- `useUsdcBalance(address)` - USDC.e balance
- `useTokenApproval(token, amount)` - Check/request ERC-20 approval
- `useApePriceFromContract()` - Read APE price for cost calculation
- `useContractDiagnostics()` - Environment sanity checks (APE price, NFT pool status)
- `calculateTotalCost()` - Safe calculation (guards against NaN)

**Dynamic APE Pricing (v1.4.2+):**
The shop reflects live on-chain APE pricing for accurate cost display:

1. **Price Source**: `useApePriceFromContract()` reads `apePriceUSD` from PokeballGame contract (8 decimals)
2. **Cost Calculation**: `calculateTotalCost(ballType, qty, useAPE, apePriceUSD)` converts USD to APE
3. **Display**: When APE selected, each ball row shows `~X.XX APE (≈$Y.YY)`
4. **Rate Display**: Info box shows current rate: `1 APE ≈ $X.XXXX USD (updates periodically)`
5. **Auto-Update**: Contract price is updated hourly via `scripts/update_ape_price.cjs`

**Price Flow:**
```
CoinGecko API → update_ape_price.cjs (hourly) → setAPEPrice() on-chain
                                                        ↓
                                    useApePriceFromContract() → React Query cache
                                                        ↓
                                    BallRow displays APE amount per ball
```

**Reactivity:**
- React Query refetches `apePriceUSD` when component mounts or on window focus
- No manual refresh needed - shop reflects updated price automatically
- If on-chain price changes, next shop open shows new rate

**Responsive Layout:**
The modal is designed to work on smaller screens and when DevTools is open:
- `maxWidth: min(600px, calc(100vw - 32px))` - Clamps to viewport width
- `overflowX: hidden` - Prevents horizontal scrollbar
- Ball rows use `flexWrap: wrap` - Elements wrap on narrow widths
- All sections use `boxSizing: border-box` - Padding doesn't cause overflow
- Compact padding and font sizes for tighter layouts
- Per-transaction $49.90 cap enforced with "Over Cap" button (red)

**Global Scrollbar Hiding:**
Scrollbars are hidden globally via `src/index.css`:
```css
/* Firefox */
* { scrollbar-width: none; }

/* Legacy Edge/IE */
* { -ms-overflow-style: none; }

/* Chrome/Edge/Safari */
*::-webkit-scrollbar { display: none; }
```
Scrolling still works via mouse wheel, touchpad, and touch drag. This applies to:
- Main game canvas/page
- All modals (PokeBallShop, TransactionHistory, etc.)

**Warning Banner:**
A yellow warning banner appears when `useContractDiagnostics().hasWarnings` is true. Warning conditions include:
- APE price is 0 or looks unusually low/high
- NFT pull price looks incorrect
- NFT inventory is full

**Enhanced Success Display:**
After successful purchase, shows:
- Green success box with "Purchase successful!" message
- Transaction hash as clickable link to Apescan
- **NFT Trigger Badge**: Cyan "NFT Auto-Purchase Triggered!" badge if `NFTPurchaseInitiated` event detected in receipt logs
- Automatically analyzes transaction logs for SlabNFTManager events

**NFT Auto-Purchase Detection:**
The shop analyzes transaction receipt logs for:
```typescript
// NFTPurchaseInitiated event from SlabNFTManager
// Emitted when purchase triggers auto-purchase threshold
if (log.address.toLowerCase() === SLAB_NFT_MANAGER_ADDRESS.toLowerCase()) {
  // Look for NFTPurchaseInitiated event
}
```

### useContractDiagnostics Hook
Environment sanity check hook for PokeballGame and SlabNFTManager contracts:

**Location:** `src/hooks/pokeballGame/useContractDiagnostics.ts`

**Usage:**
```typescript
import { useContractDiagnostics } from '../hooks/pokeballGame';

const {
  apePriceUSD,               // bigint - raw 8-decimal value
  apePriceFormatted,         // number - e.g., 0.19
  pullPrice,                 // bigint - NFT pull cost (6 decimals)
  pullPriceFormatted,        // number - e.g., 51.00
  slabNFTManagerBalance,     // bigint - USDC.e pool balance
  slabNFTManagerBalanceFormatted, // number - e.g., 125.50
  canAutoPurchase,           // boolean - balance >= threshold
  inventoryCount,            // number - current NFT count
  maxInventorySize,          // number - max NFTs (20)
  hasWarnings,               // boolean - any warnings present
  warnings,                  // string[] - warning messages
  isLoading,                 // boolean - data loading
  isError,                   // boolean - fetch error
  refetch,                   // () => void - manual refresh
} = useContractDiagnostics();

if (hasWarnings) {
  console.warn('Contract config issues:', warnings);
}
```

**Data Sources:**
- `apePriceUSD`: Reads from PokeballGame.`apePriceUSD()` (8 decimals)
- `canAutoPurchase`: Reads from SlabNFTManager.`canAutoPurchase()` (returns tuple)
- `inventoryCount`: Reads from SlabNFTManager.`getInventoryCount()`
- `maxInventorySize`: Reads from SlabNFTManager.`MAX_INVENTORY_SIZE()`

**Return Shape:**
```typescript
interface ContractDiagnostics {
  apePriceUSD: bigint;
  apePriceFormatted: number;
  pullPrice: bigint;
  pullPriceFormatted: number;
  autoPurchaseThreshold: bigint;
  autoPurchaseThresholdFormatted: number;
  slabNFTManagerBalance: bigint;
  slabNFTManagerBalanceFormatted: number;
  canAutoPurchase: boolean;
  inventoryCount: number;
  maxInventorySize: number;
  hasWarnings: boolean;
  warnings: string[];
  isLoading: boolean;
  isError: boolean;
}
```

**Polling:**
- Stale time: 30 seconds
- Refetch interval: 60 seconds
- Manual refetch available via `refetch()`

### usePurchaseBalls Error Handling
The `usePurchaseBalls` hook now includes robust error handling that prevents failed transactions:

**Gas Estimation Failure Behavior:**
1. Hook calls `publicClient.estimateContractGas()` before sending transaction
2. If estimation fails, transaction is **NOT** sent to wallet
3. Error is captured in `localError` state and surfaced via `error` return value
4. Console logs detailed error information for debugging

**Error Types Detected:**
| Error Pattern | Behavior | User Message |
|---------------|----------|--------------|
| "allowance" / "exceeds" | Stop transaction | "ERC-20 allowance error. For USDC.e payments, please approve first." |
| "insufficient" / "funds" | Stop transaction | "Insufficient APE balance. Need at least X APE plus gas." |
| Other errors | Stop transaction | "Transaction would fail: [error message]" |

**Console Debugging:**
When gas estimation fails, the hook logs:
```javascript
[usePurchaseBalls] Gas estimation failed: <error>
[usePurchaseBalls] Error details: {
  message: "...",
  isAllowanceError: true/false,
  isInsufficientFunds: true/false
}
[usePurchaseBalls] STOPPING - Gas estimation failed. Transaction would likely fail.
```

**Why This Matters:**
- Prevents MetaMask from showing insane gas estimates (7M+ APE)
- Gives users clear error messages before they confirm anything
- Distinguishes between approval issues and balance issues
- v1.4.0+ dedicated functions (`purchaseBallsWithAPE`, `purchaseBallsWithUSDC`) avoid cross-payment-type interference

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
  /** Ref to receive visual throw callback (for CatchAttemptModal integration) */
  onVisualThrowRef?: React.MutableRefObject<((pokemonId: bigint, ballType: BallType) => void) | null>;
  /** Ref to receive catch result callback (for notifying Phaser of contract events) */
  onCatchResultRef?: React.MutableRefObject<((caught: boolean, pokemonId: bigint) => void) | null>;
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
- **Visual Throw Bridge**: When `onVisualThrowRef` is provided, wires up callback to trigger `CatchMechanicsManager.playBallThrowById()` for throw animations
- **Catch Result Bridge**: When `onCatchResultRef` is provided, wires up callback to notify `CatchMechanicsManager.handleCatchResult()` when contract events fire (resets state machine)

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

### SfxVolumeToggle Component
Independent SFX volume control, separate from music:

**Location:** `src/components/SfxVolumeToggle.tsx`

**Features:**
- Mute/unmute SFX (throw, impact, win, fail sounds)
- Volume slider when unmuted
- Persists settings to localStorage
- Blue pixel-art button style (distinguishes from green music toggle)
- Sparkle icon (✨) to distinguish from speaker icon

**LocalStorage Keys:**
| Key | Value | Description |
|-----|-------|-------------|
| `pokeballTrader_sfxVolume` | `0.0 - 1.0` | SFX volume level |
| `pokeballTrader_sfxMuted` | `true/false` | SFX mute state |

**Visual Style:**
- Position: Bottom-right, to the left of VolumeToggle (`right: 80px`)
- Colors: Blue `#44a` (unmuted), Red `#a44` (muted)
- Icon: ✨ (unmuted), 🔇 (muted)
- Label: "SFX" below icon

**Integration:**
```tsx
// In App.tsx - renders next to music VolumeToggle
<SfxVolumeToggle />
<VolumeToggle onVolumeChange={handleVolumeChange} initialVolume={musicVolume} />
```

**ChiptuneSFX Connection:**
- On mount, reads localStorage and initializes `getChiptuneSFX()` singleton
- On toggle/slider change, calls `sfx.setVolume()`, `sfx.mute()`, `sfx.unmute()`
- Settings persist across page reloads

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
- Shop purchase rows: 16×16px circles with 2px white border
- CatchAttemptModal: 20×20px circles with 2px white border

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
  slotIndex: number;        // 0-19, used as pokemonSlot in throwBall()
  attemptsRemaining: number; // Attempts before Pokemon relocates
  /** Optional callback to trigger visual ball throw animation in Phaser */
  onVisualThrow?: (pokemonId: bigint, ballType: BallType) => void;
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
- **Visual throw animation**: Calls `onVisualThrow` BEFORE contract write for immediate feedback
- **Auto-close on throw**: Modal closes immediately after triggering animation so the ball arc is visible on the map
- Calls `useThrowBall().write(slotIndex, ballType)` on click
- Result shown via CatchWinModal (success) or CatchResultModal (failure) - attempt modal doesn't reopen
- "Connect wallet" warning if no address
- "No attempts remaining" warning when attemptsRemaining <= 0
- "No PokeBalls" message with shop hint if inventory empty

**Hooks Used:**
- `useThrowBall()` - Contract write for throwBall()
- `usePlayerBallInventory(address)` - Read ball counts

**Note:** This modal only initiates the throw transaction. The Pyth Entropy result (caught/escaped) should be handled by the parent component via contract event listeners.

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
- NFT name from metadata (shows Pokemon card name, not generic "Slab NFT")
- **Card attributes display** (rarity, card number, edition, etc. from metadata)
- Token ID and Pokemon ID
- Links to Apescan and Magic Eden
- Transaction hash link

**Displayed Card Attributes:**
When metadata includes `attributes` array, they're shown in a 2-column grid:
- Card Number, Edition, Rarity, Series
- Any other trait_type/value pairs from metadata
- Styled with yellow text on dark background

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

**Standalone Animation Methods (for React integration):**
- `playBallThrow(toX, toY, ballType)` - Play standalone ball arc animation (~500ms)
- `playBallThrowById(pokemonId, ballType)` - Convenience wrapper that looks up Pokemon position

These methods are used by the CatchAttemptModal to play a visual throw animation BEFORE the contract write, so users see immediate feedback while the transaction is pending.

**Arc Distance Clipping:**
If player is < 64px from target, the animation start point is moved back to ensure a natural-looking arc. This prevents flat or backwards arcs when the player is very close to the Pokemon.

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
  MIN_ARC_DISTANCE: 64,              // Minimum distance for natural arc
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

**React Integration (wired in App.tsx):**
The catch result flow from contract events to Phaser state machine:
```typescript
// In App.tsx:
// 1. Create ref for catch result callback
const catchResultRef = useRef<((caught: boolean, pokemonId: bigint) => void) | null>(null);

// 2. Pass ref to GameCanvas
<GameCanvas onCatchResultRef={catchResultRef} />

// 3. GameCanvas wires ref to CatchMechanicsManager
if (onCatchResultRef) {
  onCatchResultRef.current = (caught: boolean, pokemonId: bigint) => {
    catchMechanicsManager.handleCatchResult(caught, pokemonId);
  };
}

// 4. When contract events fire, notify Phaser
useEffect(() => {
  if (caughtEvents.length > 0) {
    const latest = caughtEvents[caughtEvents.length - 1];
    if (latest.args.catcher === account) {
      catchResultRef.current?.(true, latest.args.pokemonId);
    }
  }
}, [caughtEvents]);

useEffect(() => {
  if (failedEvents.length > 0) {
    const latest = failedEvents[failedEvents.length - 1];
    if (latest.args.thrower === account) {
      catchResultRef.current?.(false, latest.args.pokemonId);
    }
  }
}, [failedEvents]);
```

**handleCatchResult Robustness:**
The manager handles edge cases gracefully:
- Force resets to idle if state is stuck in `awaiting_result` or `throwing`
- Compares Pokemon IDs as strings to avoid bigint comparison issues
- Resets even if IDs don't match (prevents permanent stuck state)

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
| `VITE_BUNDLER_RPC_URL` | No | ERC-4337 bundler endpoint for dGen1/EthereumPhone Account Abstraction |
| `VITE_GLYPH_API_KEY` | No | Glyph Wallet API key (if required by SDK) |

Example `.env` file (see `.env.example` for full template):
```env
VITE_POKEBALL_GAME_ADDRESS=0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Wallet Integration (optional)
VITE_BUNDLER_RPC_URL=https://your-bundler-endpoint
VITE_GLYPH_API_KEY=your_glyph_api_key
```

See `docs/SETUP_POKEBALL_GAME.md` for complete setup instructions.
See `docs/WALLET_INTEGRATION.md` for wallet connector configuration.

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
- `WALLET_INTEGRATION.md` - **dGen1/EthereumPhone & Glyph Wallet integration guide**
- `UUPS_UPGRADE_GUIDE.md` - UUPS proxy upgrade guide
- `SETUP_POKEBALL_GAME.md` - **PokeballGame integration setup guide**
- `UPGRADE_V1.2.0_20_POKEMON.md` - **v1.2.0 upgrade guide (3→20 Pokemon)**
- `claude_agents.md` - Claude agent integration
