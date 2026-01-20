🎰 POP VRNG Integration Overview
What is POP VRNG?
Proof of Play's Verified Random Number Generator - a blockchain-native randomness oracle that provides cryptographically verifiable random numbers for smart contracts.

Key features:

✅ Verifiable randomness (players can verify it's fair)

✅ Fast delivery (1-2 blocks)

✅ On-chain callback pattern (async/await style)

✅ GameFi optimized (designed for games)

✅ Multi-chain support including ApeChain

How It Works (Your Game Flow)
Step 1: Player throws ball

text
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
Step 2: POP VRNG generates random number off-chain

Proof of Play generates cryptographic random number

Signs it with their oracle signature

Broadcasts to contract callback

Step 3: Callback determines catch result

text
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
