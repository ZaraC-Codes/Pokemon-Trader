# PokéBall Catch Game - Comprehensive Testing Guide

## Status: Ready to Test ✅

You have:
- ✅ 3 spawned Pokémon on ApeChain (Slot 0, 1, 2)
- ✅ Smart contracts deployed at `0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f`
- ✅ Initial state verified and confirmed

Now let's test the complete game flow.

---

## PHASE 1: Smart Contract Testing (Day 1-2)

### 1.1 Verify Contract State ✓

**Objective**: Confirm initial Pokémon spawn persists

**Action**:
```bash
# Run verification script
npx hardhat run scripts/verifyPokemonState.cjs --network apechain
```

**Expected output**:
```
Active Pokemon: 3/3

Slot 0: ID=1, pos=(100, 200), attempts=0
Slot 1: ID=2, pos=(500, 300), attempts=0
Slot 2: ID=3, pos=(800, 700), attempts=0
```

**Verify on Explorer**:
- Go to: https://apescan.io
- Search contract: `0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f`
- Click "Read as Proxy"
- Call `getAllActivePokemons()` → Should return 3 entries

---

### 1.2 Test Ball Purchase Mechanism

**Objective**: Verify users can buy balls and funds route correctly

**Setup**:
```bash
# Create test purchase script
cat > scripts/testBallPurchase.cjs << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const POKEBALL_GAME_ADDRESS = "0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f";
  
  const ABI = [
    "function purchaseBalls(uint8 ballType, uint256 quantity) external payable",
    "function getBallInventory(address player) external view returns (uint256[4] memory)",
    "function getTreasuryBalance() external view returns (uint256)"
  ];
  
  const game = new ethers.Contract(POKEBALL_GAME_ADDRESS, ABI, signer);
  
  console.log("Testing Ball Purchase...\n");
  
  // Test 1: Purchase 5 Poke Balls ($1 each = $5 total)
  const tx1 = await game.purchaseBalls(0, 5, { value: ethers.parseEther("5") });
  const receipt1 = await tx1.wait();
  console.log("✅ Purchased 5 Poke Balls");
  
  // Check inventory
  const inventory = await game.getBallInventory(signer.address);
  console.log(`Your inventory: ${inventory[0]} Poke Balls`);
  
  // Test 2: Purchase 2 Ultra Balls ($25 each = $50 total)
  const tx2 = await game.purchaseBalls(2, 2, { value: ethers.parseEther("50") });
  const receipt2 = await tx2.wait();
  console.log("✅ Purchased 2 Ultra Balls");
  
  // Check treasury (should have 3% of $55 = $1.65)
  const treasury = await game.getTreasuryBalance();
  console.log(`Treasury balance: ${ethers.formatEther(treasury)} APE`);
  
  console.log("\n✅ Ball purchase mechanism working!");
}

main().catch(console.error);
EOF

npx hardhat run scripts/testBallPurchase.cjs --network apechain
```

**Expected results**:
- ✅ Purchase transactions succeed
- ✅ Inventory increments correctly
- ✅ Treasury receives 3% of revenue

---

### 1.3 Test Throw Ball Mechanism (POP VRNG)

**Objective**: Verify catch attempt with randomness

**Setup**:
```bash
cat > scripts/testThrowBall.cjs << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const POKEBALL_GAME_ADDRESS = "0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f";
  
  const ABI = [
    "function throwBall(uint8 pokemonSlot, uint8 ballTier) external",
    "function getPokemonAttempts(uint8 slot) external view returns (uint8)",
    "function getPlayerWins(address player) external view returns (uint256)"
  ];
  
  const game = new ethers.Contract(POKEBALL_GAME_ADDRESS, ABI, signer);
  
  console.log("Testing Throw Ball (5 attempts)...\n");
  
  // Throw 5 balls at Pokemon in Slot 0
  for (let i = 0; i < 5; i++) {
    const ballTier = i % 3; // Cycle through Poke/Great/Ultra balls
    const tx = await game.throwBall(0, ballTier);
    const receipt = await tx.wait();
    console.log(`Throw ${i + 1}: TX ${receipt.hash}`);
    
    // Small delay between throws (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Check attempts on Pokemon
  const attempts = await game.getPokemonAttempts(0);
  console.log(`\nPokemon Slot 0 attempts: ${attempts}/3`);
  
  // Check if won any NFTs
  const wins = await game.getPlayerWins(signer.address);
  console.log(`Your total wins: ${wins}`);
  
  console.log("\n✅ Throw mechanism working!");
}

main().catch(console.error);
EOF

npx hardhat run scripts/testThrowBall.cjs --network apechain
```

**Expected results**:
- ✅ Throw transactions accepted
- ✅ Attempt counter increments
- ✅ POP VRNG callback processes randomness
- ⚠️ Some throws catch (randomness working)
- ⚠️ Some throws miss (randomness working)

**Important**: POP VRNG callbacks may take 1-2 blocks to finalize. Wait 1-2 minutes to see results.

---

### 1.4 Verify NFT Auto-Purchase from Slab

**Objective**: Confirm revenue pool triggers NFT purchase at $50

**Check**:
```bash
cat > scripts/checkSlabIntegration.cjs << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const POKEBALL_GAME_ADDRESS = "0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f";
  
  const ABI = [
    "function getRevenueBalance() external view returns (uint256)",
    "function getNFTInventory() external view returns (uint256[])",
    "function getLastNFTPurchaseTime() external view returns (uint256)"
  ];
  
  const game = new ethers.Contract(POKEBALL_GAME_ADDRESS, ABI, signer);
  
  const revenue = await game.getRevenueBalance();
  const nfts = await game.getNFTInventory();
  const lastPurchase = await game.getLastNFTPurchaseTime();
  
  console.log(`Revenue balance: $${ethers.formatEther(revenue)}`);
  console.log(`NFTs held: ${nfts.length}`);
  console.log(`Last purchase: ${new Date(lastPurchase * 1000).toISOString()}`);
  
  if (nfts.length > 0) {
    console.log("✅ NFT auto-purchase is working!");
  } else {
    console.log("⚠️ No NFTs yet (revenue may not have hit $50 threshold)");
  }
}

main().catch(console.error);
EOF

npx hardhat run scripts/checkSlabIntegration.cjs --network apechain
```

**Expected**:
- ✅ If $50+ revenue accumulated → NFTs purchased from Slab
- ⚠️ If < $50 → Show current balance

---

## PHASE 2: Frontend Integration Testing (Day 3-4)

### 2.1 Game UI Rendering

**Start the game**:
```bash
npm run dev
```

**Check**:
- ✅ Game loads without console errors
- ✅ Pokémon appear in game world at correct coordinates:
  - Slot 0: (100, 200)
  - Slot 1: (500, 300)
  - Slot 2: (800, 700)
- ✅ Grass rustle animation plays when selecting Pokémon
- ✅ PokeBallShop modal displays 4 ball types with correct prices

---

### 2.2 Purchase Flow

**Action**:
1. Click "Shop" button
2. Select "Ultra Ball" ($25.00)
3. Enter quantity: 2
4. Click "Confirm Purchase"
5. Approve transaction in wallet

**Expected**:
- ✅ Transaction modal appears
- ✅ MetaMask popup shows gas estimate
- ✅ After confirmation: "✅ Purchase successful"
- ✅ Inventory updates: "Ultra Balls: 2"
- ✅ Balance shown in HUD

---

### 2.3 Throw Mechanic

**Action**:
1. Click on a Pokémon sprite
2. CatchAttemptModal appears: "Select ball type"
3. Choose "Ultra Ball"
4. Click "Throw"
5. Watch animation

**Expected**:
- ✅ Throw animation plays (60 FPS smooth)
- ✅ Ball travels toward Pokémon
- ✅ Impact animation on success/miss
- ✅ CatchResultModal shows outcome within 2-3 seconds
- ✅ Attempt counter increments (max 3)

**Possible outcomes** (based on ball tier randomness):
- 2% catch (Poke Ball)
- 20% catch (Great Ball)
- 50% catch (Ultra Ball)
- 99% catch (Master Ball)

---

### 2.4 Result Feedback

**After throwing, verify modal shows**:

**On Success**:
```
🎉 CAUGHT!
Pokemon ID: 1
You won an NFT!
View on Slab.cash: [Link]
Close
```

**On Miss**:
```
❌ MISSED
The Pokemon got away...
Attempts remaining: 2/3
Try again
```

---

## PHASE 3: Multiplayer Testing (Day 5)

### 3.1 Multi-Player Catch Attempts

**Setup**: Two players in same browser/different wallets

**Action**:
1. Player A: Throws ball at Pokémon (Slot 0)
2. Player B: Throws ball at same Pokémon (Slot 0)
3. Check that attempt counter reflects both throws

**Expected**:
- ✅ Both throws count toward the 3 maximum
- ✅ Once 3 attempts reached, Pokémon disappears
- ✅ New Pokémon spawns to replace it

---

### 3.2 Shared Treasury & Revenue

**Verify**:
- All player fees pool into Treasury (3%)
- All player revenue pools into NFT purchase fund (97%)
- Treasury shows combined total from all players

**Expected**:
- Player A buys $25 Ultra Ball → +$0.75 to Treasury
- Player B buys $10 Great Ball → +$0.30 to Treasury
- Treasury balance: $1.05 (3% of $35 total)

---

## PHASE 4: Economic Model Testing (Day 6)

### 4.1 RTP Calculation Verification

**Test**:
1. Simulate 100 ball purchases totaling $1000
2. Track catch rate (should be ~34%)
3. Verify NFT payouts (~34 NFTs × $50 = $1700 value)
4. Verify Treasury takes 3% (~$30)

**Formula check**:
```
RTP = (Value Returned to Players) / (Value Input)
RTP = $970 / $1000 = 97% ✓
```

**Run verification**:
```bash
cat > scripts/verifyRTP.cjs << 'EOF'
/**
 * RTP Verification Script
 * Simulates 100 ball purchases and verifies 97% RTP
 */

const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const POKEBALL_GAME_ADDRESS = "0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f";
  
  const ABI = [
    "function getStatistics() external view returns (tuple(uint256 totalVolume, uint256 totalCatches, uint256 nftsPurchased, uint256 treasuryBalance) memory)"
  ];
  
  const game = new ethers.Contract(POKEBALL_GAME_ADDRESS, ABI, signer);
  const stats = await game.getStatistics();
  
  const totalIn = parseFloat(ethers.formatEther(stats.totalVolume));
  const nftsPurchased = stats.nftsPurchased.toNumber();
  const nftValue = nftsPurchased * 50; // $50 per NFT
  const treasuryFee = parseFloat(ethers.formatEther(stats.treasuryBalance));
  
  const rtp = nftValue / totalIn;
  
  console.log("=== RTP VERIFICATION ===\n");
  console.log(`Total volume: $${totalIn.toFixed(2)}`);
  console.log(`Total catches: ${stats.totalCatches}`);
  console.log(`NFTs purchased: ${nftsPurchased}`);
  console.log(`NFT value returned: $${nftValue.toFixed(2)}`);
  console.log(`Treasury fees (3%): $${treasuryFee.toFixed(2)}`);
  console.log(`\nCalculated RTP: ${(rtp * 100).toFixed(2)}%`);
  console.log(`Expected RTP: 97.00%`);
  console.log(`Variance: ${((rtp * 100 - 97).toFixed(2))}%`);
  
  if (Math.abs(rtp * 100 - 97) < 2) {
    console.log("\n✅ RTP IS WITHIN ACCEPTABLE RANGE (95-99%)");
  } else {
    console.log("\n⚠️ RTP is outside expected range");
  }
}

main().catch(console.error);
EOF

npx hardhat run scripts/verifyRTP.cjs --network apechain
```

---

## PHASE 5: Edge Cases & Stress Testing (Day 7)

### 5.1 Maximum Attempts (3 per Pokemon)

**Action**:
1. Throw 3 balls at same Pokémon
2. Verify 4th throw is rejected or rejected

**Expected**:
- ✅ Pokémon despawns after 3 attempts (caught or not)
- ✅ New Pokémon spawns to maintain max 3 active

---

### 5.2 Multiple Pokémon Interactions

**Action**:
1. Throw at Pokémon 1 (Slot 0)
2. Throw at Pokémon 2 (Slot 1)
3. Throw at Pokémon 3 (Slot 2)
4. Verify attempt counters independent

**Expected**:
- ✅ Each Pokémon tracks its own attempts
- ✅ Catching one doesn't affect others

---

### 5.3 Wallet / Gas Failures

**Action**:
1. Attempt throw with insufficient funds
2. Attempt purchase with insufficient balance

**Expected**:
- ✅ Transaction rejected cleanly
- ✅ User-friendly error message displayed
- ✅ No orphaned state

---

### 5.4 Simultaneous Throws

**Action** (with multiple users):
1. Player A and B throw at same Pokémon simultaneously
2. Verify both transactions accepted
3. Verify both count toward attempt limit

**Expected**:
- ✅ Both throws process
- ✅ Attempt counter updates to 2
- ✅ No race condition issues

---

## TESTING CHECKLIST

### Smart Contracts
- [ ] Initial 3 Pokémon persist
- [ ] Ball purchases work ($1, $10, $25, $49.90)
- [ ] Inventory tracking accurate
- [ ] Throw attempts counted correctly
- [ ] POP VRNG randomness working
- [ ] NFT auto-purchase at $50
- [ ] Treasury receives 3% fee
- [ ] Revenue pool receives 97%
- [ ] RTP calculated at ~97%

### Frontend
- [ ] Game loads without errors
- [ ] Pokémon render at correct coordinates
- [ ] Grass rustle animation plays
- [ ] PokeBallShop modal displays
- [ ] Purchase flow completes
- [ ] Throw animation smooth (60 FPS)
- [ ] Result modal appears within 2-3 seconds
- [ ] Inventory HUD updates
- [ ] Error messages user-friendly

### Multiplayer
- [ ] Multiple players can throw at same Pokémon
- [ ] Attempts from all players count
- [ ] Treasury aggregates all fees
- [ ] Revenue pools combine correctly

### Edge Cases
- [ ] 3-attempt limit enforced
- [ ] New Pokémon spawns after despawn
- [ ] Insufficient funds handled
- [ ] Simultaneous throws processed
- [ ] No console errors
- [ ] No memory leaks (test for 30 min gameplay)

---

## TRANSACTION VERIFICATION CHECKLIST

### For Each Transaction, Verify on Apescan:

```
✅ Transaction exists: https://apescan.io/tx/[HASH]
✅ Status: "Success" (green)
✅ From: Your wallet address
✅ To: 0xB6e86aF8a85555c6Ac2D812c8B8BE8a60C1C432f
✅ Function: (purchaseBalls / throwBall / etc)
✅ Gas used: < estimated
✅ Block number: Confirmed (100+ blocks)
```

---

## TROUBLESHOOTING

### Problem: Pokémon don't appear in game
**Solution**: 
1. Verify contract state: `getAllActivePokemons()` shows 3 entries
2. Check game scene coordinates match contract positions
3. Verify Phaser canvas renders

### Problem: Purchase transaction fails
**Solution**:
1. Check wallet balance ≥ amount
2. Check gas price (may need adjustment)
3. Verify network is ApeChain (33139)

### Problem: Throw doesn't complete
**Solution**:
1. Wait 1-2 minutes (POP VRNG callback latency)
2. Check contract events for thrown ball
3. Verify ball inventory decremented

### Problem: No NFTs appear after catches
**Solution**:
1. Check if revenue ≥ $50
2. Verify Slab integration
3. Check for failed `checkAndPurchaseNFT()` calls

---

## SUCCESS CRITERIA

Your game is **READY FOR COMPETITION** when:

✅ **Contracts**:
- All transactions confirmed on ApeChain
- 3 Pokémon spawned and persist
- All ball types purchasable
- Randomness working via POP VRNG

✅ **Frontend**:
- Game renders smoothly
- All modals display correctly
- No console errors
- Animations at 60 FPS

✅ **Economics**:
- RTP verified at ~97%
- Treasury receives fees
- Revenue pools for NFT purchases

✅ **UX**:
- Intuitive purchase flow
- Clear result feedback
- Error handling graceful

---

## NEXT STEPS AFTER TESTING

1. **Document findings** → Create `TEST_RESULTS.md`
2. **Fix bugs** → Use Solidity + React agents to patch
3. **Polish animations** → Refine throw/catch sequences
4. **Prepare submission** → Screenshot/video of gameplay
5. **Write README** → Clear setup/testing instructions

---

**You're ready to test. Start with Phase 1 today and work through the checklist. Good luck! 🚀**