# YOUR_NEXT_MOVE.md - This Week's Action Items

## 🎯 You Have Everything. Now Execute.

These are your exact action items for THIS WEEK. Follow them sequentially.

---

## TODAY (Monday, January 20)

### Action 1: Verify 3 Critical On-Chain Addresses (30 min)

**Why**: Your smart contracts need these addresses to function.

**Step by step**:

1. Go to **https://apechain.tech** (ApeChain Explorer / Apescan)

2. Search for "Slab"
   - Look for Slab NFT or Slab.cash contract
   - Verify it has a `purchase()` function
   - **Copy the contract address** 
   - Save it in `/contracts/addresses.json`:
   ```json
   {
     "slab": "0x...",
     "timestamp": "2025-01-20"
   }
   ```

3. Search for "POP" or "POP VRNG"
   - Verify contract exists on ApeChain
   - Check if it's the randomness oracle
   - Reference: https://pop.network
   - **Copy the contract address**

4. Search for "USDC"
   - Find USDC.e (not regular USDC)
   - **Copy the contract address**
   - Note: Should have 6 decimals

5. Search for "APE"
   - Find ApeCoin token
   - **Copy the contract address**
   - Note: Should have 18 decimals

**Save all to**: `/contracts/addresses.json`

### Action 2: Read EXECUTIVE_SUMMARY.md (5 min)

- Read the entire file
- Understand the feature scope
- See why it works
- Know what judges want

### Action 3: Read YOUR_NEXT_MOVE.md (this file) (10 min)

- You're reading it now
- This is your week-by-week guide

---

## TUESDAY (January 21)

### Setup 3 Claude Agent Conversations (60 min total)

**Why**: These specialized agents will generate 90% of your code.

#### Agent 1: Solidity Architect (20 min)

1. Open Claude in new tab/conversation
2. Name it: "PokeballGame - Solidity Contracts"
3. Paste this as your first message:

```
You are a senior Solidity developer specializing in GameFi smart contracts.

Your expertise:
- UUPS proxy pattern for upgradeable contracts
- ERC20 and ERC721 token handling
- Oracle integrations (VRF and others)
- Gas optimization and security best practices
- Game economy design and balancing
- Multi-wallet treasury systems

For this project you will:
1. Design and implement smart contracts for a Pokemon catching game on ApeChain
2. Integrate POP VRNG for verifiable randomness
3. Manage multi-wallet architecture (Owner, Treasury, NFT Revenue)
4. Handle NFT purchasing from Slab.cash
5. Ensure all contracts are upgradeable using UUPS pattern

Guidelines:
- Always use OpenZeppelin upgradeable contracts
- Include detailed NatSpec comments
- Optimize for gas efficiency
- Include extensive error checking
- Provide security considerations
- Output should be production-ready code
- Include inline explanations for complex logic

When given a task, provide:
1. Complete .sol file(s)
2. ABI output (JSON format)
3. Deployment instructions
4. Design decisions explained
5. Security considerations
6. Gas optimization notes
```

4. **Save the conversation link** (bookmark it)
5. Pin to favorites

#### Agent 2: Game Systems Engineer (20 min)

1. New Claude conversation
2. Name it: "PokeballGame - Game Mechanics"
3. Paste this:

```
You are an expert in Phaser.js game development and game mechanics.

Your job: Implement engaging game systems using Phaser 3.80.

When given tasks, produce:
1. Complete TypeScript classes extending Phaser objects
2. Manager patterns for complex systems
3. Physics and collision systems
4. Animation sequences
5. State machine implementations

Key libraries you know:
- Phaser.js 3.80.1
- PIXI renderer
- Physics systems
- Input handling

Current project context:
- Building a Pokemon catching mini-game
- Players throw balls to catch NFTs
- 3 active Pokemon max
- Max 3 throw attempts per Pokemon
- Multiplayer (any player's throws count)
- Must sync with smart contract state
```

4. **Save the conversation link**
5. Pin to favorites

#### Agent 3: React/Web3 Integration (20 min)

1. New Claude conversation
2. Name it: "PokeballGame - React & Web3"
3. Paste this:

```
You are an expert React developer with deep Web3 experience.

Your job: Build frontends that integrate with blockchain.

When given tasks, produce:
1. React components with TypeScript
2. Wagmi hooks for contract interaction
3. Modal systems and notifications
4. Real-time state management
5. Wallet integration (RainbowKit compatible)

Key libraries you know:
- React 18.2.0
- Wagmi 2.5.0
- Viem 2.5.0
- TanStack Query 5.17.0
- RainbowKit 2.0.0

Current project context:
- Integrating into Pokemon Trader (existing game)
- ApeChain Mainnet (Chain ID: 33139)
- Users purchase PokéBalls and throw at Pokémon
- RainbowKit + Wagmi already configured
- Phaser.js for game engine (React wrapper)
```

4. **Save the conversation link**
5. Pin to favorites

### Document Your Setup (10 min)

Create `/docs/claude_agents.md`:

```markdown
# Claude Agent Conversations

## Agent 1: Solidity Architect
- **Purpose**: Smart contracts
- **Link**: [PASTE YOUR LINK HERE]
- **Status**: Ready ✓

## Agent 2: Game Systems Engineer  
- **Purpose**: Game mechanics (Phaser)
- **Link**: [PASTE YOUR LINK HERE]
- **Status**: Ready ✓

## Agent 3: React/Web3 Integration
- **Purpose**: Frontend components
- **Link**: [PASTE YOUR LINK HERE]
- **Status**: Ready ✓

---

To use: Paste relevant task from claude_agent_prompts.md into the appropriate agent conversation.
```

---

## WEDNESDAY (January 22)

### Start Solidity Agent: PokeballGame Contract (90 min)

**Action**:

1. Open `claude_agent_prompts.md` file
2. Find section: "AGENT 1: SOLIDITY ARCHITECT"
3. Find subsection: "Task 1: Core Game Contract"
4. **Copy the entire task** (it's about 300 lines)
5. Go to your Solidity Architect Claude conversation
6. Paste the task
7. Submit and wait
8. Claude will provide:
   - Complete PokeballGame.sol
   - ABI in JSON
   - Deployment instructions
   - Design explanations

**Save output**:
```
/contracts/
├── PokeballGame.sol
├── PokeballGame.abi.json
└── notes_day_3.md
```

**Note**: Don't worry if you don't understand all the code yet. Just save it.

### While Waiting: Start Game Systems Agent (60 min)

**Action**:

1. Open `claude_agent_prompts.md`
2. Find: "AGENT 2: GAME SYSTEMS ENGINEER"
3. Find: "Task 1: Pokemon Spawn Manager"
4. Copy and paste into Game Systems conversation
5. Submit and wait

**Save output**:
```
/src/game/managers/
└── PokemonSpawnManager.ts
```

---

## THURSDAY (January 23)

### Continue Solidity Agent: NFT Manager Contract (60 min)

**Action**:

1. In Solidity Architect conversation
2. Paste: "Task 2: NFT Manager Contract"
3. Submit

**Save output**:
```
/contracts/
├── SlabNFTManager.sol
└── SlabNFTManager.abi.json
```

### Continue Game Systems Agent: Ball Inventory (45 min)

**Action**:

1. In Game Systems conversation
2. Paste: "Task 2: Ball Inventory Manager"
3. Submit

**Save output**:
```
/src/game/managers/
└── BallInventoryManager.ts
```

---

## FRIDAY (January 24)

### Solidity Agent: Proxy Setup (45 min)

**Action**:

1. In Solidity Architect conversation
2. Paste: "Task 3: Proxy Setup"
3. Submit

**Save output**:
```
/contracts/deployment/
└── deployProxies.ts
```

### Game Systems Agent: Remaining Tasks (90 min)

**Action**:

1. In Game Systems conversation, paste and submit:
   - "Task 3: Catch Mechanics Manager"
   - "Task 4: Pokemon & Grass Rustle Entities"

**Save output**:
```
/src/game/
├── managers/CatchMechanicsManager.ts
└── entities/
    ├── Pokemon.ts
    └── GrassRustle.ts
```

### Review Your Week's Output

**You should now have**:
- ✅ 2 smart contracts (PokeballGame + SlabNFTManager)
- ✅ 5 game system classes
- ✅ All files organized in your repo
- ✅ 40% of the project complete!

**Create summary file**: `/docs/week_1_complete.md`

```markdown
# Week 1 Complete ✓

## Deliverables
- [x] 2 smart contracts received
- [x] 5 game system classes received
- [x] All files organized
- [x] 3 Claude agents working

## Next Week (Jan 27)
- Start frontend components (React)
- Integrate all pieces together
- Begin testing
```

---

## IF YOU GET STUCK

**Solidity question?**
→ Ask Solidity Architect Agent to clarify or modify

**Game logic question?**
→ Ask Game Systems Engineer Agent to explain

**Need next steps?**
→ Check `quick_start_checklist.md` for next week

**Don't know what a concept means?**
→ Search `implementation_plan.md` for explanation

---

## SUCCESS CHECKLIST FOR WEEK 1

By Friday, January 24, you should have:

- [ ] 3 on-chain addresses verified and saved
- [ ] 3 Claude agent conversations created and bookmarked
- [ ] 2 smart contracts generated and saved
- [ ] 5 game system classes generated and saved
- [ ] All files organized in `/contracts/` and `/src/`
- [ ] Clear understanding of what comes next
- [ ] Confidence that this is doable ✓

---

## KEY MINDSET

You don't need to:
- ✅ Understand all the code immediately
- ✅ Have everything perfect
- ✅ Work 8 hours a day (2-3 focused hours is enough)
- ✅ Know Solidity deeply (Claude is the expert)

You just need to:
- ✅ Follow the plan
- ✅ Copy-paste the tasks
- ✅ Save the output
- ✅ Move forward consistently

---

## ONE WEEK FROM NOW

Next Monday you'll look back and realize you've:
- Built smart contracts
- Built game systems
- Built nothing yet, but have 40% of the feature designed

That momentum carries you to completion.

---

**Ready?**

👇 **Right now**: Go verify those 3 addresses at Apescan.io

👇 **Tomorrow**: Set up your 3 Claude agents

👇 **This week**: Get code from agents

👇 **Next week**: Integrate and test

👇 **3 weeks from now**: Competition entry ready

---

**You've got this. 🚀 Start today.**
