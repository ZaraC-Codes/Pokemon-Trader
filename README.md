# Pokemon Trader – Slab Cash Gachapon Challenge Entry

Pokemon Trader is a 2D pixel-art, Pokemon-style game on **ApeChain** where players buy Poke Balls with APE or USDC.e, explore the map, and attempt to catch Pokemon for a chance to win real **Pokemon card NFTs** from the Slab collection.

## Challenge Context

This project is a custom implementation of the **Pokemon Trader** challenge app created by @simplefarmer69. The original challenge brief and baseline app are documented in `README_CHALLENGE.md`.

I implemented the Pokéball catch game mechanics, UI/UX polish, and on-chain integrations as my submission to this challenge, and this repo represents my contribution on top of the original work.

### Challenge Result

This implementation was selected as the **winner** of the Pixelverse / Slab.cash Pokéball game challenge.

---

## How to Run

### Prerequisites

- Node.js 18+
- npm or yarn
- A Web3 wallet (MetaMask, RainbowKit-compatible) connected to **ApeChain Mainnet (Chain ID 33139)**

### Environment setup

1. Copy the example file:

bash
cp .env.example .env
Open .env and fill in any optional keys (for example VITE_THIRDWEB_CLIENT_ID or your own Alchemy key).

text

On Windows PowerShell you can instead write:

bash
copy .env.example .env

### Setup

bash
git clone <your-fork-url>
cd Pokemon-Trader
npm install
The app is pre-configured with an Alchemy API key for ApeChain, so a .env file is optional.
To override the key, create .env and set:

bash
VITE_ALCHEMY_API_KEY=your_api_key_here
Development
bash
npm run dev
The game will be available at:

http://localhost:5173 (dev server port is locked to 5173)

Production Build
bash
npm run build
This generates an optimized build in the dist folder, which can be deployed to any static host (Vercel, Netlify, GitHub Pages, etc.).

How to Play
Gotta Catch ’Em All!

Buy balls in the shop

Pay with APE or USDC.e (APE is auto‑swapped to USDC.e in the contract).

Higher tier balls (Great, Ultra, Master) have better catch rates than regular Poke Balls.

Explore the map

Use the keyboard to move around the pixel-art world.

Look for wild Pokemon spawns scattered across the map.

Get close and throw

Click a nearby Pokemon to open the Throw modal.

Choose a ball type and throw.

Each Pokemon relocates after 3 failed attempts, so you have up to three chances.

Win a Pokemon NFT

On a successful catch, the PokeballGame contract uses Pyth Entropy randomness and pulls a Pokemon card NFT from the SlabMachine → SlabNFTManager pipeline.

The NFT is transferred to your wallet and appears both:

In your in‑game inventory and win modals (via useSlabNFTMetadata).

In external explorers/marketplaces like OpenSea and Magic Eden.

An in‑game Help modal (accessible via a “?” button) summarizes these steps so new players can quickly understand the loop.

Architecture Overview
Smart Contracts (ApeChain Mainnet)
PokeballGame v1.6.0 (proxy)

Unified APE/USDC.e payments; APE is auto‑swapped to USDC.e via Camelot DEX.

Uses Pyth Entropy for verifiable randomness instead of POP VRNG.

Handles ball purchases, throwBall, randomness callbacks, and NFT award logic.

Routes 97% of spend to SlabNFTManager (NFT pool) and 3% to the treasury as fees, in USDC.e.

SlabNFTManager v2.2.0 (proxy)

Holds the USDC.e revenue and auto‑purchases NFTs from SlabMachine when the balance reaches the pull price (51 USDC.e).

Tracks NFT inventory, awards NFTs to caught players, and includes recovery utilities for NFTs received via transferFrom.

Slab NFT Pokemon Cards

Existing NFT collection contract that stores all Pokemon card NFTs used as gachapon prizes.

Frontend
React + TypeScript + Vite for UI and build tooling.

Phaser 3 for the 2D pixel-art game world (movement, Pokemon entities, animations).

Wagmi + Viem + RainbowKit for wallet connection, contract calls, and event subscriptions.

Thirdweb Checkout / Universal Bridge for multi-chain APE/USDC.e funding from other networks.

Alchemy NFT API + useSlabNFTMetadata to resolve NFT metadata and images when showing Pokemon cards.

For a detailed breakdown of files, hooks, contracts, and troubleshooting notes, see CLAUDE.md in this repository.

Mapping to the Challenge Checklist
This section shows how this implementation satisfies the Testing Checklist and core requirements described in README_CHALLENGE.md.

Deposit functionality works with APE

APE payments route through PokeballGame v1.6.0, which auto‑swaps APE to USDC.e and records the deposit for RNG and revenue accounting.

Deposit functionality works with USDC.e

Direct USDC.e payments are supported and treated identically once inside the contract.

Probability calculation and randomness

throwBall uses Pyth Entropy for randomness; catch probabilities are configured per ball type and used to decide whether a Pokemon is caught.

Spin mechanics / gachapon equivalent

Instead of a GUI “spin”, the throw and catch flow serves as the gachapon spin, with the same underlying randomness and payout logic.

Random number generation is verifiable and fair

Pyth Entropy provides verifiable randomness for each throw, replacing earlier POP VRNG assumptions from the original challenge spec.

Winners receive NFT cards; losers don’t

On CaughtPokemon events, SlabNFTManager awards an NFT to the player; on FailedCatch, no NFT is transferred.

Owner and treasury wallets editable

Contracts expose setOwnerWallet / setTreasuryWallet style functions so the owner can update these addresses with appropriate access control.

Thirdweb Checkout widget integrates properly

The Poke Ball Shop includes a “NEED CRYPTO?” section with Thirdweb Checkout, allowing cross‑chain funding into APE or USDC.e on ApeChain.

Multi-chain support works

Thirdweb Universal Bridge supports deposits from many chains into ApeChain, satisfying the multi‑chain access requirement.

Revenue generation from losing spins

All spend (whether the player wins or loses) is converted into USDC.e, with 97% routed to SlabNFTManager (NFT pool) and 3% to treasury.

Maximum deposit limit (49.9 USDC.e) enforced

The shop enforces a $49.90 per transaction cap, disabling purchases that would exceed it and matching the challenge’s maximum deposit requirement.

RTP ~97%

The revenue-split and probability configuration are designed so that returns approximate the 97% RTP target described in the challenge spec.

NFT API and inventory terminal

The inventory terminal uses the Alchemy NFT API and on-chain reads to show wallet NFTs, including the Pokemon cards won in-game.

NFT transfers (single / bulk) work

Existing bulk transfer tooling from the base project remains functional; this entry preserves those flows.

Volume control and terminal overlays

Audio controls and the inventory/terminal overlays are implemented so they do not reset or interfere with the core game loop.

### Owner / Maintenance Scripts

For contract revenue verification and withdraw flows (e.g. `scripts/verifyrevenueflow.cjs`, `scripts/withdrawtestfunds.cjs`), see `CLAUDE.md` under “New Features – SlabNFTManager Contract v2.2.0” and “Development Notes – Revenue & Withdraw Scripts.”

### License

This repository is a public fork of the original Pokemon Trader challenge app, which did not declare a formal license in its root.

- Core game code, art, and original docs are authored by the upstream Pokemon Trader / Pixelverse / Slab.cash team.
- My contributions (Pokéball catch game, UI/UX changes, and integration work) are shared for learning and portfolio purposes only and should be treated as extensions to that upstream codebase.

For any commercial or production use, please coordinate with the original project owners regarding licensing.

### Contributing

This branch is submitted as part of the Slab Cash Gachapon Challenge.
External contributions are not expected during the judging period, but forks are welcome for experimentation or further development.

For maintainers or reviewers, the best starting points are:

README_CHALLENGE.md – original challenge description and checklist.

CLAUDE.md – full technical log, contract versions, debugging history, and agent-oriented documentation for this implementation.
