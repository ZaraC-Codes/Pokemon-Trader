# QUICK_START_CHECKLIST - 20-Day Implementation Guide

## WEEK 1: SMART CONTRACTS (Days 1-9)

### Pre-Development (Days 1-2)

#### Research & Validation
- [ ] Verify Slab.cash contract on ApeChain
  - Go to Apescan.io
  - Search for "Slab" 
  - Check if `purchase()` function exists
  - Save address: `0x...`

- [ ] Verify POP VRNG on ApeChain
  - Get contract address
  - Check documentation at pop.network
  - Verify cost/gas requirements

- [ ] Verify token addresses
  - APE token on ApeChain: `0x...`
  - USDC.e on ApeChain: `0x...`
  - Check decimals (6 for USDC, 18 for APE)

#### Setup Development
- [ ] Clone Pokemon Trader repo
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev` ✓ Verify it runs
- [ ] Set up Hardhat for contracts
- [ ] Create `/contracts/` directory

### Contract Development (Days 3-5)

#### Day 3: PokeballGame Contract
- [ ] Ask Solidity Agent: [Copy Task 1 from claude_agent_prompts.md]
- [ ] Review PokeballGame.sol
- [ ] Check:
  - [ ] All 4 ball types with correct prices
  - [ ] Catch rates accurate (2%, 20%, 50%, 99%)
  - [ ] 3% fee calculation correct
  - [ ] Event emissions for all actions
  - [ ] POP VRNG integration correct
  - [ ] UUPS proxy ready
  - [ ] Admin functions have owner checks
- [ ] Save to: `/contracts/PokeballGame.sol`

#### Day 4: SlabNFTManager Contract
- [ ] Ask Solidity Agent: [Copy Task 2]
- [ ] Review SlabNFTManager.sol
- [ ] Check:
  - [ ] Auto-purchase logic when $51 accumulated
  - [ ] Max 10 NFT inventory enforcement
  - [ ] NFT transfer to winner function
  - [ ] Slab contract integration correct
  - [ ] Fee swapping logic
  - [ ] Only PokeballGame can call critical functions
- [ ] Save to: `/contracts/SlabNFTManager.sol`

#### Day 5: Proxy Setup
- [ ] Ask Solidity Agent: [Copy Task 3]
- [ ] Review deployment script
- [ ] Test deployment on testnet
- [ ] Verify contracts are upgradeable
- [ ] Document contract addresses

### Testing (Days 6-9)

#### Days 6-7: Unit Tests
- [ ] Write tests for PokeballGame
  - [ ] `purchaseBalls()` with APE and USDC
  - [ ] `throwBall()` with POP VRNG mock
  - [ ] `fulfillRandomness()` paths
  - [ ] Admin wallet updates
  - [ ] Wallet separation
  
- [ ] Write tests for SlabNFTManager
  - [ ] Auto-purchase trigger at $51
  - [ ] NFT inventory max (10)
  - [ ] Transfer to winner
  
- [ ] Run tests: `npm test`
- [ ] Target: >80% code coverage
- [ ] All tests passing ✓

#### Day 8: Integration Testing
- [ ] Deploy both contracts to testnet
- [ ] Call purchaseBalls() → verify fee split
- [ ] Call throwBall() → verify event emission
- [ ] Simulate Slab purchase callback
- [ ] Verify NFT transfers work
- [ ] Check gas usage for each function

#### Day 9: Final Polish
- [ ] Code review:
  - [ ] All require statements have messages
  - [ ] No unchecked math
  - [ ] Events indexed correctly
  - [ ] Proper access control
  - [ ] No reentrancy issues
  - [ ] Comments explain complex logic
  
- [ ] Final deployment to testnet
- [ ] Save final ABI files for frontend

---

## WEEK 2: GAME SYSTEMS (Days 10-14)

### Game Entities & Managers (Days 10-12)

#### Day 10: Pokemon Spawn Manager
- [ ] Ask Game Systems Agent: [Copy Task 1]
- [ ] Review PokemonSpawnManager.ts
- [ ] Check:
  - [ ] Tracks up to 3 active spawns
  - [ ] Event listening for contract updates
  - [ ] Attempt counter increments correctly
  - [ ] Relocation logic when count = 3
  - [ ] Visual entity creation/destruction
  
- [ ] Create unit tests
- [ ] Verify integration with contract ABIs
- [ ] Save to: `/src/game/managers/PokemonSpawnManager.ts`

#### Day 11: Ball Inventory & Catch Mechanics
- [ ] Ask Game Systems Agent: [Copy Task 2]
- [ ] Review BallInventoryManager.ts
- [ ] Ask Game Systems Agent: [Copy Task 3]
- [ ] Review CatchMechanicsManager.ts
- [ ] Check:
  - [ ] Inventory tracking accurate
  - [ ] Throw animations smooth
  - [ ] State machine transitions correct
  - [ ] Event emissions proper
  
- [ ] Save to:
  - `/src/game/managers/BallInventoryManager.ts`
  - `/src/game/managers/CatchMechanicsManager.ts`

#### Day 12: Visual Entities
- [ ] Ask Game Systems Agent: [Copy Task 4]
- [ ] Review Pokemon.ts and GrassRustle.ts
- [ ] Get pixel art assets:
  - [ ] Pokemon sprite
  - [ ] Poke Ball throw animation frames
  - [ ] Grass rustle animation
  - [ ] Catch effect particles
  - [ ] Fail bounce animation
  
- [ ] Integrate into GameScene.ts
- [ ] Test all animations at 60 FPS
- [ ] Save to:
  - `/src/game/entities/Pokemon.ts`
  - `/src/game/entities/GrassRustle.ts`

### Integration & Testing (Days 13-14)

#### Days 13-14: Full Integration
- [ ] Connect all managers to GameScene
- [ ] Test complete game flow:
  - [ ] Pokemon spawns → visible in world
  - [ ] Player clicks → modal opens
  - [ ] Player throws → animation plays
  - [ ] Contract callback → result shows
  - [ ] Inventory updates
  
- [ ] Fix any animation jank
- [ ] Optimize performance (check FPS)
- [ ] Test with multiple spawn/catch cycles

---

## WEEK 3: FRONTEND & INTEGRATION (Days 15-20)

### React Components (Days 15-18)

#### Day 15: Wagmi Hooks
- [ ] Ask React Agent: [Copy Task 1]
- [ ] Review all 7 hooks provided
- [ ] Check:
  - [ ] All contract functions covered
  - [ ] Proper error handling
  - [ ] Loading states correct
  - [ ] Event listeners working
  
- [ ] Test each hook individually
- [ ] Save to: `/src/hooks/usePokemonGame.ts`

#### Days 16-17: UI Components
- [ ] Ask React Agent: [Copy Task 2 - PokeBallShop]
- [ ] Review component
- [ ] Test:
  - [ ] Render without wallet → show connect prompt
  - [ ] Render with wallet → show balance
  - [ ] Click [BUY] → initiate purchase
  - [ ] Purchase success → inventory updates
  
- [ ] Ask React Agent: [Copy Task 3 - CatchAttemptModal]
- [ ] Review and test component
- [ ] Ask React Agent: [Copy Task 4 - CatchResultModal]
- [ ] Review and test component
- [ ] Ask React Agent: [Copy Task 5 - GameHUD]
- [ ] Review and test component
- [ ] Save all to: `/src/components/`

#### Day 18: Configuration
- [ ] Ask React Agent: [Copy Task 6]
- [ ] Follow setup guide:
  - [ ] Create `/src/services/pokeballGameConfig.ts`
  - [ ] Add contract address, ABI, token addresses
  - [ ] Update apechainConfig.ts
  - [ ] Install any missing dependencies
  
- [ ] Verify all components can find config
- [ ] Test hot reload works

### Final Integration (Days 19-20)

#### Day 19: End-to-End Testing
- [ ] Full game playable flow:
  1. [ ] Connect wallet
  2. [ ] Buy PokeBalls from shop
  3. [ ] See Pokemon in world
  4. [ ] Click to catch attempt
  5. [ ] Select ball
  6. [ ] Throw animation plays
  7. [ ] Wait for contract callback
  8. [ ] See result (success or failure)
  9. [ ] Inventory updates
  10. [ ] Repeat
  
- [ ] Test on different devices (desktop, mobile, tablet)
- [ ] Check for console errors
- [ ] Verify all animations smooth

#### Day 20: Optimization & Submission Prep
- [ ] Performance optimization:
  - [ ] Check React DevTools for renders
  - [ ] Memoize components if needed
  - [ ] Optimize Phaser animations
  - [ ] Profile bundle size
  
- [ ] Polish checklist:
  - [ ] All UI responsive
  - [ ] No missing spinners
  - [ ] Error messages helpful
  - [ ] Wallet connection clear
  - [ ] Gas estimates shown
  
- [ ] Documentation:
  - [ ] Update README with new feature
  - [ ] Add feature description
  - [ ] Include screenshots/GIFs
  - [ ] Document architecture
  
- [ ] Code cleanup:
  - [ ] Remove console.logs
  - [ ] Fix TODO comments
  - [ ] Consistent formatting
  - [ ] No warnings in build

---

## VERIFICATION CHECKLIST

### Smart Contracts ✓
- [ ] All 4 ball types priced correctly
- [ ] Catch rates mathematically accurate
- [ ] 3% platform fee calculated correctly
- [ ] 97% RTP verified mathematically
- [ ] POP VRNG integration working
- [ ] UUPS proxy deployable
- [ ] All events emitted properly
- [ ] Admin functions properly protected
- [ ] No security vulnerabilities found

### Game Mechanics ✓
- [ ] Pokemon spawns appear in world
- [ ] Max 3 Pokemon active at once
- [ ] Grass rustle animation triggers
- [ ] Throw animation plays smoothly
- [ ] Catch/miss feedback clear
- [ ] Attempt counter works (max 3)
- [ ] Pokemon relocates after 3 attempts
- [ ] Inventory updates in real-time

### Frontend & UX ✓
- [ ] Wallet connection works
- [ ] Purchase flow intuitive
- [ ] Modals display correctly
- [ ] All buttons responsive
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states shown
- [ ] Error messages helpful
- [ ] Animations smooth (60 FPS)

### Integration ✓
- [ ] Contracts deploy successfully
- [ ] Frontend connects to contracts
- [ ] Transactions complete successfully
- [ ] Events properly emitted and received
- [ ] State syncs between frontend and contract
- [ ] Multiplayer aspects work
- [ ] NFTs transfer to winners

### Documentation ✓
- [ ] README updated
- [ ] Code commented
- [ ] Architecture documented
- [ ] Deployment instructions clear
- [ ] Tech stack documented
- [ ] Known issues listed

---

## COMMON ISSUES & FIXES

### "Contract not found"
**Solution**: 
- Verify contract address in config
- Check network is ApeChain Mainnet (33139)
- Verify ABI is correct

### "Transaction keeps failing"
**Solution**:
- Check wallet has balance (ETH + APE/USDC)
- Check token approval (may need to approve first)
- Check gas price (might be too low)
- Check contract isn't in transaction queue

### "Animation is jank/choppy"
**Solution**:
- Check Phaser frame rate (target 60)
- Reduce number of particles
- Profile with browser DevTools
- Check if other heavy code running

### "Catch attempts not syncing"
**Solution**:
- Verify event listener is set up
- Check contract is emitting events
- Check event filter parameters
- Test with browser DevTools Network tab

### "Math doesn't add up to 97% RTP"
**Solution**:
- Verify ball prices are correct
- Verify catch rates are correct
- Check if fees are included
- May need to adjust prices slightly

---

## FINAL SUBMISSION CHECKLIST

### Code Quality
- [ ] No console.log() statements
- [ ] No commented-out code
- [ ] Consistent naming conventions
- [ ] TypeScript strict mode passing
- [ ] ESLint passing: `npm run lint`
- [ ] No TypeScript errors
- [ ] Comments on complex logic

### Testing
- [ ] All contracts compile
- [ ] All tests passing
- [ ] Game fully playable end-to-end
- [ ] No major bugs found
- [ ] Multiplayer scenarios tested

### Documentation
- [ ] README updated with feature
- [ ] Installation instructions clear
- [ ] Architecture diagram included
- [ ] Tech stack documented
- [ ] Known limitations noted

### Demo
- [ ] Record 2-3 minute demo video showing:
  - [ ] Connect wallet
  - [ ] Purchase balls
  - [ ] See Pokemon spawn
  - [ ] Catch attempt
  - [ ] Success or failure
  - [ ] Inventory update

### Deployment
- [ ] Contracts deployed to ApeChain Mainnet
- [ ] Frontend hosted (Vercel, Netlify, etc.)
- [ ] Live demo URL provided
- [ ] All links working
- [ ] No console errors in production

### Competitive Edge
- [ ] Explain economic fairness (97% RTP)
- [ ] Highlight randomness (POP VRNG)
- [ ] Show technical depth
- [ ] Demonstrate polish
- [ ] Explain ecosystem integration

---

## BACKUP PLANS

### If Slab.cash integration doesn't work:
- Plan B: Mint NFTs from different collection
- Plan C: Use placeholder NFTs (store ID in contract)

### If POP VRNG is unavailable:
- Plan B: Use Chainlink VRF
- Plan C: Use simpler random mechanism

### If short on time:
- MVP Priority: Contracts + basic UI
- Polish: Animations, edge cases later
- Minimum viable: Buy balls, throw, result

---

## SUCCESS = 🏆

**You'll win with**:
1. ✨ Polish & completion (no bugs, everything works)
2. 🎮 Engaging game mechanics (fun to play)
3. 🔐 Technical sophistication (proxy contracts, VRF, multi-wallet)
4. 📊 Clear economics (fair 97% RTP explained)
5. 🌐 Ecosystem integration (Slab.cash, POP VRNG, ApeChain)
6. 📝 Clean code (readable, commented, tested)

**You already have**:
- ✅ Clear concept
- ✅ Feasible scope
- ✅ Existing foundation
- ✅ Sound economics
- ✅ Good team (you + Claude)

**Now just execute consistently and you'll crush it. 🚀**

---

**Status**: Ready to build
**Timeline**: 15-20 days
**Confidence**: 95%+ success with consistent execution
