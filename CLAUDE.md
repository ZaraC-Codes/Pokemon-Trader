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
npx hardhat run contracts/deployment/deploy_PokeballGame.js --network apechain  # Deploy
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
│   │   └── BikeRentalModal.tsx      # Bike rental UI (2x speed boost)
│   │
│   ├── game/                    # Phaser game code
│   │   ├── scenes/
│   │   │   └── GameScene.ts         # Main game scene
│   │   ├── entities/                # Game objects
│   │   │   ├── Player.ts            # Player character
│   │   │   ├── NPC.ts               # Generic NPC
│   │   │   ├── DialogBubble.ts      # Dialog display
│   │   │   ├── TradeIcon.ts         # OTC listing icon
│   │   │   ├── Building.ts          # Generic building
│   │   │   ├── House.ts             # House entity
│   │   │   ├── Tree.ts, Bush.ts, Rock.ts  # Terrain features
│   │   │   ├── BikeShop.ts          # Interactive bike shop
│   │   │   ├── BikeShopOwner.ts     # Bike shop NPC
│   │   │   └── TradingOutpost.ts    # Trading building
│   │   ├── managers/                # MapManager, NPCManager, TradeIconManager
│   │   ├── utils/                   # Music utilities (chiptune, mp3)
│   │   └── config/                  # Game configuration
│   │
│   ├── services/                # Web3 services
│   │   ├── apechainConfig.ts        # Network & wallet config
│   │   ├── contractService.ts       # Contract interactions
│   │   ├── config.ts                # Contract addresses & ABIs
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
│   │   ├── useTokenBalance.ts       # Token balance queries
│   │   ├── useNFTExists.tsx         # NFT existence check
│   │   ├── useAllNftPositions.tsx   # All NFT positions
│   │   └── useNFTBalances/          # NFT balance queries (IPFS, LM, NFT)
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
│   │   ├── deploy_PokeballGame.js   # PokeballGame deployment
│   │   └── deploy_SlabNFTManager.js # SlabNFTManager deployment
│   ├── addresses.json           # Contract addresses & token config
│   └── wallets.json             # Wallet configuration
│
├── docs/                    # Project documentation
│   ├── README_DOCUMENTATION.md  # Documentation index
│   ├── EXECUTIVE_SUMMARY.md     # Project summary
│   ├── implementation_plan.md   # Development roadmap
│   ├── pop_vrng_integration.md  # POP VRNG integration guide
│   ├── WALLET_CONFIG.md         # Wallet setup guide
│   └── claude_agents.md         # Claude agent integration
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
| `src/services/contractService.ts` | Contract interaction layer |
| `src/hooks/useAllListings.tsx` | Core hook for fetching listings |
| `contracts/addresses.json` | All contract addresses and token config |
| `contracts/wallets.json` | Wallet configuration (owner, treasury, NFT revenue) |
| `contracts/PokeballGame.sol` | Main game smart contract v1.1.0 |
| `contracts/SlabNFTManager.sol` | NFT inventory and auto-purchase manager |
| `contracts/abi/abi_PokeballGame.json` | PokeballGame ABI v1.1.0 for frontend |
| `contracts/abi/abi_SlabNFTManager.json` | SlabNFTManager ABI for frontend |
| `abi_SlabMachine.json` | Slab Machine contract ABI |
| `hardhat.config.cjs` | Hardhat compilation and deployment config |

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

### Bike Rental System
- `BikeRentalModal.tsx` - UI for renting bikes
- `BikeShop.ts` / `BikeShopOwner.ts` - In-game bike shop
- Provides 2x movement speed boost

### POP VRNG Integration
- On-chain verifiable randomness for mystery mechanics
- Interface at `contracts/interfaces/IPOPVRNG.sol`
- See `docs/pop_vrng_integration.md` for implementation details

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
- `throwBall(pokemonSlot, ballType)` - Attempt catch
- `randomNumberCallback(requestId, randomNumber)` - VRNG callback
- `getAllPlayerBalls(player)` - Get player inventory
- `getAllActivePokemons()` - Get spawned Pokemon
- `setSlabNFTManager(address)` - Set NFT manager (owner only)
- `getNFTInventoryCount()` - Query NFT inventory via manager

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

### Mystery Box System
- `useMysteryBox.ts` hook for mystery box contract interactions
- Randomness-dependent NFT mechanics

### Cross-Chain Bridge
- `useBridgeListing.tsx` - Create cross-chain token swaps
- Bridge functionality for multi-chain support

### Liquidity Manager Positions
- `useLMBuyPositions.tsx` - Query liquidity manager positions with options
- `useAllNftPositions.tsx` - Aggregate NFT position data

## Documentation

Comprehensive documentation available in `docs/`:
- `README_DOCUMENTATION.md` - Documentation index
- `EXECUTIVE_SUMMARY.md` - Project overview
- `implementation_plan.md` - Development roadmap
- `pop_vrng_integration.md` - POP VRNG integration guide
- `WALLET_CONFIG.md` - Wallet setup instructions
- `claude_agents.md` - Claude agent integration
